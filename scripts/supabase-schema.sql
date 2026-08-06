-- =========================================================
-- Esquema Supabase para "Citas Gonza & Juli"
-- Correr una sola vez en: Dashboard → SQL Editor → New query
-- =========================================================

-- ---------------------------------------------------------
-- Tabla: citas registradas ("Nuestras Citas")
-- ---------------------------------------------------------
create table if not exists public.dates (
  id text primary key,
  title text not null,
  date date not null,
  time text,
  duration text,
  categories text[] not null default '{}',
  locations jsonb not null default '[]',
  media_items jsonb not null default '[]',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Tabla: wishlist / bucket list de pareja
-- ---------------------------------------------------------
create table if not exists public.wishlist (
  id text primary key,
  title text not null,
  location text,
  category text,
  emoji text,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Tabla: mood del día ("¿Cómo te sentís hoy?")
-- Una fila por día (day como PK): si se toca otro emoji el mismo día, se
-- sobreescribe la fila en vez de acumular. Así el otro lado ve el último
-- estado de ánimo elegido para hoy, no un historial de clicks.
-- ---------------------------------------------------------
create table if not exists public.daily_moods (
  day date primary key,
  mood_id text not null,
  mood_emoji text not null,
  mood_label text not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Row Level Security
--
-- La app no tiene login (es para 2 personas, con la key publishable
-- embebida en el bundle). RLS acá NO restringe por usuario: sólo evita que,
-- por accidente o bug, alguien haga algo que no sea leer/escribir estas 3
-- tablas puntuales. La privacidad real depende de que la URL de la app y
-- este proyecto de Supabase no se compartan públicamente.
-- ---------------------------------------------------------
alter table public.dates enable row level security;
alter table public.wishlist enable row level security;
alter table public.daily_moods enable row level security;

drop policy if exists "acceso total dates" on public.dates;
create policy "acceso total dates" on public.dates
  for all using (true) with check (true);

drop policy if exists "acceso total wishlist" on public.wishlist;
create policy "acceso total wishlist" on public.wishlist
  for all using (true) with check (true);

drop policy if exists "acceso total daily_moods" on public.daily_moods;
create policy "acceso total daily_moods" on public.daily_moods
  for all using (true) with check (true);

-- ---------------------------------------------------------
-- Realtime: para que los cambios de un teléfono aparezcan solos en el otro
-- ---------------------------------------------------------
alter publication supabase_realtime add table public.dates;
alter publication supabase_realtime add table public.wishlist;
alter publication supabase_realtime add table public.daily_moods;

-- ---------------------------------------------------------
-- updated_at automático en `dates` cuando se edita una cita
-- ---------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists dates_set_updated_at on public.dates;
create trigger dates_set_updated_at
  before update on public.dates
  for each row execute function public.set_updated_at();
