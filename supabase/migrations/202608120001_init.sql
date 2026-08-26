-- HASILTANI local Supabase schema
create extension if not exists pgcrypto;

create type public.user_role as enum ('petani', 'buyer', 'admin');
create type public.verification_status as enum ('pending', 'verified', 'rejected');
create type public.offer_status as enum ('pending', 'accepted', 'rejected', 'cancelled');
create type public.pool_status as enum ('forming', 'ready', 'offered', 'closed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  name text not null,
  organization text,
  location text,
  verification_status public.verification_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.batches (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references public.profiles(id) on delete cascade,
  commodity text not null check (commodity in ('pisang','mangga','jeruk','tomat')),
  weight_kg numeric(10,2) not null check (weight_kg > 0),
  location text not null,
  harvest_date date not null,
  status text not null default 'draft',
  cover_image_url text,
  created_at timestamptz not null default now()
);

create table public.grading_results (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  condition_raw text not null,
  condition_label text not null,
  confidence numeric(6,5) not null,
  routing_status text not null check (routing_status in ('READY','REVIEW')),
  model_version text not null,
  mode text not null default 'model',
  created_at timestamptz not null default now()
);

create table public.use_recommendations (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  destination_type text not null,
  score integer not null check (score between 0 and 100),
  rule_version text not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table public.buyer_demands (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  commodity text not null check (commodity in ('pisang','mangga','jeruk','tomat')),
  accepted_conditions text[] not null,
  minimum_volume_kg numeric(10,2) not null check (minimum_volume_kg > 0),
  offer_price_per_kg integer not null check (offer_price_per_kg > 0),
  location text not null,
  radius_km numeric(8,2) not null default 30,
  deadline date not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table public.harvest_pools (
  id uuid primary key default gen_random_uuid(),
  target_demand_id uuid not null references public.buyer_demands(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  total_weight_kg numeric(10,2) not null default 0,
  status public.pool_status not null default 'forming',
  created_at timestamptz not null default now()
);

create table public.pool_members (
  pool_id uuid not null references public.harvest_pools(id) on delete cascade,
  batch_id uuid not null references public.batches(id) on delete cascade,
  accepted_weight_kg numeric(10,2) not null check (accepted_weight_kg > 0),
  primary key (pool_id, batch_id)
);

create table public.market_references (
  id uuid primary key default gen_random_uuid(),
  commodity text not null,
  variety_label text,
  reference_price_per_kg integer not null,
  market text not null,
  period text not null,
  source_url text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  demand_id uuid not null references public.buyer_demands(id) on delete cascade,
  batch_id uuid references public.batches(id) on delete cascade,
  pool_id uuid references public.harvest_pools(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  offered_price_per_kg integer not null,
  accepted_weight_kg numeric(10,2) not null,
  status public.offer_status not null default 'pending',
  created_at timestamptz not null default now(),
  check ((batch_id is not null) <> (pool_id is not null))
);

create table public.impact_records (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  weight_kg numeric(10,2) not null default 0,
  commodity text,
  related_id uuid,
  created_at timestamptz not null default now()
);

create table public.routing_rules (
  id uuid primary key default gen_random_uuid(),
  commodity text not null,
  condition_raw text not null,
  destination_type text not null,
  base_score integer not null check (base_score between 0 and 100),
  reason text not null,
  rule_version text not null default 'HASILTANI-R1.0',
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.moderation_flags (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_id uuid,
  reason text not null,
  status text not null default 'open',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Profile creation from signup metadata. Public signup should only use petani/buyer.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, role, name, organization, location, verification_status)
  values (
    new.id,
    case
      when coalesce(new.raw_user_meta_data ->> 'role', 'petani') = 'buyer' then 'buyer'::public.user_role
      else 'petani'::public.user_role
    end,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'organization',
    new.raw_user_meta_data ->> 'location',
    case when coalesce(new.raw_user_meta_data ->> 'role', 'petani') = 'petani'
         then 'verified'::public.verification_status
         else 'pending'::public.verification_status end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Helper functions for RLS.
create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

alter table public.profiles enable row level security;
alter table public.batches enable row level security;
alter table public.grading_results enable row level security;
alter table public.use_recommendations enable row level security;
alter table public.buyer_demands enable row level security;
alter table public.harvest_pools enable row level security;
alter table public.pool_members enable row level security;
alter table public.market_references enable row level security;
alter table public.offers enable row level security;
alter table public.impact_records enable row level security;
alter table public.routing_rules enable row level security;
alter table public.moderation_flags enable row level security;

create policy "profiles ecosystem read" on public.profiles for select using (public.current_role() is not null);
create policy "profiles self update" on public.profiles for update using (id = auth.uid() or public.current_role() = 'admin');

create policy "farmers own batches" on public.batches for all using (farmer_id = auth.uid() or public.current_role() = 'admin') with check (farmer_id = auth.uid() or public.current_role() = 'admin');
create policy "buyers read batches" on public.batches for select using (public.current_role() in ('buyer','admin'));

create policy "grading visible with batch" on public.grading_results for select using (
  exists (select 1 from public.batches b where b.id = batch_id and (b.farmer_id = auth.uid() or public.current_role() in ('buyer','admin')))
);
create policy "farmer inserts grading" on public.grading_results for insert with check (
  exists (select 1 from public.batches b where b.id = batch_id and b.farmer_id = auth.uid()) or public.current_role() = 'admin'
);

create policy "recommendations readable" on public.use_recommendations for select using (
  exists (select 1 from public.batches b where b.id = batch_id and (b.farmer_id = auth.uid() or public.current_role() in ('buyer','admin')))
);
create policy "recommendations insert own" on public.use_recommendations for insert with check (
  exists (select 1 from public.batches b where b.id = batch_id and b.farmer_id = auth.uid()) or public.current_role() = 'admin'
);

create policy "buyers manage own demand" on public.buyer_demands for all using (buyer_id = auth.uid() or public.current_role() = 'admin') with check (buyer_id = auth.uid() or public.current_role() = 'admin');
create policy "farmers read active demand" on public.buyer_demands for select using (status = 'active' and public.current_role() = 'petani');

create policy "pool participants read" on public.harvest_pools for select using (public.current_role() is not null);
create policy "farmers create pool" on public.harvest_pools for insert with check (created_by = auth.uid() or public.current_role() = 'admin');
create policy "pool creator update" on public.harvest_pools for update using (created_by = auth.uid() or public.current_role() = 'admin');
create policy "pool members read" on public.pool_members for select using (public.current_role() is not null);
create policy "pool members write" on public.pool_members for all using (public.current_role() in ('petani','admin')) with check (public.current_role() in ('petani','admin'));

create policy "market reference public read" on public.market_references for select using (true);
create policy "market reference admin write" on public.market_references for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

create policy "offers participants" on public.offers for select using (seller_id = auth.uid() or buyer_id = auth.uid() or public.current_role() = 'admin');
create policy "farmer creates offers" on public.offers for insert with check (seller_id = auth.uid() or public.current_role() = 'admin');
create policy "offer participants update" on public.offers for update using (seller_id = auth.uid() or buyer_id = auth.uid() or public.current_role() = 'admin');

create policy "impact authenticated read" on public.impact_records for select using (public.current_role() is not null);
create policy "impact participants insert" on public.impact_records for insert with check (actor_id = auth.uid() or public.current_role() = 'admin');

create policy "rules read" on public.routing_rules for select using (true);
create policy "rules admin write" on public.routing_rules for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "moderation admin" on public.moderation_flags for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

insert into public.market_references (commodity, variety_label, reference_price_per_kg, market, period, source_url, is_demo) values
('tomat','Tomat',12800,'Pasar Induk Kramat Jati','Juni 2026',null,false),
('pisang','Pisang Kavendis',14527,'Pasar Induk Kramat Jati','Juni 2026',null,false),
('mangga','Mangga Arumanis',23033,'Pasar Induk Kramat Jati','Juni 2026',null,false);
-- Jeruk belum diberi market reference sampai benchmark publik diverifikasi sebelum submission.

insert into public.routing_rules (commodity, condition_raw, destination_type, base_score, reason, rule_version) values
('tomat','ripe','Fresh Retail',97,'Tomat matang cocok untuk kebutuhan fresh dengan distribusi cepat.','HASILTANI-R1.0'),
('tomat','old','Sauce / Sambal / Puree',91,'Kandidat pengolahan setelah verifikasi manual.','HASILTANI-R1.0'),
('pisang','overripe','Bakery / Smoothie',94,'Kandidat pengolahan setelah verifikasi manual.','HASILTANI-R1.0'),
('mangga','ripe','Fresh Retail',97,'Kondisi matang cocok untuk pasar fresh.','HASILTANI-R1.0'),
('jeruk','ripe','Fresh Retail',97,'Jeruk matang cocok untuk permintaan fresh dengan distribusi relatif cepat.','HASILTANI-R1.0');

insert into public.moderation_flags (target_type, target_id, reason, status, created_by) values
('system-demo', null, 'Review konfigurasi route sebelum final competition build.', 'open', null);


-- Storage for batch photos.
insert into storage.buckets (id, name, public) values ('batch-photos','batch-photos',false)
on conflict (id) do nothing;

create policy "users upload own batch photos" on storage.objects for insert to authenticated
with check (bucket_id = 'batch-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users read own batch photos" on storage.objects for select to authenticated
using (bucket_id = 'batch-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.current_role() in ('buyer','admin')));
