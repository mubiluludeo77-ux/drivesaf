-- ============================================================
-- DriveSAF — règles métier côté serveur
-- Le navigateur n'écrit jamais directement dans « rides » : il appelle
-- ces fonctions (supabase.rpc(...)), qui vérifient tout.
-- Les valeurs reprennent src/data/config.ts : les garder synchronisées.
-- ============================================================

-- ------------------------------------------------------------
-- Profil créé automatiquement à l'inscription
-- ------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, phone, full_name)
  values (new.id, new.phone, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ------------------------------------------------------------
-- Distance et prix
-- ------------------------------------------------------------

-- Vol d'oiseau × 1,35 pour approcher la route (ponts inclus).
-- Sera remplacé par une API d'itinéraire (ticket 15).
create function public.road_km(
  a extensions.geography, b extensions.geography, same_sector boolean
)
returns numeric
language sql
immutable
set search_path = public, extensions, pg_temp
as $$
  select greatest(
    case when same_sector then 4 else 3 end,
    round((extensions.st_distance(a, b) / 1000.0 * 1.35)::numeric)
  );
$$;

-- 25 $ + 2,10 $/km, +20 % de 22 h à 6 h (heure d'Ottawa),
-- TVH 13 % si départ en Ontario, TPS + TVQ 14,975 % si départ au Québec.
create function public.fare_quote(
  km numeric, pickup_province public.province, at timestamptz default now()
)
returns table (price numeric, tax_label text, tax_amount numeric, total numeric, driver_payout numeric)
language sql
stable
set search_path = public, pg_temp
as $$
  with base as (
    select round(
      (25 + 2.10 * km)
      * case when extract(hour from at at time zone 'America/Toronto') >= 22
               or extract(hour from at at time zone 'America/Toronto') < 6
             then 1.2 else 1 end,
      2) as price
  ), tax as (
    select case pickup_province when 'ON' then 0.13 else 0.14975 end as rate,
           case pickup_province when 'ON' then 'TVH 13 %' else 'TPS + TVQ 14,975 %' end as label
  )
  select base.price,
         tax.label,
         round(base.price * tax.rate, 2),
         base.price + round(base.price * tax.rate, 2),
         round(base.price * 0.80, 2)
  from base, tax;
$$;

-- Minimum 1/4 de réservoir, et autonomie ≥ distance × 1,3 + 20 km
-- (un plein ≈ 500 km, estimation prudente).
create function public.fuel_ok(fuel_level numeric, km numeric)
returns boolean
language sql
immutable
as $$
  select fuel_level >= 0.25 and fuel_level * 500 >= km * 1.3 + 20;
$$;

-- ------------------------------------------------------------
-- Client : commander une course
-- ------------------------------------------------------------
create function public.request_ride(
  p_vehicle_id     uuid,
  p_pickup_address text,
  p_pickup_sector  text,
  p_pickup_lon     double precision,
  p_pickup_lat     double precision,
  p_dest_address   text,
  p_dest_sector    text,
  p_dest_lon       double precision,
  p_dest_lat       double precision,
  p_fuel_level     numeric,
  p_reason         text default null
)
returns public.rides
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_uid    uuid := auth.uid();
  v_from   public.service_sectors;
  v_to     public.service_sectors;
  v_pickup geography;
  v_dest   geography;
  v_km     numeric;
  v_quote  record;
  v_ride   public.rides;
begin
  if v_uid is null then
    raise exception 'Connexion requise' using errcode = '42501';
  end if;

  if not exists (select 1 from vehicles where id = p_vehicle_id and owner_id = v_uid) then
    raise exception 'Voiture introuvable' using errcode = '42501';
  end if;

  select * into v_from from service_sectors where id = p_pickup_sector;
  select * into v_to   from service_sectors where id = p_dest_sector;
  if v_from.id is null or v_to.id is null then
    raise exception 'Secteur inconnu' using errcode = '22023';
  end if;

  v_pickup := st_setsrid(st_makepoint(p_pickup_lon, p_pickup_lat), 4326)::geography;
  v_dest   := st_setsrid(st_makepoint(p_dest_lon, p_dest_lat), 4326)::geography;

  -- Chaque adresse doit être à moins de 8 km du centre de son secteur
  if not st_dwithin(v_pickup, v_from.center, 8000) or not st_dwithin(v_dest, v_to.center, 8000) then
    raise exception 'Adresse hors de la zone Ottawa–Gatineau' using errcode = '22023';
  end if;

  v_km := road_km(v_pickup, v_dest, v_from.id = v_to.id);

  if not fuel_ok(p_fuel_level, v_km) then
    raise exception 'Carburant insuffisant : minimum 1/4 de réservoir et assez d''autonomie pour le trajet'
      using errcode = '22023';
  end if;

  select * into v_quote from fare_quote(v_km, v_from.province, now());

  insert into rides (
    client_id, vehicle_id,
    pickup_address, pickup_sector, pickup_point,
    dest_address, dest_sector, dest_point,
    fuel_level, reason, distance_km,
    price, tax_label, tax_amount, total, driver_payout
  ) values (
    v_uid, p_vehicle_id,
    p_pickup_address, p_pickup_sector, v_pickup,
    p_dest_address, p_dest_sector, v_dest,
    p_fuel_level, p_reason, v_km,
    v_quote.price, v_quote.tax_label, v_quote.tax_amount, v_quote.total, v_quote.driver_payout
  )
  returning * into v_ride;

  insert into ride_secrets (ride_id, pin)
  values (v_ride.id, lpad(floor(random() * 10000)::int::text, 4, '0'));

  insert into ride_events (ride_id, status, actor_id) values (v_ride.id, 'searching', v_uid);

  return v_ride;
end;
$$;

-- ------------------------------------------------------------
-- Chauffeur : en ligne / hors ligne, position
-- ------------------------------------------------------------
create function public.set_driver_online(
  p_online boolean, p_lon double precision default null, p_lat double precision default null
)
returns public.drivers
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_driver public.drivers;
begin
  select * into v_driver from drivers where id = auth.uid();
  if v_driver.id is null then
    raise exception 'Compte chauffeur introuvable' using errcode = '42501';
  end if;

  if p_online then
    if v_driver.status <> 'approved' then
      raise exception 'Compte chauffeur pas encore approuvé' using errcode = '42501';
    end if;
    if v_driver.licence_expires < current_date then
      raise exception 'Permis expiré' using errcode = '42501';
    end if;
    if p_lon is null or p_lat is null then
      raise exception 'Position requise pour passer en ligne' using errcode = '22023';
    end if;
  end if;

  update drivers
     set is_online = p_online,
         location = case when p_lon is null then location
                         else st_setsrid(st_makepoint(p_lon, p_lat), 4326)::geography end,
         location_updated_at = case when p_lon is null then location_updated_at else now() end
   where id = v_driver.id
  returning * into v_driver;

  return v_driver;
end;
$$;

-- ------------------------------------------------------------
-- Déroulement d'une course
-- ------------------------------------------------------------

-- Petite aide : passe la course d'un statut à l'autre et note l'étape.
create function public.ride_transition(
  p_ride uuid, p_from public.ride_status, p_to public.ride_status, p_note text default null
)
returns public.rides
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ride public.rides;
begin
  update rides
     set status       = p_to,
         started_at   = case when p_to = 'trip'      then now() else started_at end,
         completed_at = case when p_to = 'done'      then now() else completed_at end,
         cancelled_at = case when p_to = 'cancelled' then now() else cancelled_at end,
         cancel_reason = case when p_to = 'cancelled' then p_note else cancel_reason end
   where id = p_ride and status = p_from
  returning * into v_ride;

  if v_ride.id is null then
    raise exception 'Étape impossible (la course n''est plus « % »)', p_from using errcode = '55000';
  end if;

  insert into ride_events (ride_id, status, actor_id, note) values (p_ride, p_to, auth.uid(), p_note);
  return v_ride;
end;
$$;

create function public.accept_ride(p_ride uuid)
returns public.rides
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid  uuid := auth.uid();
  v_ride public.rides;
begin
  if not exists (
    select 1 from drivers
     where id = v_uid and status = 'approved' and is_online and licence_expires >= current_date
  ) then
    raise exception 'Vous devez être un chauffeur approuvé et en ligne' using errcode = '42501';
  end if;

  update rides
     set driver_id = v_uid, status = 'enroute', accepted_at = now()
   where id = p_ride and status = 'searching'
  returning * into v_ride;

  if v_ride.id is null then
    raise exception 'Course déjà prise ou annulée' using errcode = '55000';
  end if;

  insert into ride_events (ride_id, status, actor_id) values (p_ride, 'enroute', v_uid);
  return v_ride;
end;
$$;

create function public.assert_ride_driver(p_ride uuid)
returns void
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from rides where id = p_ride and driver_id = auth.uid()) then
    raise exception 'Ce n''est pas votre course' using errcode = '42501';
  end if;
end;
$$;

create function public.mark_arrived(p_ride uuid)
returns public.rides
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform assert_ride_driver(p_ride);
  return ride_transition(p_ride, 'enroute', 'arrived');
end;
$$;

-- Démarrer : code du client + jauge vérifiée (≥ 1/4) obligatoires.
-- Retourne 'ok', 'wrong_pin' ou 'locked' (5 essais maximum).
create function public.start_ride(p_ride uuid, p_pin text, p_fuel_verified boolean)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_secret public.ride_secrets;
begin
  perform assert_ride_driver(p_ride);

  if not coalesce(p_fuel_verified, false) then
    raise exception 'Vérifiez d''abord la jauge de carburant (minimum 1/4)' using errcode = '22023';
  end if;

  select * into v_secret from ride_secrets where ride_id = p_ride for update;

  if v_secret.failed_attempts >= 5 then
    return 'locked';
  end if;

  if p_pin is distinct from v_secret.pin then
    update ride_secrets set failed_attempts = failed_attempts + 1 where ride_id = p_ride;
    return case when v_secret.failed_attempts + 1 >= 5 then 'locked' else 'wrong_pin' end;
  end if;

  update rides set fuel_verified = true where id = p_ride;
  perform ride_transition(p_ride, 'arrived', 'trip');
  return 'ok';
end;
$$;

create function public.mark_dropoff(p_ride uuid)
returns public.rides
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform assert_ride_driver(p_ride);
  return ride_transition(p_ride, 'trip', 'dropoff');
end;
$$;

create function public.finish_ride(p_ride uuid)
returns public.rides
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform assert_ride_driver(p_ride);
  return ride_transition(p_ride, 'dropoff', 'done');
end;
$$;

-- Le client annule avant que la course commence ; le chauffeur peut annuler
-- en route ou à l'arrivée (ex. carburant insuffisant).
create function public.cancel_ride(p_ride uuid, p_reason text default null)
returns public.rides
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ride public.rides;
begin
  select * into v_ride from rides where id = p_ride;

  if v_ride.client_id = auth.uid() and v_ride.status in ('searching', 'enroute') then
    return ride_transition(p_ride, v_ride.status, 'cancelled', coalesce(p_reason, 'Annulée par le client'));
  elsif v_ride.driver_id = auth.uid() and v_ride.status in ('enroute', 'arrived') then
    return ride_transition(p_ride, v_ride.status, 'cancelled', coalesce(p_reason, 'Annulée par le chauffeur'));
  end if;

  raise exception 'Annulation impossible à cette étape' using errcode = '42501';
end;
$$;

-- ------------------------------------------------------------
-- Notes
-- ------------------------------------------------------------
create function public.rate_ride(p_ride uuid, p_stars smallint, p_comment text default null)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ride   public.rides;
  v_target uuid;
begin
  select * into v_ride from rides where id = p_ride and status = 'done';

  if v_ride.id is null then
    raise exception 'Seule une course terminée peut être notée' using errcode = '55000';
  elsif v_ride.client_id = auth.uid() then
    v_target := v_ride.driver_id;
  elsif v_ride.driver_id = auth.uid() then
    v_target := v_ride.client_id;
  else
    raise exception 'Ce n''est pas votre course' using errcode = '42501';
  end if;

  insert into ratings (ride_id, author_id, target_id, stars, comment)
  values (p_ride, auth.uid(), v_target, p_stars, p_comment);

  update drivers
     set rating_avg = (select round(avg(stars), 2) from ratings where target_id = v_target)
   where id = v_target;
end;
$$;

-- ------------------------------------------------------------
-- Admin : approuver ou suspendre un chauffeur
-- ------------------------------------------------------------
create function public.set_driver_status(p_driver uuid, p_status public.driver_status)
returns public.drivers
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_driver public.drivers;
begin
  if not is_admin() then
    raise exception 'Réservé aux administrateurs' using errcode = '42501';
  end if;

  update drivers
     set status = p_status,
         is_online = case when p_status = 'approved' then is_online else false end
   where id = p_driver
  returning * into v_driver;

  if p_status = 'approved' then
    update profiles set role = 'driver' where id = p_driver and role = 'client';
  end if;

  return v_driver;
end;
$$;

-- ------------------------------------------------------------
-- Chauffeurs en ligne les plus proches d'un point (rayon en mètres)
-- ------------------------------------------------------------
create function public.nearest_drivers(
  p_lon double precision, p_lat double precision, p_radius_m integer default 8000, p_limit integer default 5
)
returns table (driver_id uuid, distance_m integer)
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  select d.id,
         round(st_distance(d.location, st_setsrid(st_makepoint(p_lon, p_lat), 4326)::geography))::integer
    from drivers d
   where d.is_online and d.status = 'approved' and d.licence_expires >= current_date
     and st_dwithin(d.location, st_setsrid(st_makepoint(p_lon, p_lat), 4326)::geography, p_radius_m)
   order by d.location <-> st_setsrid(st_makepoint(p_lon, p_lat), 4326)::geography
   limit p_limit;
$$;
