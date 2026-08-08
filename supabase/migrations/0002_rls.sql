-- Row Level Security.
--
-- La anon key va embebida en el bundle de la app: es pública por diseño. Lo que
-- protege los datos es exclusivamente lo que hay en este archivo. Cualquier tabla
-- sin RLS es una tabla legible por internet entero.

alter table profiles              enable row level security;
alter table creator_verifications enable row level security;
alter table follows               enable row level security;
alter table categories            enable row level security;
alter table media_assets          enable row level security;
alter table courses               enable row level security;
alter table curiosities           enable row level security;
alter table course_items          enable row level security;
alter table purchases             enable row level security;
alter table entitlements          enable row level security;
alter table interactions          enable row level security;
alter table curiosity_stats       enable row level security;
alter table comments              enable row level security;
alter table promotions            enable row level security;
alter table reports               enable row level security;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function has_course_access(target_course uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from entitlements e
    where e.user_id = auth.uid()
      and e.course_id = target_course
      and e.revoked_at is null
  );
$$;

-- ---------------------------------------------------------------------------
-- Lectura pública
-- ---------------------------------------------------------------------------

create policy "categories son públicas"
  on categories for select using (true);

create policy "perfiles son públicos"
  on profiles for select using (true);

create policy "cada uno edita su perfil"
  on profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "cada uno crea su perfil"
  on profiles for insert with check (id = auth.uid());

-- La curiosidad es el motor de descubrimiento (§2): pública para todo el mundo,
-- con sesión o sin ella.
create policy "curiosidades públicas visibles para todos"
  on curiosities for select using (visibility = 'public' or author_id = auth.uid());

create policy "el autor gestiona sus curiosidades"
  on curiosities for all
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "stats visibles con la curiosidad"
  on curiosity_stats for select using (true);

create policy "cursos publicados visibles para todos"
  on courses for select
  using (status = 'published' or author_id = auth.uid());

create policy "el autor gestiona sus cursos"
  on courses for all
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Paywall
-- ---------------------------------------------------------------------------

-- Aquí es donde vive el freemium. El índice del curso (qué lecciones tiene y en
-- qué orden) es visible siempre: es parte del escaparate. Lo que se protege es
-- el acceso al contenido de las que no son preview.
create policy "índice del curso visible"
  on course_items for select
  using (
    exists (
      select 1 from courses c
      where c.id = course_items.course_id
        and (c.status = 'published' or c.author_id = auth.uid())
    )
  );

create policy "el autor ordena su curso"
  on course_items for all
  using (
    exists (select 1 from courses c where c.id = course_items.course_id and c.author_id = auth.uid())
  )
  with check (
    exists (select 1 from courses c where c.id = course_items.course_id and c.author_id = auth.uid())
  );

-- El media de una curiosidad de pago solo se sirve a quien tiene derecho. Es la
-- única barrera real: si el playback_id se lee, el vídeo se ve.
create policy "media accesible según derechos"
  on media_assets for select
  using (
    owner_id = auth.uid()
    -- Media de una curiosidad suelta o de preview: siempre accesible.
    or exists (
      select 1 from curiosities cu
      where cu.media_id = media_assets.id
        and cu.visibility = 'public'
        and (
          not exists (select 1 from course_items ci where ci.curiosity_id = cu.id)
          or exists (select 1 from course_items ci where ci.curiosity_id = cu.id and ci.is_preview)
        )
    )
    -- Media de una lección de pago: solo con entitlement vigente.
    or exists (
      select 1 from curiosities cu
      join course_items ci on ci.curiosity_id = cu.id
      where cu.media_id = media_assets.id
        and has_course_access(ci.course_id)
    )
  );

create policy "el dueño gestiona su media"
  on media_assets for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Datos privados del usuario
-- ---------------------------------------------------------------------------

create policy "cada uno ve sus compras"
  on purchases for select using (buyer_id = auth.uid());

-- Nadie escribe compras desde el cliente: las crea el webhook del proveedor de
-- pago con la service role key, que ignora RLS. No hay policy de insert a
-- propósito — un cliente que pudiera insertar aquí se regalaría cursos.

create policy "cada uno ve sus accesos"
  on entitlements for select using (user_id = auth.uid());

create policy "cada uno ve y firma su verificación"
  on creator_verifications for select using (profile_id = auth.uid());

-- El cambio de status a 'approved' lo hace la revisión interna con service role,
-- nunca el propio creador.
create policy "cada uno solicita su verificación"
  on creator_verifications for insert with check (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Interacción social
-- ---------------------------------------------------------------------------

create policy "interacciones propias"
  on interactions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "comentarios visibles"
  on comments for select using (deleted_at is null);

create policy "comentar con sesión"
  on comments for insert with check (author_id = auth.uid());

create policy "borrar el comentario propio"
  on comments for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "follows visibles"
  on follows for select using (true);

create policy "seguir en nombre propio"
  on follows for all
  using (follower_id = auth.uid())
  with check (follower_id = auth.uid());

create policy "promociones propias"
  on promotions for all
  using (sponsor_id = auth.uid())
  with check (sponsor_id = auth.uid());

-- Un reporte se puede crear pero no leer: si el reportado pudiera consultarlos,
-- la moderación deja de ser segura para quien reporta.
create policy "reportar con sesión"
  on reports for insert with check (reporter_id = auth.uid());
