-- La consulta del feed, como vista.
--
-- Va en la base de datos y no en el cliente por dos motivos: se puede probar sin
-- levantar la app, y el día que el orden deje de ser "lo más nuevo primero" el
-- cambio ocurre aquí y no en cinco sitios.

-- ---------------------------------------------------------------------------
-- El distintivo de verificado es información pública
-- ---------------------------------------------------------------------------
--
-- `creator_verifications` solo la puede leer su dueño, y así debe seguir: dentro
-- hay referencias al proveedor de KYC. Pero el "está verificado" que se pinta al
-- lado del nombre lo tiene que poder ver cualquiera, así que se proyecta a una
-- columna de `profiles` y se mantiene sola.

alter table profiles add column is_verified boolean not null default false;

create or replace function sync_profile_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles
  set is_verified = (new.status = 'approved')
  where id = new.profile_id;
  return new;
end;
$$;

create trigger verifications_sync_profile
  after insert or update of status on creator_verifications
  for each row execute function sync_profile_verified();

-- Alinear lo que ya hubiera.
update profiles p
set is_verified = exists (
  select 1 from creator_verifications v
  where v.profile_id = p.id and v.status = 'approved'
);

-- ---------------------------------------------------------------------------
-- La vista
-- ---------------------------------------------------------------------------
--
-- `security_invoker` es lo que hace que la vista respete RLS con los permisos de
-- quien consulta, no los del dueño. Sin eso, una vista es un agujero por el que
-- se sale todo lo que las policies protegen.

create view feed_items with (security_invoker = on) as
select
  c.id,
  c.kind,
  c.category_slug,
  c.caption,
  c.text_body,
  c.background_color,
  c.foreground_color,
  c.created_at,

  p.id            as author_id,
  p.handle        as author_handle,
  p.display_name  as author_display_name,
  p.avatar_url    as author_avatar_url,
  p.is_verified   as author_is_verified,

  m.storage_path  as media_path,
  m.playback_id   as media_playback_id,
  m.poster_url    as media_poster_url,

  coalesce(s.likes, 0)    as likes,
  coalesce(s.comments, 0) as comments,
  coalesce(s.saves, 0)    as saves,

  -- Lo del usuario que consulta. RLS ya limita `interactions` a las filas
  -- propias, así que este exists no puede ver los likes de otro.
  exists (
    select 1 from interactions i
    where i.curiosity_id = c.id and i.user_id = auth.uid() and i.type = 'like'
  ) as liked_by_me,
  exists (
    select 1 from interactions i
    where i.curiosity_id = c.id and i.user_id = auth.uid() and i.type = 'save'
  ) as saved_by_me,

  course.id          as course_id,
  course.title       as course_title,
  course.price_cents as course_price_cents,
  course.currency    as course_currency,
  course.item_count  as course_item_count,
  coalesce(course.unlocked, false) as course_unlocked

from curiosities c
join profiles p on p.id = c.author_id
left join media_assets m on m.id = c.media_id
left join curiosity_stats s on s.curiosity_id = c.id

-- Una curiosidad puede estar en varias colecciones (los feeds de nicho del
-- roadmap). Para la tarjeta se toma una: la primera por posición.
left join lateral (
  select
    co.id,
    co.title,
    co.price_cents,
    co.currency,
    (select count(*) from course_items x where x.course_id = co.id) as item_count,
    (co.pricing_mode = 'free' or has_course_access(co.id)) as unlocked
  from course_items ci
  join courses co on co.id = ci.course_id
  where ci.curiosity_id = c.id and co.status = 'published'
  order by ci.position
  limit 1
) course on true

where c.visibility = 'public'
order by c.created_at desc;

comment on view feed_items is
  'Feed. Hoy ordena por fecha; el ranking real (interés, promociones del §3) irá aquí.';

grant select on feed_items to anon, authenticated;
