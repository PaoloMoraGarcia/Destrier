-- Bihapia — esquema inicial
--
-- Fuente de verdad: BIHAPIA_CONTEXT.md. Las reglas de negocio que el documento
-- da por inviolables están aquí como constraints, no como convención: una regla
-- que solo vive en la capa de aplicación se salta sola en cuanto haya un segundo
-- cliente (panel de admin, script de importación, edge function).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type curiosity_kind as enum ('video', 'text');
create type visibility_state as enum ('public', 'unlisted', 'removed');
create type verification_status as enum ('none', 'pending', 'approved', 'rejected');
create type course_pricing_mode as enum ('free', 'one_time');
create type course_status as enum ('draft', 'in_review', 'published', 'unpublished');
create type purchase_status as enum ('pending', 'completed', 'refunded', 'failed');
create type store_platform as enum ('ios', 'android', 'web');
create type entitlement_source as enum ('purchase', 'free', 'grant');
create type interaction_type as enum ('like', 'save', 'view_complete');
create type promotion_target as enum ('course', 'curiosity');
create type promotion_status as enum ('draft', 'active', 'paused', 'ended');
create type report_status as enum ('open', 'reviewing', 'actioned', 'dismissed');
create type media_status as enum ('uploading', 'processing', 'ready', 'errored');

-- ---------------------------------------------------------------------------
-- Identidad
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9_]{3,30}$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  avatar_url text,
  bio text check (char_length(bio) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table profiles is 'Perfil público. 1:1 con auth.users.';

-- Verificación de identidad del §4. Es lo único que habilita el cobro: publicar
-- contenido gratuito no la necesita (modelo abierto tipo TikTok).
create table creator_verifications (
  profile_id uuid primary key references profiles (id) on delete cascade,
  status verification_status not null default 'none',
  -- Referencia opaca al proveedor de KYC. Aquí NO se guarda ningún documento ni
  -- dato personal de identidad: eso vive en el proveedor, no en nuestra base.
  kyc_provider text,
  kyc_reference text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  rejection_reason text,
  updated_at timestamptz not null default now()
);

create table follows (
  follower_id uuid not null references profiles (id) on delete cascade,
  followee_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint no_self_follow check (follower_id <> followee_id)
);

create index follows_followee_idx on follows (followee_id);

-- ---------------------------------------------------------------------------
-- Taxonomía
-- ---------------------------------------------------------------------------

create table categories (
  slug text primary key,
  name text not null,
  sort_order int not null default 0
);

-- Las 3 categorías del MVP (§8). "General curiosities" es el cajón de sastre a
-- propósito: es el motor de viralidad inicial.
insert into categories (slug, name, sort_order) values
  ('tech-web', 'Tech & Web', 1),
  ('business-sales', 'Business & Sales', 2),
  ('general-curiosities', 'General Curiosities', 3);

-- ---------------------------------------------------------------------------
-- Media
-- ---------------------------------------------------------------------------

-- El vídeo va desacoplado del contenido: un asset se sube una vez, se procesa
-- asíncronamente y puede sobrevivir a la curiosidad que lo usó.
create table media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  provider text not null default 'supabase',
  playback_id text,
  storage_path text,
  poster_url text,
  duration_ms int check (duration_ms > 0),
  width int,
  height int,
  status media_status not null default 'uploading',
  created_at timestamptz not null default now()
);

create index media_assets_owner_idx on media_assets (owner_id);

-- ---------------------------------------------------------------------------
-- Cursos
-- ---------------------------------------------------------------------------

create table courses (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles (id) on delete cascade,
  category_slug text not null references categories (slug),
  title text not null check (char_length(title) between 3 and 120),
  summary text check (char_length(summary) <= 600),
  cover_media_id uuid references media_assets (id) on delete set null,
  pricing_mode course_pricing_mode not null default 'free',
  -- MVP: precio único y simple (§3). Nada de suscripciones ni tramos: eso es v2.
  price_cents int check (price_cents > 0),
  currency char(3) not null default 'USD',
  status course_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Un curso gratuito no tiene precio y uno de pago siempre lo tiene. Sin esto
  -- acaban existiendo cursos 'one_time' a null que la app no sabe pintar.
  constraint price_matches_mode check (
    (pricing_mode = 'free' and price_cents is null)
    or (pricing_mode = 'one_time' and price_cents is not null)
  ),
  -- Rango acotado del §3: evita tanto el curso de 1 céntimo (fraude de ranking)
  -- como el de 500 € (fuera del posicionamiento del producto).
  constraint price_within_mvp_range check (
    price_cents is null or price_cents between 300 and 9900
  )
);

create index courses_author_idx on courses (author_id);
create index courses_published_idx on courses (category_slug, published_at desc)
  where status = 'published';

-- ---------------------------------------------------------------------------
-- Curiosidades
-- ---------------------------------------------------------------------------

-- Unidad mínima de contenido. Fíjate en lo que NO hay: ninguna columna de
-- precio. El §2 dice que la curiosidad es siempre gratis y nunca lleva paywall
-- — es el motor de descubrimiento. Lo que no existe no se puede saltar.
create table curiosities (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles (id) on delete cascade,
  category_slug text not null references categories (slug),
  kind curiosity_kind not null,

  -- kind = 'video'
  media_id uuid references media_assets (id) on delete set null,

  -- kind = 'text'
  text_body text check (char_length(text_body) <= 280),
  background_color char(7) check (background_color ~ '^#[0-9A-Fa-f]{6}$'),
  foreground_color char(7) check (foreground_color ~ '^#[0-9A-Fa-f]{6}$'),

  visibility visibility_state not null default 'public',
  created_at timestamptz not null default now(),

  constraint shape_matches_kind check (
    (kind = 'video' and media_id is not null and text_body is null)
    or (kind = 'text' and text_body is not null and background_color is not null)
  )
);

create index curiosities_author_idx on curiosities (author_id);
create index curiosities_feed_idx on curiosities (category_slug, created_at desc)
  where visibility = 'public';

-- Qué curiosidades componen un curso y en qué orden. Es una tabla aparte y no
-- un course_id en `curiosities` porque el §2 deja la puerta abierta a que una
-- misma curiosidad viva en varias colecciones (los feeds de nicho del roadmap).
create table course_items (
  course_id uuid not null references courses (id) on delete cascade,
  curiosity_id uuid not null references curiosities (id) on delete cascade,
  position int not null,
  -- Las de preview son las que salen al feed abierto y sirven de anzuelo.
  is_preview boolean not null default false,
  primary key (course_id, curiosity_id),
  unique (course_id, position) deferrable initially deferred
);

create index course_items_curiosity_idx on course_items (curiosity_id);

-- ---------------------------------------------------------------------------
-- Pagos y acceso
-- ---------------------------------------------------------------------------

-- Histórico inmutable de transacciones. Con IAP la fuente de verdad real es el
-- receipt del store; esta tabla es el reflejo local para conciliar y para pagar
-- al creador.
create table purchases (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references profiles (id) on delete restrict,
  course_id uuid not null references courses (id) on delete restrict,
  amount_cents int not null check (amount_cents > 0),
  currency char(3) not null,
  platform store_platform not null,
  provider text not null default 'revenuecat',
  provider_txn_id text not null,
  status purchase_status not null default 'pending',
  purchased_at timestamptz not null default now(),
  unique (provider, provider_txn_id)
);

create index purchases_buyer_idx on purchases (buyer_id);
create index purchases_course_idx on purchases (course_id);

-- Lo que la app consulta para desbloquear contenido. Va separado de `purchases`
-- por dos motivos: se puede regalar acceso sin inventar una compra falsa, y se
-- puede revocar por fraude sin tocar el histórico contable.
create table entitlements (
  user_id uuid not null references profiles (id) on delete cascade,
  course_id uuid not null references courses (id) on delete cascade,
  source entitlement_source not null,
  purchase_id uuid references purchases (id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (user_id, course_id)
);

create index entitlements_active_idx on entitlements (user_id)
  where revoked_at is null;

-- ---------------------------------------------------------------------------
-- Interacción social
-- ---------------------------------------------------------------------------

create table interactions (
  user_id uuid not null references profiles (id) on delete cascade,
  curiosity_id uuid not null references curiosities (id) on delete cascade,
  type interaction_type not null,
  created_at timestamptz not null default now(),
  primary key (user_id, curiosity_id, type)
);

create index interactions_curiosity_idx on interactions (curiosity_id, type);

-- Contadores desnormalizados: el feed no puede permitirse un count(*) por
-- tarjeta. Se mantienen con el trigger de más abajo.
create table curiosity_stats (
  curiosity_id uuid primary key references curiosities (id) on delete cascade,
  likes int not null default 0,
  saves int not null default 0,
  comments int not null default 0,
  views int not null default 0
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  curiosity_id uuid not null references curiosities (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  parent_id uuid references comments (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index comments_curiosity_idx on comments (curiosity_id, created_at desc)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- Posicionamiento pagado y moderación
-- ---------------------------------------------------------------------------

-- Capa de visibilidad del §3, separada de la venta de cursos: se puede promocionar
-- un curso o una curiosidad suelta.
create table promotions (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references profiles (id) on delete cascade,
  target_type promotion_target not null,
  target_id uuid not null,
  budget_cents int not null check (budget_cents > 0),
  spent_cents int not null default 0 check (spent_cents >= 0),
  currency char(3) not null default 'USD',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status promotion_status not null default 'draft',
  created_at timestamptz not null default now(),
  constraint window_is_valid check (ends_at > starts_at),
  constraint spend_within_budget check (spent_cents <= budget_cents)
);

create index promotions_active_idx on promotions (target_type, target_id)
  where status = 'active';

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles (id) on delete set null,
  target_type text not null check (target_type in ('curiosity', 'course', 'comment', 'profile')),
  target_id uuid not null,
  -- 'mlm' cubre la prohibición explícita del §4: esquemas piramidales y
  -- contenido "hazte rico rápido" están vetados desde el lanzamiento.
  reason text not null check (reason in ('spam', 'mlm', 'harassment', 'sexual', 'violence', 'ip', 'other')),
  detail text,
  status report_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index reports_open_idx on reports (status, created_at) where status = 'open';

-- ---------------------------------------------------------------------------
-- Reglas de negocio
-- ---------------------------------------------------------------------------

-- Gate KYC del §4: nadie cobra por un curso sin verificación aprobada.
-- Va en un trigger y no en la app porque es la única forma de que también lo
-- respete un script de importación o un panel de admin.
create or replace function enforce_paid_course_requires_verification()
returns trigger
language plpgsql
as $$
begin
  if new.pricing_mode = 'one_time' then
    if not exists (
      select 1 from creator_verifications v
      where v.profile_id = new.author_id and v.status = 'approved'
    ) then
      raise exception
        'El autor % no tiene verificación aprobada: no puede publicar un curso de pago.',
        new.author_id
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger courses_require_verification
  before insert or update of pricing_mode, author_id on courses
  for each row execute function enforce_paid_course_requires_verification();

-- Mantiene curiosity_stats al día sin que la app tenga que acordarse.
create or replace function sync_curiosity_stats()
returns trigger
language plpgsql
as $$
declare
  target uuid := coalesce(new.curiosity_id, old.curiosity_id);
  delta int := case when tg_op = 'INSERT' then 1 else -1 end;
  kind interaction_type := coalesce(new.type, old.type);
begin
  insert into curiosity_stats (curiosity_id) values (target)
  on conflict (curiosity_id) do nothing;

  update curiosity_stats
  set likes = likes + (case when kind = 'like' then delta else 0 end),
      saves = saves + (case when kind = 'save' then delta else 0 end),
      views = views + (case when kind = 'view_complete' then delta else 0 end)
  where curiosity_id = target;

  return null;
end;
$$;

create trigger interactions_sync_stats
  after insert or delete on interactions
  for each row execute function sync_curiosity_stats();

-- Cada curiosidad arranca con su fila de contadores.
create or replace function create_curiosity_stats()
returns trigger
language plpgsql
as $$
begin
  insert into curiosity_stats (curiosity_id) values (new.id)
  on conflict (curiosity_id) do nothing;
  return new;
end;
$$;

create trigger curiosities_create_stats
  after insert on curiosities
  for each row execute function create_curiosity_stats();
