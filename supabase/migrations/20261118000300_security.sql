-- ============================================================
-- DriveSAF — sécurité (Row Level Security + droits)
-- Règle de base : tout est interdit, sauf ce qui est autorisé ici.
-- ============================================================

alter table public.profiles         enable row level security;
alter table public.service_sectors  enable row level security;
alter table public.vehicles         enable row level security;
alter table public.drivers          enable row level security;
alter table public.driver_documents enable row level security;
alter table public.rides            enable row level security;
alter table public.ride_secrets     enable row level security;
alter table public.ride_events      enable row level security;
alter table public.payments         enable row level security;
alter table public.ratings          enable row level security;

-- ------------------------------------------------------------
-- Aides (security definer : évitent les boucles entre politiques)
-- ------------------------------------------------------------
create function public.is_ride_participant(p_ride uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from rides where id = p_ride and auth.uid() in (client_id, driver_id)
  );
$$;

-- Vrai si l'autre personne partage une course avec moi (pour voir son nom)
create function public.shares_ride_with(p_other uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from rides
     where (client_id = auth.uid() and driver_id = p_other)
        or (driver_id = auth.uid() and client_id = p_other)
  );
$$;

create function public.is_available_driver()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from drivers
     where id = auth.uid() and status = 'approved' and is_online and licence_expires >= current_date
  );
$$;

-- ------------------------------------------------------------
-- profiles : je vois mon profil, et celui de la personne avec qui j'ai une course
-- ------------------------------------------------------------
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.shares_ride_with(id) or public.is_admin());

-- Seul le nom est modifiable (le rôle et le téléphone vérifié, non)
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from anon, authenticated;
grant update (full_name) on public.profiles to authenticated;

-- ------------------------------------------------------------
-- service_sectors : lecture publique
-- ------------------------------------------------------------
create policy sectors_read on public.service_sectors for select to anon, authenticated using (true);

-- ------------------------------------------------------------
-- vehicles : chacun gère ses voitures ; le chauffeur voit celle de sa course
-- ------------------------------------------------------------
create policy vehicles_owner on public.vehicles for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy vehicles_driver_read on public.vehicles for select to authenticated
  using (exists (
    select 1 from public.rides r where r.vehicle_id = vehicles.id and r.driver_id = auth.uid()
  ));

-- ------------------------------------------------------------
-- drivers : inscription « en attente » seulement ; le reste passe par les fonctions
-- ------------------------------------------------------------
create policy drivers_self_read on public.drivers for select to authenticated
  using (id = auth.uid() or public.shares_ride_with(id) or public.is_admin());

create policy drivers_register on public.drivers for insert to authenticated
  with check (id = auth.uid() and status = 'pending' and not is_online);

-- ------------------------------------------------------------
-- driver_documents : le chauffeur dépose et voit ses documents ; l'admin voit tout
-- ------------------------------------------------------------
create policy documents_owner_read on public.driver_documents for select to authenticated
  using (driver_id = auth.uid() or public.is_admin());

create policy documents_owner_insert on public.driver_documents for insert to authenticated
  with check (driver_id = auth.uid() and verified_at is null);

create policy documents_admin_update on public.driver_documents for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- rides : lecture seulement ; création et changements par les fonctions
-- ------------------------------------------------------------
create policy rides_participants_read on public.rides for select to authenticated
  using (auth.uid() in (client_id, driver_id) or public.is_admin());

-- Un chauffeur disponible voit les demandes en attente
create policy rides_open_requests on public.rides for select to authenticated
  using (status = 'searching' and public.is_available_driver());

-- ------------------------------------------------------------
-- ride_secrets : seul le client voit son code
-- ------------------------------------------------------------
create policy secrets_client_read on public.ride_secrets for select to authenticated
  using (exists (select 1 from public.rides r where r.id = ride_id and r.client_id = auth.uid()));

-- ------------------------------------------------------------
-- ride_events, payments, ratings : lecture par les participants
-- ------------------------------------------------------------
create policy events_participants_read on public.ride_events for select to authenticated
  using (public.is_ride_participant(ride_id) or public.is_admin());

create policy payments_participants_read on public.payments for select to authenticated
  using (public.is_ride_participant(ride_id) or public.is_admin());

create policy ratings_participants_read on public.ratings for select to authenticated
  using (public.is_ride_participant(ride_id) or public.is_admin());

-- ------------------------------------------------------------
-- Fonctions : seules les actions prévues sont appelables depuis l'app
-- ------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function
  public.request_ride(uuid, text, text, double precision, double precision, text, text,
                      double precision, double precision, numeric, text),
  public.set_driver_online(boolean, double precision, double precision),
  public.accept_ride(uuid),
  public.mark_arrived(uuid),
  public.start_ride(uuid, text, boolean),
  public.mark_dropoff(uuid),
  public.finish_ride(uuid),
  public.cancel_ride(uuid, text),
  public.rate_ride(uuid, smallint, text),
  public.set_driver_status(uuid, public.driver_status),
  public.nearest_drivers(double precision, double precision, integer, integer),
  public.fare_quote(numeric, public.province, timestamptz),
  public.fuel_ok(numeric, numeric),
  public.road_km(extensions.geography, extensions.geography, boolean),
  -- utilisées à l'intérieur des politiques RLS
  public.is_admin(),
  public.is_ride_participant(uuid),
  public.shares_ride_with(uuid),
  public.is_available_driver()
to authenticated;

grant execute on function public.fare_quote(numeric, public.province, timestamptz) to anon;
