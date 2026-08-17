-- Las solicitudes que llegan por el formulario de la landing.
--
-- Hasta ahora el formulario era un enlace `mailto`, porque no había dónde
-- recibirlas y la regla era no inventar un backend ni fingir un envío. Ya lo hay.
--
-- No tiene nada que ver con `profiles` ni con `courses`: esto no es un usuario
-- del producto, es alguien que escribe para contar qué quiere enseñar. Por eso no
-- lleva `user_id` ni clave ajena a nada — quien rellena el formulario **no tiene
-- cuenta**, y exigirle una sería poner un muro en la única acción de la página.

create table if not exists public.landing_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  name text not null,
  email text not null,

  -- Las tres preguntas del formulario, con los mismos nombres que los campos.
  teach text not null,
  who text,
  outcome text,

  -- De dónde llegó. Sin cookies ni rastreo: solo la ruta, para saber si algún
  -- día hay más de una puerta de entrada.
  source text not null default 'landing'
);

-- Un correo puede escribir más de una vez —la gente lo reintenta, y una idea
-- distinta es una solicitud distinta—, así que nada de unicidad sobre `email`.
-- Lo que sí interesa es leerlas por fecha.
create index if not exists landing_requests_created_at_idx
  on public.landing_requests (created_at desc);

alter table public.landing_requests enable row level security;

-- Cualquiera puede escribir: es un formulario público y quien lo rellena no
-- tiene cuenta.
create policy "landing_requests_anyone_can_insert"
  on public.landing_requests
  for insert
  to anon, authenticated
  with check (true);

-- **Y nadie puede leerlas.** No hay policy de `select`, y eso no es un olvido: con
-- RLS activo, lo que no está permitido está prohibido. Sin esto, cualquiera con
-- la clave pública —que viaja en el navegador de todo el que entre— podría
-- descargarse los nombres, los correos y las ideas de todos los que han escrito.
--
-- Se leen desde el panel de Supabase o con la service role key, que no sale del
-- servidor. Si algún día hay una bandeja en `/panel`, la policy que la habilite
-- tiene que mirar el rol, nunca abrirse a `anon`.

comment on table public.landing_requests is
  'Solicitudes del formulario público. Se insertan sin cuenta y no se pueden leer con la clave pública.';
