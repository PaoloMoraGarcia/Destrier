-- Los datos que el creador ve de sí mismo.
--
-- El problema que resuelve: con las policies de 0002, un creador **no puede ver
-- sus propios números**. `purchases` solo lo lee el comprador y `interactions`
-- solo lo lee quien interactúa, así que ni las ventas de sus cursos ni las
-- vistas de sus vídeos le son visibles.
--
-- La tentación es abrir esas policies. No se hace: eso expondría **quién** dio
-- like a qué y quién compró qué, y esa privacidad es parte del producto — una
-- app que existe para evitar la comparación social no puede filtrar el rastro
-- de cada persona a los creadores.
--
-- La salida son agregados. Estas funciones son `security definer`, así que leen
-- por encima de RLS, pero solo devuelven **recuentos y sumas** de contenido cuyo
-- autor es quien llama. Cuántos, nunca quiénes.

-- ---------------------------------------------------------------------------
-- Totales de siempre
-- ---------------------------------------------------------------------------

create or replace function creator_totals()
returns table (
  followers        bigint,
  published_courses bigint,
  revenue_cents    bigint,
  views            bigint,
  likes            bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from follows f where f.followee_id = auth.uid()),

    (select count(*) from courses c
      where c.author_id = auth.uid() and c.status = 'published'),

    -- Solo las compras completadas cuentan como ingreso. Una pendiente o
    -- reembolsada en el total sería mentir al creador sobre lo que ha ganado.
    coalesce((
      select sum(p.amount_cents)
      from purchases p
      join courses c on c.id = p.course_id
      where c.author_id = auth.uid() and p.status = 'completed'
    ), 0),

    coalesce((
      select count(*)
      from interactions i
      join curiosities cu on cu.id = i.curiosity_id
      where cu.author_id = auth.uid() and i.type = 'view_complete'
    ), 0),

    coalesce((
      select count(*)
      from interactions i
      join curiosities cu on cu.id = i.curiosity_id
      where cu.author_id = auth.uid() and i.type = 'like'
    ), 0);
$$;

comment on function creator_totals is
  'Totales del creador que llama. Agregados: nunca devuelve filas individuales.';

-- ---------------------------------------------------------------------------
-- Serie diaria
-- ---------------------------------------------------------------------------

create or replace function creator_daily(since date, until date)
returns table (
  day           date,
  revenue_cents bigint,
  views         bigint,
  likes         bigint
)
language sql
stable
security definer
set search_path = public
as $$
  -- La rejilla de días se genera entera para que los días sin actividad salgan
  -- a cero en lugar de faltar: un gráfico con huecos miente sobre la forma de
  -- la curva.
  select
    d::date,
    coalesce((
      select sum(p.amount_cents)
      from purchases p
      join courses c on c.id = p.course_id
      where c.author_id = auth.uid()
        and p.status = 'completed'
        and p.purchased_at >= d
        and p.purchased_at < d + interval '1 day'
    ), 0),
    coalesce((
      select count(*)
      from interactions i
      join curiosities cu on cu.id = i.curiosity_id
      where cu.author_id = auth.uid()
        and i.type = 'view_complete'
        and i.created_at >= d
        and i.created_at < d + interval '1 day'
    ), 0),
    coalesce((
      select count(*)
      from interactions i
      join curiosities cu on cu.id = i.curiosity_id
      where cu.author_id = auth.uid()
        and i.type = 'like'
        and i.created_at >= d
        and i.created_at < d + interval '1 day'
    ), 0)
  from generate_series(since::timestamptz, until::timestamptz, interval '1 day') as d
  order by d;
$$;

comment on function creator_daily is
  'Actividad del creador día a día, con los días vacíos a cero.';

-- Sin sesión no hay nada que devolver: `auth.uid()` es null y todo sale a cero
-- o vacío. Aun así se conceden a `authenticated` y no a `anon`.
grant execute on function creator_totals to authenticated;
grant execute on function creator_daily(date, date) to authenticated;
