-- New Era Commercial Performance Intelligence Platform schema

create table if not exists public.outlets (
  id uuid primary key default gen_random_uuid(),
  outlet_name text not null unique,
  distribution_point text,
  created_at timestamptz not null default now()
);

create table if not exists public.returns_records (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  return_date date not null,
  returned_copies integer not null check (returned_copies >= 0),
  created_at timestamptz not null default now(),
  unique (outlet_id, return_date)
);

create table if not exists public.event_calendar (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,
  event_name text not null,
  event_type text not null default 'campaign',
  expected_impact text,
  created_at timestamptz not null default now(),
  unique(event_date, event_name)
);

alter table public.sales_records
  alter column dataset_id drop not null;

alter table public.sales_records
  add column if not exists outlet_id uuid references public.outlets(id) on delete set null,
  add column if not exists source text not null default 'csv';

create index if not exists idx_sales_records_outlet_date on public.sales_records(outlet_id, record_date);
create index if not exists idx_returns_records_outlet_date on public.returns_records(outlet_id, return_date);
create index if not exists idx_event_calendar_date on public.event_calendar(event_date);
