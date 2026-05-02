-- ================================================================
--  HaulGo – Full Supabase Schema
--  Paste this entire file into:
--  Supabase Dashboard → SQL Editor → New Query → Run
-- ================================================================

create extension if not exists "uuid-ossp";

-- ── 1. PROFILES ─────────────────────────────────────────────────
create table public.profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  full_name  text not null default 'User',
  phone      text,
  role       text not null default 'customer' check (role in ('customer','driver','admin')),
  avatar_url text,
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 2. VEHICLES ─────────────────────────────────────────────────
create table public.vehicles (
  id          uuid default uuid_generate_v4() primary key,
  name        text not null,
  type        text not null check (type in ('bike','mini_truck','large_truck','heavy_freight')),
  capacity_kg int not null,
  base_fare   numeric(10,2) not null,
  per_km_rate numeric(10,2) not null,
  icon        text,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

insert into public.vehicles (name, type, capacity_kg, base_fare, per_km_rate, icon) values
  ('Bike / 2-Wheeler',  'bike',          20,    80,  18, '🛵'),
  ('Mini Truck',        'mini_truck',    500,   200,  45, '🚐'),
  ('Large Truck',       'large_truck',   5000,  400,  80, '🚛'),
  ('Heavy Freight',     'heavy_freight', 20000, 800, 140, '🏗️');

-- ── 3. CARGO TYPES ──────────────────────────────────────────────
create table public.cargo_types (
  id    uuid default uuid_generate_v4() primary key,
  name  text not null,
  slug  text not null unique,
  icon  text
);

insert into public.cargo_types (name, slug, icon) values
  ('General Goods', 'general',     '📦'),
  ('Industrial',    'industrial',  '🔩'),
  ('Cold Chain',    'cold_chain',  '🥶'),
  ('Hazardous',     'hazardous',   '⚗️'),
  ('Furniture',     'furniture',   '🛋️'),
  ('Agriculture',   'agriculture', '🌾');

-- ── 4. ORDER SEQUENCE ───────────────────────────────────────────
create sequence if not exists order_seq start 100;

-- ── 5. ORDERS ───────────────────────────────────────────────────
create table public.orders (
  id               uuid default uuid_generate_v4() primary key,
  order_number     text unique not null default ('HG-' || to_char(now(),'YYYY') || '-' || lpad(nextval('order_seq')::text,5,'0')),
  customer_id      uuid references public.profiles(id) not null,
  driver_id        uuid references public.profiles(id),
  vehicle_id       uuid references public.vehicles(id),
  cargo_type_id    uuid references public.cargo_types(id),
  pickup_address   text not null,
  pickup_lat       float,
  pickup_lng       float,
  drop_address     text not null,
  drop_lat         float,
  drop_lng         float,
  distance_km      numeric(8,2),
  duration_min     int,
  estimated_fare   numeric(10,2),
  final_fare       numeric(10,2),
  payment_method   text default 'cod' check (payment_method in ('cod','upi','card')),
  payment_status   text default 'pending' check (payment_status in ('pending','paid','refunded')),
  status           text default 'pending' check (status in ('pending','driver_assigned','picked_up','in_transit','delivered','cancelled')),
  notes            text,
  cancelled_reason text,
  scheduled_at     timestamptz,
  picked_up_at     timestamptz,
  delivered_at     timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger orders_updated_at
  before update on public.orders
  for each row execute function update_updated_at();

-- ── 6. ORDER STATUS HISTORY ─────────────────────────────────────
create table public.order_status_history (
  id         uuid default uuid_generate_v4() primary key,
  order_id   uuid references public.orders(id) on delete cascade,
  status     text not null,
  changed_by uuid references public.profiles(id),
  note       text,
  created_at timestamptz default now()
);

create or replace function log_order_status()
returns trigger language plpgsql as $$
begin
  if old.status is distinct from new.status then
    insert into public.order_status_history (order_id, status)
    values (new.id, new.status);
  end if;
  return new;
end;
$$;

create trigger orders_status_log
  after update on public.orders
  for each row execute function log_order_status();

-- ── 7. DRIVER DETAILS ───────────────────────────────────────────
create table public.driver_details (
  id            uuid references public.profiles(id) primary key,
  vehicle_type  text,
  vehicle_reg   text,
  license_no    text,
  is_available  boolean default true,
  current_lat   float,
  current_lng   float,
  rating        numeric(3,2) default 5.0,
  total_trips   int default 0,
  updated_at    timestamptz default now()
);

-- ── 8. ROW LEVEL SECURITY ───────────────────────────────────────
alter table public.profiles             enable row level security;
alter table public.orders               enable row level security;
alter table public.order_status_history enable row level security;
alter table public.driver_details       enable row level security;
alter table public.vehicles             enable row level security;
alter table public.cargo_types          enable row level security;

-- Helper function to check if current user is an admin (bypasses RLS to prevent infinite recursion)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Profiles
create policy "Users see own profile" on public.profiles
  for all using (auth.uid() = id);
create policy "Admins see all profiles" on public.profiles
  for all using (public.is_admin());

-- Orders: customers see own; admins see all; drivers see assigned
create policy "Customers own orders" on public.orders
  for all using (customer_id = auth.uid());
create policy "Admins all orders" on public.orders
  for all using (public.is_admin());
create policy "Drivers assigned orders" on public.orders
  for select using (driver_id = auth.uid());

-- Public read on vehicles and cargo types
create policy "Public vehicles"    on public.vehicles    for select using (true);
create policy "Public cargo types" on public.cargo_types for select using (true);

-- ── 9. ADMIN VIEW ───────────────────────────────────────────────
create or replace view admin_orders_view as
select
  o.id, o.order_number, o.status,
  o.pickup_address, o.drop_address,
  o.estimated_fare, o.final_fare, o.distance_km,
  o.payment_status, o.payment_method,
  o.created_at, o.picked_up_at, o.delivered_at,
  c.full_name  as customer_name,
  c.phone      as customer_phone,
  d.full_name  as driver_name,
  v.name       as vehicle_name,
  v.type       as vehicle_type,
  ct.name      as cargo_type
from public.orders o
join  public.profiles   c   on c.id  = o.customer_id
left join public.profiles d on d.id  = o.driver_id
left join public.vehicles v on v.id  = o.vehicle_id
left join public.cargo_types ct on ct.id = o.cargo_type_id
order by o.created_at desc;

-- ── 10. REALTIME (enable in Dashboard → Database → Replication) ─
-- Enable replication for: orders, order_status_history, driver_details
