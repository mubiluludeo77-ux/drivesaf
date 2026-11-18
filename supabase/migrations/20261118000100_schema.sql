-- ============================================================
-- DriveSAF — schéma v1
-- Base : PostgreSQL + PostGIS (Supabase, région Canada Central)
-- ============================================================

create schema if not exists extensions;
create extension if not exists postgis with schema extensions;

-- ------------------------------------------------------------
-- Types
-- ------------------------------------------------------------
create type public.user_role      as enum ('client', 'driver', 'admin');
create type public.province       as enum ('ON', 'QC');
-- Permis acceptés seulement : G2 / G (Ontario), classe 5 probatoire / classe 5 (Québec).
-- Les permis d'apprenti (G1, apprenti QC) ne peuvent même pas être enregistrés.
create type public.licence_class  as enum ('G2', 'G', 'QCP', 'QC5');
create type public.driver_status  as enum ('pending', 'approved', 'suspended');
create type public.ride_status    as enum ('searching', 'enroute', 'arrived', 'trip', 'dropoff', 'done', 'cancelled');
create type public.gearbox        as enum ('auto', 'manuelle');
create type public.document_kind  as enum ('licence_front', 'licence_back', 'driving_record', 'background_check');
create type public.payment_status as enum ('authorized', 'captured', 'refunded', 'failed');

-- ------------------------------------------------------------
-- Utilisateurs (une ligne par compte Supabase Auth, créée par trigger)
-- ------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null default '',
  phone      text unique,
  role       public.user_role not null default 'client',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Zone de service Ottawa–Gatineau
-- ------------------------------------------------------------
create table public.service_sectors (
  id       text primary key,
  name     text not null,
  province public.province not null,
  center   extensions.geography(point, 4326) not null
);

-- ------------------------------------------------------------
-- Voitures des clients
-- ------------------------------------------------------------
create table public.vehicles (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  make_model text not null check (length(trim(make_model)) > 0),
  plate      text not null check (length(trim(plate)) between 2 and 10),
  gearbox    public.gearbox not null default 'auto',
  province   public.province not null,
  created_at timestamptz not null default now(),
  unique (owner_id, plate)
);

-- ------------------------------------------------------------
-- Chauffeurs
-- ------------------------------------------------------------
create table public.drivers (
  id                  uuid primary key references public.profiles (id) on delete cascade,
  licence_class       public.licence_class not null,
  licence_province    public.province not null,
  licence_expires     date not null,
  status              public.driver_status not null default 'pending',
  is_online           boolean not null default false,
  location            extensions.geography(point, 4326),
  location_updated_at timestamptz,
  rating_avg          numeric(3, 2) not null default 5.00,
  created_at          timestamptz not null default now(),

  constraint licence_matches_province check (
    (licence_province = 'ON' and licence_class in ('G2', 'G')) or
    (licence_province = 'QC' and licence_class in ('QCP', 'QC5'))
  ),
  constraint online_requires_location check (not is_online or location is not null)
);

-- Recherche rapide des chauffeurs en ligne les plus proches
create index drivers_online_location_idx on public.drivers using gist (location) where is_online;

create table public.driver_documents (
  id          uuid primary key default gen_random_uuid(),
  driver_id   uuid not null references public.drivers (id) on delete cascade,
  kind        public.document_kind not null,
  file_path   text not null,                -- chemin dans Supabase Storage (seau privé)
  expires_on  date,
  verified_at timestamptz,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Courses
-- ------------------------------------------------------------
create table public.rides (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.profiles (id),
  driver_id      uuid references public.drivers (id),
  vehicle_id     uuid not null references public.vehicles (id),
  status         public.ride_status not null default 'searching',

  pickup_address text not null,
  pickup_sector  text not null references public.service_sectors (id),
  pickup_point   extensions.geography(point, 4326) not null,
  dest_address   text not null,
  dest_sector    text not null references public.service_sectors (id),
  dest_point     extensions.geography(point, 4326) not null,

  fuel_level     numeric(3, 2) not null check (fuel_level between 0.25 and 1),  -- minimum 1/4
  fuel_verified  boolean not null default false,                                -- coché par le chauffeur
  reason         text,

  distance_km    numeric(6, 2) not null check (distance_km > 0),
  price          numeric(8, 2) not null,   -- avant taxes
  tax_label      text not null,
  tax_amount     numeric(8, 2) not null,
  total          numeric(8, 2) not null,
  driver_payout  numeric(8, 2) not null,   -- 80 % du prix avant taxes

  created_at     timestamptz not null default now(),
  accepted_at    timestamptz,
  started_at     timestamptz,
  completed_at   timestamptz,
  cancelled_at   timestamptz,
  cancel_reason  text,

  constraint driver_required check (status in ('searching', 'cancelled') or driver_id is not null)
);

create index rides_client_idx    on public.rides (client_id, created_at desc);
create index rides_driver_idx    on public.rides (driver_id, created_at desc);
create index rides_searching_idx on public.rides using gist (pickup_point) where status = 'searching';
-- Une seule course active à la fois par client et par chauffeur
create unique index rides_one_active_per_client on public.rides (client_id)
  where status not in ('done', 'cancelled');
create unique index rides_one_active_per_driver on public.rides (driver_id)
  where status not in ('done', 'cancelled') and driver_id is not null;

-- Code de sécurité : table à part pour que le chauffeur ne puisse jamais le lire
create table public.ride_secrets (
  ride_id         uuid primary key references public.rides (id) on delete cascade,
  pin             char(4) not null check (pin ~ '^[0-9]{4}$'),
  failed_attempts smallint not null default 0
);

-- Historique horodaté de chaque étape (preuve en cas de litige)
create table public.ride_events (
  id       bigint generated always as identity primary key,
  ride_id  uuid not null references public.rides (id) on delete cascade,
  status   public.ride_status not null,
  actor_id uuid references public.profiles (id),
  note     text,
  at       timestamptz not null default now()
);
create index ride_events_ride_idx on public.ride_events (ride_id, at);

-- ------------------------------------------------------------
-- Paiements (Stripe) et notes
-- ------------------------------------------------------------
create table public.payments (
  ride_id          uuid primary key references public.rides (id),
  stripe_intent_id text unique not null,    -- aucune donnée de carte chez nous
  amount           numeric(8, 2) not null,
  driver_payout    numeric(8, 2) not null,
  status           public.payment_status not null,
  updated_at       timestamptz not null default now()
);

create table public.ratings (
  ride_id    uuid not null references public.rides (id) on delete cascade,
  author_id  uuid not null references public.profiles (id),
  target_id  uuid not null references public.profiles (id),
  stars      smallint not null check (stars between 1 and 5),
  comment    text,
  created_at timestamptz not null default now(),
  primary key (ride_id, author_id)
);
create index ratings_target_idx on public.ratings (target_id);
