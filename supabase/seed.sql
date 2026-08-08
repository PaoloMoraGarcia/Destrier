-- Semilla de desarrollo.
--
-- Requiere que existan usuarios en auth.users. Crea uno desde el dashboard de
-- Supabase y sustituye los UUID de abajo, o ejecuta esto después de registrar
-- las tres cuentas de prueba.

-- \set nora  '00000000-0000-0000-0000-000000000001'
-- \set kit   '00000000-0000-0000-0000-000000000002'
-- \set sam   '00000000-0000-0000-0000-000000000003'

-- Perfiles ------------------------------------------------------------------
-- insert into profiles (id, handle, display_name) values
--   (:'nora', 'noraverse',   'Nora Vessel'),
--   (:'kit',  'kitbuilds',   'Kit Aranda'),
--   (:'sam',  'samsaysless', 'Sam Oyelaran');

-- Verificación --------------------------------------------------------------
-- Nora y Kit están verificados y pueden cobrar. Sam no: si intentas crear un
-- curso de pago a su nombre, el trigger `courses_require_verification` lo
-- rechaza. Es la comprobación que conviene hacer a mano al aplicar el esquema.
-- insert into creator_verifications (profile_id, status, reviewed_at) values
--   (:'nora', 'approved', now()),
--   (:'kit',  'approved', now()),
--   (:'sam',  'none',     null);

-- Cursos --------------------------------------------------------------------
-- insert into courses (author_id, category_slug, title, pricing_mode, price_cents, status, published_at)
-- values
--   (:'kit',  'tech-web',       'Ship a landing page in a weekend',   'one_time', 1900, 'published', now()),
--   (:'nora', 'business-sales', 'Selling without sounding like a seller', 'free',  null, 'published', now());

-- Curiosidades de solo texto ------------------------------------------------
-- insert into curiosities (author_id, category_slug, kind, text_body, background_color, foreground_color)
-- values
--   (:'sam', 'general-curiosities', 'text',
--    'You will die without ever knowing what the deep ocean sounds like. That''s fine. That''s the good part.',
--    '#FFFFFF', '#0A0A0A'),
--   (:'nora', 'business-sales', 'text',
--    'Nobody has read the whole internet. Nobody ever will. Pick a corner and enjoy it.',
--    '#F5A623', '#0A0A0A');

-- Prueba negativa del gate KYC (debe fallar) --------------------------------
-- insert into courses (author_id, category_slug, title, pricing_mode, price_cents, status)
-- values (:'sam', 'general-curiosities', 'Curso de pago sin verificar', 'one_time', 1900, 'draft');
-- ERROR: El autor ... no tiene verificación aprobada: no puede publicar un curso de pago.
