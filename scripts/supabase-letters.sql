-- =========================================================
-- Cartas (Gonza ↔ Juli)
-- Correr en: Dashboard → SQL Editor → New query. Se puede correr más de una
-- vez sin errores. Requiere que ya exista `notify_partner_on_insert()` (el
-- trigger de notificaciones de citas/pendientes, ver supabase-schema.sql).
-- =========================================================

-- opened_at: cuándo la abrió quien la recibe (null = sin abrir: la app
-- muestra el sobre a pantalla completa al entrar).
create table if not exists public.letters (
  id text primary key,
  from_person text not null check (from_person in ('gonza', 'juli')),
  to_person text not null check (to_person in ('gonza', 'juli')),
  body text not null,
  created_at timestamptz not null default now(),
  opened_at timestamptz,
  notified_at timestamptz
);

-- Mismo criterio que el resto del esquema: sin login, RLS sólo acota a la tabla.
alter table public.letters enable row level security;

drop policy if exists "acceso total letters" on public.letters;
create policy "acceso total letters" on public.letters
  for all using (true) with check (true);

-- Realtime: si la app está abierta cuando llega una carta, el sobre aparece solo
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'letters'
  ) then
    alter publication supabase_realtime add table public.letters;
  end if;
end $$;

-- Push: el mismo trigger que citas y pendientes. `notify-partner` reconoce la
-- tabla `letters` y le avisa a `to_person` con un link que abre esa carta.
drop trigger if exists letters_notify_partner on public.letters;
create trigger letters_notify_partner
  after insert on public.letters
  for each row execute function public.notify_partner_on_insert();
