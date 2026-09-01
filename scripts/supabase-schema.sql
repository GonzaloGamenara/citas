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
-- Quién agregó cada cosa.
--
-- Sin esto no se puede notificar: la notificación tiene que ir al OTRO, no a
-- quien acaba de escribir. `alter table ... add column if not exists` hace
-- que esto funcione tanto en una base nueva como en una que ya tenía datos.
-- ---------------------------------------------------------
alter table public.dates add column if not exists created_by text;
alter table public.wishlist add column if not exists created_by text;

-- ---------------------------------------------------------
-- Tabla: a qué dispositivos mandarle notificaciones
-- Una fila por navegador/dispositivo. Si alguien tiene la app en el iPhone y
-- en un iPad, son dos filas con el mismo user_key.
-- ---------------------------------------------------------
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_key text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_key_idx
  on public.push_subscriptions (user_key);

-- ---------------------------------------------------------
-- Tabla: estado del mazo de Cartas ("Desconectados")
-- Una fila por carta, y sólo para las cartas que tienen algo que contar:
-- si deja de estar vista y de ser favorita, la fila se borra.
--
-- Va al servidor y no a localStorage porque el mazo se juega de a dos: si el
-- progreso fuera local, cada teléfono repetiría cartas que ya jugaron juntos
-- y las favoritas de uno no las vería nunca el otro.
-- ---------------------------------------------------------
create table if not exists public.card_state (
  card_id integer primary key,
  is_favorite boolean not null default false,
  seen boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Row Level Security
--
-- La app no tiene login (es para 2 personas, con la key publishable
-- embebida en el bundle). RLS acá NO restringe por usuario: sólo evita que,
-- por accidente o bug, alguien haga algo que no sea leer/escribir estas 5
-- tablas puntuales. La privacidad real depende de que la URL de la app y
-- este proyecto de Supabase no se compartan públicamente.
-- ---------------------------------------------------------
alter table public.dates enable row level security;
alter table public.wishlist enable row level security;
alter table public.daily_moods enable row level security;
alter table public.card_state enable row level security;
alter table public.push_subscriptions enable row level security;

drop policy if exists "acceso total dates" on public.dates;
create policy "acceso total dates" on public.dates
  for all using (true) with check (true);

drop policy if exists "acceso total wishlist" on public.wishlist;
create policy "acceso total wishlist" on public.wishlist
  for all using (true) with check (true);

drop policy if exists "acceso total daily_moods" on public.daily_moods;
create policy "acceso total daily_moods" on public.daily_moods
  for all using (true) with check (true);

drop policy if exists "acceso total card_state" on public.card_state;
create policy "acceso total card_state" on public.card_state
  for all using (true) with check (true);

drop policy if exists "acceso total push_subscriptions" on public.push_subscriptions;
create policy "acceso total push_subscriptions" on public.push_subscriptions
  for all using (true) with check (true);

-- ---------------------------------------------------------
-- Realtime: para que los cambios de un teléfono aparezcan solos en el otro
-- ---------------------------------------------------------
-- `alter publication ... add table` explota si la tabla ya está publicada
-- ("already member of publication"), así que este archivo se puede correr
-- entero las veces que haga falta sin errores.
do $$
declare
  t text;
begin
  foreach t in array array['dates', 'wishlist', 'daily_moods', 'card_state'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------
-- updated_at automático al editar una fila
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

drop trigger if exists card_state_set_updated_at on public.card_state;
create trigger card_state_set_updated_at
  before update on public.card_state
  for each row execute function public.set_updated_at();

-- =========================================================
-- NOTIFICACIONES: conectar los INSERT con la Edge Function
--
-- Lo más simple es hacerlo desde el Dashboard:
--   Database → Webhooks → Create a new hook
--   · Tabla: dates    | Evento: Insert | Tipo: Supabase Edge Functions
--   · Tabla: wishlist | Evento: Insert | Tipo: Supabase Edge Functions
--   · Función: notify-partner
-- El Dashboard se encarga solo de la autenticación, así que no hay que
-- guardar ninguna key en este archivo.
--
-- Si preferís hacerlo por SQL, descomentá lo de abajo DESPUÉS de correr una
-- sola vez (con tu propia anon key, que así no queda versionada acá):
--
--   alter database postgres set app.settings.notify_url =
--     'https://TU-PROYECTO.supabase.co/functions/v1/notify-partner';
--   alter database postgres set app.settings.notify_key = 'TU_ANON_KEY';
-- =========================================================

-- create extension if not exists pg_net with schema extensions;
--
-- create or replace function public.notify_partner_on_insert()
-- returns trigger
-- language plpgsql
-- security definer
-- as $$
-- begin
--   perform net.http_post(
--     url := current_setting('app.settings.notify_url', true),
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || current_setting('app.settings.notify_key', true)
--     ),
--     body := jsonb_build_object(
--       'type', 'INSERT',
--       'table', TG_TABLE_NAME,
--       'record', to_jsonb(NEW)
--     )
--   );
--   return NEW;
-- end;
-- $$;
--
-- drop trigger if exists dates_notify_partner on public.dates;
-- create trigger dates_notify_partner
--   after insert on public.dates
--   for each row execute function public.notify_partner_on_insert();
--
-- drop trigger if exists wishlist_notify_partner on public.wishlist;
-- create trigger wishlist_notify_partner
--   after insert on public.wishlist
--   for each row execute function public.notify_partner_on_insert();
