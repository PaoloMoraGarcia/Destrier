-- La página de venta del curso.
--
-- Es el escaparate público: la URL que el creador enseña a su audiencia y la
-- que indexa Google. Hasta ahora un curso no tenía forma de tener URL, porque
-- solo se identificaba por uuid.
--
-- La referencia declarada es Skool, y lo que se toma de ella es la simplicidad
-- —una sola página, un solo botón— no su motor. Skool gamifica: puntos por
-- like, niveles y tablas de clasificación. Eso es justo lo contrario de este
-- producto, así que aquí no hay nada de eso, y **tampoco cifras de alumnos ni
-- valoraciones**: enseñar "312 alumnos" es la misma comparación social por otra
-- vía. La prueba de que el curso vale es que se ve una lección entera gratis
-- antes de pagar, que es lo que `course_items.is_preview` ya permite.
--
-- Lo que sí se añade, y es lo que Skool no tiene: el creador compone su página.

-- ---------------------------------------------------------------------------
-- La URL
-- ---------------------------------------------------------------------------

alter table courses add column slug text;

alter table courses add constraint slug_shape
  check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

alter table courses add constraint slug_length
  check (slug is null or char_length(slug) between 3 and 60);

-- Único por autor, no global: la URL lleva el `handle` delante, así que dos
-- creadores pueden llamar "empezar-de-cero" a su curso sin pisarse. Global
-- obligaría al segundo a inventarse un nombre peor por algo que no es problema
-- suyo.
create unique index courses_author_slug_key on courses (author_id, slug)
  where slug is not null;

comment on column courses.slug is
  'Parte del curso en la URL pública /[handle]/[slug]. Único por autor.';

-- Palabras que el panel se reserva.
--
-- La URL pública es `/[handle]/[slug]`, así que el handle ocupa el primer tramo
-- y compite con las rutas del estudio. Hoy no chocan —las del panel tienen un
-- solo tramo— pero en cuanto exista `/cursos/[id]`, quien tuviera el handle
-- `cursos` se quedaría con su página inalcanzable. Y un handle no se le puede
-- quitar a alguien después sin romperle todos los enlaces que ya ha repartido,
-- así que se impide antes de que ocurra.
alter table profiles add constraint handle_not_reserved
  check (handle not in (
    'cursos', 'perfil', 'pagina', 'resumen', 'ajustes', 'login', 'logout',
    'api', 'admin', 'studio', 'estudio', 'app', 'www', 'bihapia'
  ));

-- ---------------------------------------------------------------------------
-- Lo que el creador compone
-- ---------------------------------------------------------------------------

create type landing_theme as enum ('papel', 'tinta', 'ambar');

create table course_landings (
  course_id uuid primary key references courses (id) on delete cascade,

  theme landing_theme not null default 'papel',

  -- La línea que va bajo el título. Corta a propósito: si cabe un párrafo, se
  -- escribe un párrafo, y una promesa de tres líneas no promete nada.
  promise text check (char_length(promise) <= 140),

  cta_label text check (char_length(cta_label) between 2 and 30),

  -- El orden y el contenido de los bloques.
  --
  -- jsonb y no una tabla por bloque porque el conjunto va a crecer —hoy son
  -- ocho— y no quiero una migración cada vez que se añade uno. Lo que se pierde
  -- es validación en la base de datos; el precio es asumible porque nada de
  -- aquí dentro decide dinero ni acceso: eso vive en `courses` y en las
  -- policies. Solo decide cómo se pinta.
  blocks jsonb not null default '[]'::jsonb,

  updated_at timestamptz not null default now(),

  constraint blocks_is_array check (jsonb_typeof(blocks) = 'array')
);

comment on table course_landings is
  'Composición de la página de venta pública de un curso. Solo presentación.';

-- ---------------------------------------------------------------------------
-- Quién la ve y quién la escribe
-- ---------------------------------------------------------------------------
--
-- Calcada de la policy de `courses` en 0002: si el curso es visible, su
-- escaparate también. No hace falta nada más — el paywall ya está resuelto ahí:
-- el índice del curso se ve siempre y lo que se protege es el contenido de las
-- lecciones que no son de muestra. Una página de venta es exactamente ese caso.

alter table course_landings enable row level security;

create policy "el escaparate se ve si el curso se ve"
  on course_landings for select
  using (
    exists (
      select 1 from courses c
      where c.id = course_landings.course_id
        and (c.status = 'published' or c.author_id = auth.uid())
    )
  );

create policy "el autor compone su escaparate"
  on course_landings for all
  using (
    exists (
      select 1 from courses c
      where c.id = course_landings.course_id and c.author_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from courses c
      where c.id = course_landings.course_id and c.author_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Fecha de modificación
-- ---------------------------------------------------------------------------

create or replace function touch_course_landing()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger course_landings_touch
  before update on course_landings
  for each row execute function touch_course_landing();
