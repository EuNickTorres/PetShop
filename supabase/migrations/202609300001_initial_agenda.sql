-- Dayana Peluquería: private agenda and financial records.
-- Every row belongs to one authenticated Supabase user. Row Level Security
-- prevents one account from reading or changing another account's data.

create extension if not exists pgcrypto;

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  phone text not null default '',
  identity_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  unique (owner_id, identity_key)
);

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null,
  name text not null check (char_length(trim(name)) between 1 and 120),
  name_key text not null,
  species text not null check (species in ('Perro', 'Gato')),
  breed text not null default '',
  size text not null check (size in ('Pequeño', 'Mediano', 'Grande')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  unique (owner_id, client_id, name_key),
  foreign key (owner_id, client_id)
    references public.clients(owner_id, id)
    on delete cascade
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null,
  pet_id uuid not null,
  appointment_date date not null,
  appointment_time time not null,
  duration_minutes integer not null check (duration_minutes between 5 and 1440),
  service text not null check (char_length(trim(service)) between 1 and 160),
  price_cents integer not null default 0 check (price_cents >= 0),
  status text not null check (status in (
    'pending', 'confirmed', 'arrived', 'in_progress',
    'ready', 'completed', 'cancelled', 'no_show'
  )),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  foreign key (owner_id, client_id)
    references public.clients(owner_id, id)
    on delete restrict,
  foreign key (owner_id, pet_id)
    references public.pets(owner_id, id)
    on delete restrict
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  appointment_id uuid not null,
  amount_cents integer not null check (amount_cents > 0),
  method text not null check (method in ('cash', 'card', 'transfer', 'other')),
  paid_on date not null,
  created_at timestamptz not null default now(),
  foreign key (owner_id, appointment_id)
    references public.appointments(owner_id, id)
    on delete cascade
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  expense_date date not null,
  description text not null check (char_length(trim(description)) between 1 and 240),
  category text not null check (category in (
    'Productos', 'Alquiler', 'Suministros', 'Equipamiento', 'Otros'
  )),
  amount_cents integer not null check (amount_cents > 0),
  status text not null check (status in ('planned', 'paid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index appointments_owner_date_idx
  on public.appointments(owner_id, appointment_date, appointment_time);
create index payments_owner_date_idx
  on public.payments(owner_id, paid_on);
create index expenses_owner_date_idx
  on public.expenses(owner_id, expense_date);
create index pets_owner_client_idx
  on public.pets(owner_id, client_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

create trigger pets_set_updated_at
before update on public.pets
for each row execute function public.set_updated_at();

create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

create trigger expenses_set_updated_at
before update on public.expenses
for each row execute function public.set_updated_at();

alter table public.clients enable row level security;
alter table public.pets enable row level security;
alter table public.appointments enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;

create policy "owners manage their clients"
on public.clients for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "owners manage their pets"
on public.pets for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "owners manage their appointments"
on public.appointments for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "owners manage their payments"
on public.payments for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "owners manage their expenses"
on public.expenses for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

revoke all on public.clients from anon;
revoke all on public.pets from anon;
revoke all on public.appointments from anon;
revoke all on public.payments from anon;
revoke all on public.expenses from anon;

grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.pets to authenticated;
grant select, insert, update, delete on public.appointments to authenticated;
grant select, insert, update, delete on public.payments to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;
