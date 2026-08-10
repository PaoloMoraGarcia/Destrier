/**
 * Test del esquema contra un Postgres real.
 *
 *   npm run test:schema
 *
 * Levanta un Postgres embebido (sin Docker), aplica las dos migraciones y
 * comprueba que las reglas de negocio del contexto de producto se cumplen a
 * nivel de base de datos. Lo que verifica de verdad es que **no se puede** hacer
 * lo que no se debe: cobrar sin verificación, poner precio a una curiosidad,
 * insertar compras desde el cliente.
 *
 * Dos diferencias con Supabase que conviene tener presentes:
 *  - El esquema `auth` se simula aquí. En Supabase lo aporta la plataforma, con
 *    un `auth.uid()` real ligado al JWT. Este test confirma que las policies se
 *    crean y que las tablas tienen RLS, no que la autorización decida bien.
 *  - Postgres 18 en local; Supabase va por detrás. No afecta a este DDL.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS = join(HERE, '..', 'migrations');
const DATA_DIR = join(HERE, '.pgdata');
const ROOT = join(HERE, '..', '..');

// npm bloquea los scripts de postinstalación por defecto, así que tras un
// `npm install` limpio faltan los symlinks de las librerías de Postgres y el
// test muere con un `dyld: Library not loaded` que no dice nada de esto.
//
// El guard lee el propio manifiesto del paquete en vez de comprobar un archivo
// concreto: los nombres llevan la versión de la librería dentro, así que
// cualquier comprobación a mano se rompe en la siguiente actualización.
const platformPkg = join(ROOT, 'node_modules', '@embedded-postgres', `${process.platform}-${process.arch}`);
const manifest = join(platformPkg, 'native', 'pg-symlinks.json');

if (existsSync(manifest)) {
  const links = JSON.parse(readFileSync(manifest, 'utf8'));
  const missing = links.filter(({ target }) => !existsSync(join(platformPkg, target)));

  if (missing.length > 0) {
    console.log(`Hidratando ${missing.length} symlinks de Postgres (solo la primera vez)…`);
    execFileSync(process.execPath, [join(platformPkg, 'scripts', 'hydrate-symlinks.js')], {
      cwd: platformPkg,
      stdio: 'inherit',
    });
  }
}

const { default: EmbeddedPostgres } = await import('embedded-postgres');

const NORA = '00000000-0000-0000-0000-000000000001'; // verificada
const KIT = '00000000-0000-0000-0000-000000000002'; // verificada
const SAM = '00000000-0000-0000-0000-000000000003'; // SIN verificar

const results = [];

function record(name, passed, detail) {
  results.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? `\n        ${detail}` : ''}`);
}

/** Espera que la consulta FALLE. Si pasa, es un agujero en el esquema. */
async function expectFailure(client, name, sql, expectedFragment) {
  try {
    await client.query(sql);
    record(name, false, 'La consulta se ejecutó sin error — la regla NO está protegida.');
  } catch (error) {
    const matches = !expectedFragment || error.message.includes(expectedFragment);
    record(name, matches, `rechazado: ${error.message.split('\n')[0]}`);
  }
}

async function expectSuccess(client, name, sql) {
  try {
    await client.query(sql);
    record(name, true, 'aceptado');
  } catch (error) {
    record(name, false, `rechazado inesperadamente: ${error.message.split('\n')[0]}`);
  }
}

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: 'postgres',
  password: 'postgres',
  port: 54999,
  persistent: false,
});

await pg.initialise();
await pg.start();
await pg.createDatabase('bihapia');
const client = pg.getPgClient('bihapia');
await client.connect();

console.log('\n=== 1. Stub del esquema auth (lo aporta Supabase, aquí no existe) ===');
await client.query(`
  create schema if not exists auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);

  -- En Supabase, auth.uid() saca el usuario del JWT. Aquí lo saca de una
  -- variable de sesión, que es lo que permite ejecutar la misma consulta
  -- haciéndose pasar por usuarios distintos y comprobar qué ve cada uno.
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('bihapia.test_user', true), '')::uuid
  $$;

  -- Los roles que usa Supabase. Hacen falta de verdad: el usuario 'postgres' es
  -- superusuario y **se salta RLS**, así que un test que consultara con él daría
  -- todo por bueno sin comprobar una sola policy.
  create role anon nologin;
  create role authenticated nologin;
  grant usage on schema public to anon, authenticated;
`);
console.log('OK');

/** Ejecuta la consulta como un usuario con sesión, o como anónimo si es null. */
async function asUser(userId, sql) {
  await client.query(`select set_config('bihapia.test_user', $1, false)`, [userId ?? '']);
  await client.query(`set role ${userId ? 'authenticated' : 'anon'}`);
  try {
    return await client.query(sql);
  } finally {
    await client.query('reset role');
  }
}

console.log('\n=== 2. Aplicar migraciones ===');
for (const file of [
  '0001_init.sql',
  '0002_rls.sql',
  '0003_video_caption.sql',
  '0004_profile_on_signup.sql',
  '0005_feed_view.sql',
  '0006_creator_analytics.sql',
]) {
  try {
    await client.query(readFileSync(`${MIGRATIONS}/${file}`, 'utf8'));
    record(`Migración ${file} aplica sin errores`, true);
  } catch (error) {
    record(`Migración ${file} aplica sin errores`, false, error.message.split('\n')[0]);
    process.exitCode = 1;
  }
}

console.log('\n=== 3. Alta de usuarios (via trigger, como en producción) ===');
// Nadie inserta en `profiles` a mano: se da de alta en auth.users y el trigger
// de 0004 tiene que hacer el resto. Es la forma real y de paso lo prueba.
await client.query(`
  insert into auth.users (id, email, raw_user_meta_data) values
    ('${NORA}', 'nora@example.com', '{"display_name":"Nora Vessel"}'),
    ('${KIT}',  'kit@example.com',  '{"display_name":"Kit Aranda"}'),
    ('${SAM}',  'sam@example.com',  '{}');
`);

const created = await client.query(
  `select id, handle, display_name from profiles order by handle`
);
record(
  'Registrarse crea el perfil solo',
  created.rowCount === 3,
  created.rows.map((r) => `${r.handle} (${r.display_name})`).join(', ')
);

const autoVerifications = await client.query(`select count(*)::int as n from creator_verifications`);
record(
  'Y su fila de verificación en "none"',
  autoVerifications.rows[0].n === 3,
  `${autoVerifications.rows[0].n} filas`
);

// Handles legibles para el resto del test.
await client.query(`
  update profiles set handle = 'noraverse',   display_name = 'Nora Vessel'  where id = '${NORA}';
  update profiles set handle = 'kitbuilds',   display_name = 'Kit Aranda'   where id = '${KIT}';
  update profiles set handle = 'samsaysless', display_name = 'Sam Oyelaran' where id = '${SAM}';
  update creator_verifications set status = 'approved', reviewed_at = now()
    where profile_id in ('${NORA}', '${KIT}');
`);

const verified = await client.query(
  `select count(*)::int as n from profiles where is_verified`
);
record(
  'Aprobar la verificación marca el perfil como verificado',
  verified.rows[0].n === 2,
  `${verified.rows[0].n} perfiles verificados (Nora y Kit)`
);

console.log('\n=== 4. LA PRUEBA QUE IMPORTA: gate de KYC (§4) ===');

await expectFailure(
  client,
  'Curso de PAGO con autor SIN verificar es rechazado',
  `insert into courses (author_id, category_slug, title, pricing_mode, price_cents, status)
   values ('${SAM}', 'general-curiosities', 'Curso de pago sin verificar', 'one_time', 1900, 'draft')`,
  'no tiene verificación aprobada'
);

await expectSuccess(
  client,
  'Curso GRATUITO con autor SIN verificar es aceptado (modelo abierto)',
  `insert into courses (author_id, category_slug, title, pricing_mode, status)
   values ('${SAM}', 'general-curiosities', 'Curso gratis de Sam', 'free', 'draft')`
);

await expectSuccess(
  client,
  'Curso de PAGO con autor verificado es aceptado',
  `insert into courses (author_id, category_slug, title, pricing_mode, price_cents, status)
   values ('${KIT}', 'tech-web', 'Ship a landing page in a weekend', 'one_time', 1900, 'published')`
);

await expectFailure(
  client,
  'Pasar un curso ya creado a PAGO sin verificación es rechazado',
  `update courses set pricing_mode = 'one_time', price_cents = 1900
   where author_id = '${SAM}' and pricing_mode = 'free'`,
  'no tiene verificación aprobada'
);

console.log('\n=== 5. Invariantes de monetización ===');

await expectFailure(
  client,
  'Curso gratuito con precio es rechazado',
  `insert into courses (author_id, category_slug, title, pricing_mode, price_cents)
   values ('${KIT}', 'tech-web', 'Gratis pero con precio', 'free', 1900)`,
  'price_matches_mode'
);

await expectFailure(
  client,
  'Curso de pago sin precio es rechazado',
  `insert into courses (author_id, category_slug, title, pricing_mode)
   values ('${KIT}', 'tech-web', 'De pago sin precio', 'one_time')`,
  'price_matches_mode'
);

await expectFailure(
  client,
  'Precio fuera del rango del MVP (1 céntimo) es rechazado',
  `insert into courses (author_id, category_slug, title, pricing_mode, price_cents)
   values ('${KIT}', 'tech-web', 'Un céntimo', 'one_time', 1)`,
  'price_within_mvp_range'
);

await expectFailure(
  client,
  'Precio fuera del rango del MVP (500 USD) es rechazado',
  `insert into courses (author_id, category_slug, title, pricing_mode, price_cents)
   values ('${KIT}', 'tech-web', 'Quinientos', 'one_time', 50000)`,
  'price_within_mvp_range'
);

console.log('\n=== 6. La curiosidad no puede llevar precio (§2) ===');
const priceCols = await client.query(`
  select column_name from information_schema.columns
  where table_name = 'curiosities' and column_name ilike any (array['%price%','%amount%','%cost%'])
`);
record(
  'curiosities no tiene ninguna columna de precio',
  priceCols.rowCount === 0,
  priceCols.rowCount === 0 ? 'ninguna' : `encontradas: ${priceCols.rows.map((r) => r.column_name)}`
);

await expectFailure(
  client,
  'Curiosidad de vídeo sin media es rechazada',
  `insert into curiosities (author_id, category_slug, kind) values ('${KIT}', 'tech-web', 'video')`,
  'shape_matches_kind'
);

await expectFailure(
  client,
  'Curiosidad de texto sin cuerpo es rechazada',
  `insert into curiosities (author_id, category_slug, kind) values ('${KIT}', 'tech-web', 'text')`,
  'shape_matches_kind'
);

await expectFailure(
  client,
  'Caption en una entradilla de texto es rechazado (su cuerpo ya es el texto)',
  `insert into curiosities (author_id, category_slug, kind, text_body, background_color, caption)
   values ('${KIT}', 'tech-web', 'text', 'Cuerpo', '#FFFFFF', 'Caption que sobra')`,
  'caption_only_on_video'
);

await expectFailure(
  client,
  'Caption de más de 140 caracteres es rechazado',
  `insert into media_assets (id, owner_id) values ('22222222-2222-2222-2222-222222222222', '${KIT}');
   insert into curiosities (author_id, category_slug, kind, media_id, caption)
   values ('${KIT}', 'tech-web', 'video', '22222222-2222-2222-2222-222222222222', '${'x'.repeat(141)}')`,
  'caption_check'
);

console.log('\n=== 7. Contadores y RLS ===');
await client.query(`
  insert into curiosities (id, author_id, category_slug, kind, text_body, background_color, foreground_color)
  values ('11111111-1111-1111-1111-111111111111', '${SAM}', 'general-curiosities', 'text',
          'You will die without ever knowing what the deep ocean sounds like.', '#FFFFFF', '#0A0A0A')
`);
const stats = await client.query(
  `select likes, saves from curiosity_stats where curiosity_id = '11111111-1111-1111-1111-111111111111'`
);
record(
  'Crear una curiosidad crea su fila de contadores',
  stats.rowCount === 1,
  stats.rowCount === 1 ? JSON.stringify(stats.rows[0]) : 'no se creó'
);

await client.query(`
  insert into interactions (user_id, curiosity_id, type)
  values ('${NORA}', '11111111-1111-1111-1111-111111111111', 'like')
`);
const afterLike = await client.query(
  `select likes from curiosity_stats where curiosity_id = '11111111-1111-1111-1111-111111111111'`
);
record('Un like incrementa el contador', afterLike.rows[0]?.likes === 1, `likes=${afterLike.rows[0]?.likes}`);

await client.query(`
  delete from interactions
  where user_id = '${NORA}' and curiosity_id = '11111111-1111-1111-1111-111111111111' and type = 'like'
`);
const afterUnlike = await client.query(
  `select likes from curiosity_stats where curiosity_id = '11111111-1111-1111-1111-111111111111'`
);
record('Quitar el like lo decrementa', afterUnlike.rows[0]?.likes === 0, `likes=${afterUnlike.rows[0]?.likes}`);

const rls = await client.query(`
  select c.relname as tabla, c.relrowsecurity as rls,
         (select count(*) from pg_policy p where p.polrelid = c.oid) as policies
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
  order by c.relname
`);
const sinRls = rls.rows.filter((r) => !r.rls);
const sinPolicies = rls.rows.filter((r) => r.rls && Number(r.policies) === 0);
record(
  `RLS activo en las ${rls.rowCount} tablas de public`,
  sinRls.length === 0,
  sinRls.length ? `SIN RLS: ${sinRls.map((r) => r.tabla).join(', ')}` : 'todas'
);
record(
  'Ninguna tabla con RLS se queda sin policies',
  sinPolicies.length === 0,
  sinPolicies.length ? `sin policies: ${sinPolicies.map((r) => r.tabla).join(', ')}` : 'todas tienen'
);

const purchasesInsert = await client.query(`
  select count(*) as n from pg_policy p join pg_class c on c.oid = p.polrelid
  where c.relname = 'purchases' and p.polcmd in ('a', '*')
`);
record(
  'purchases no tiene policy de insert para clientes',
  Number(purchasesInsert.rows[0].n) === 0,
  `policies de insert: ${purchasesInsert.rows[0].n}`
);

console.log('\n=== 8. El feed visto por cada usuario (RLS de verdad) ===');

// Un curso de pago de Kit, con dos lecciones: una de preview y una que no.
await client.query(`
  insert into media_assets (id, owner_id, storage_path, status) values
    ('33333333-3333-3333-3333-333333333333', '${KIT}', 'kit/preview.mp4', 'ready'),
    ('44444444-4444-4444-4444-444444444444', '${KIT}', 'kit/lesson2.mp4', 'ready');

  insert into curiosities (id, author_id, category_slug, kind, media_id, caption) values
    ('aaaaaaaa-0000-0000-0000-000000000001', '${KIT}', 'tech-web', 'video',
     '33333333-3333-3333-3333-333333333333', 'A landing page is just a promise.'),
    ('aaaaaaaa-0000-0000-0000-000000000002', '${KIT}', 'tech-web', 'video',
     '44444444-4444-4444-4444-444444444444', 'Lección de pago.');

  insert into courses (id, author_id, category_slug, title, pricing_mode, price_cents, status, published_at)
  values ('cccccccc-0000-0000-0000-000000000001', '${KIT}', 'tech-web',
          'Ship a landing page in a weekend', 'one_time', 1900, 'published', now());

  insert into course_items (course_id, curiosity_id, position, is_preview) values
    ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 1, true),
    ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 2, false);

  -- Nora le da like a la preview de Kit.
  insert into interactions (user_id, curiosity_id, type)
  values ('${NORA}', 'aaaaaaaa-0000-0000-0000-000000000001', 'like');
`);

await client.query(`grant select on all tables in schema public to anon, authenticated`);

const anonFeed = await asUser(null, 'select * from feed_items');
record(
  'Sin sesión el feed se ve igualmente (la curiosidad es el motor de descubrimiento)',
  anonFeed.rowCount === 3,
  `${anonFeed.rowCount} publicaciones`
);

const anonLikes = anonFeed.rows.every((r) => r.liked_by_me === false);
record('Sin sesión, nada aparece como "me gusta"', anonLikes);

const noraFeed = await asUser(NORA, 'select * from feed_items order by created_at');
const noraLiked = noraFeed.rows.filter((r) => r.liked_by_me);
record(
  'Nora ve su propio like y solo el suyo',
  noraLiked.length === 1 && noraLiked[0].id === 'aaaaaaaa-0000-0000-0000-000000000001',
  `${noraLiked.length} con like`
);

const samFeed = await asUser(SAM, 'select * from feed_items');
record(
  'Sam NO ve el like de Nora como suyo',
  samFeed.rows.every((r) => r.liked_by_me === false)
);

const kitRow = noraFeed.rows.find((r) => r.author_id === KIT);
record(
  'El distintivo de verificado es visible para terceros',
  kitRow?.author_is_verified === true,
  `is_verified=${kitRow?.author_is_verified}`
);

const samRow = noraFeed.rows.find((r) => r.author_id === SAM);
record(
  'Y un autor sin verificar no lo lleva',
  samRow?.author_is_verified === false,
  `is_verified=${samRow?.author_is_verified}`
);

record(
  'El curso de pago aparece bloqueado para quien no lo ha comprado',
  kitRow?.course_id === 'cccccccc-0000-0000-0000-000000000001' &&
    kitRow?.course_unlocked === false &&
    kitRow?.course_price_cents === 1900,
  `curso=${kitRow?.course_title} desbloqueado=${kitRow?.course_unlocked}`
);

record(
  'Y trae el número real de lecciones',
  Number(kitRow?.course_item_count) === 2,
  `${kitRow?.course_item_count} lecciones`
);

// Nora compra el curso.
await client.query(`
  insert into entitlements (user_id, course_id, source)
  values ('${NORA}', 'cccccccc-0000-0000-0000-000000000001', 'purchase');
`);

const noraAfter = await asUser(NORA, 'select * from feed_items');
const kitAfter = noraAfter.rows.find((r) => r.author_id === KIT);
record(
  'Tras comprar, el curso aparece desbloqueado para ella',
  kitAfter?.course_unlocked === true,
  `desbloqueado=${kitAfter?.course_unlocked}`
);

const samAfter = await asUser(SAM, 'select * from feed_items');
const kitForSam = samAfter.rows.find((r) => r.author_id === KIT);
record(
  'Pero sigue bloqueado para Sam, que no ha comprado nada',
  kitForSam?.course_unlocked === false,
  `desbloqueado=${kitForSam?.course_unlocked}`
);

// El paywall real: el media de la lección que no es preview.
const samMedia = await asUser(
  SAM,
  `select id from media_assets where id = '44444444-4444-4444-4444-444444444444'`
);
record(
  'PAYWALL: el vídeo de una lección de pago no se sirve a quien no tiene acceso',
  samMedia.rowCount === 0,
  samMedia.rowCount === 0 ? 'invisible para Sam' : 'SE ESTÁ SIRVIENDO — el paywall no protege nada'
);

const noraMedia = await asUser(
  NORA,
  `select id from media_assets where id = '44444444-4444-4444-4444-444444444444'`
);
record(
  'Y sí a quien lo compró',
  noraMedia.rowCount === 1,
  noraMedia.rowCount === 1 ? 'visible para Nora' : 'no lo ve pese a haber pagado'
);

const anonPurchases = await asUser(null, 'select * from purchases');
record(
  'Las compras no se leen sin ser tuyas',
  anonPurchases.rowCount === 0,
  `${anonPurchases.rowCount} filas visibles`
);

console.log('\n=== 9. Los datos que el creador ve de sí mismo ===');

// Nora sigue a Kit, y ya le compró el curso en la sección anterior.
await client.query(`
  insert into follows (follower_id, followee_id) values ('${NORA}', '${KIT}');
  update purchases set status = 'completed' where course_id = 'cccccccc-0000-0000-0000-000000000001';
`);

// Si no hay compra registrada de la sección 8, se crea aquí para poder medir.
await client.query(`
  insert into purchases (buyer_id, course_id, amount_cents, currency, platform, provider_txn_id, status)
  values ('${NORA}', 'cccccccc-0000-0000-0000-000000000001', 1900, 'USD', 'ios', 'txn-test-1', 'completed')
  on conflict do nothing;

  -- Y una vista sobre contenido de Kit, para que el recuento no sea trivial.
  insert into interactions (user_id, curiosity_id, type)
  values ('${SAM}', 'aaaaaaaa-0000-0000-0000-000000000001', 'view_complete')
  on conflict do nothing;
`);

const kitTotals = await asUser(KIT, 'select * from creator_totals()');
const kit = kitTotals.rows[0];
record(
  'Kit ve sus propias ventas, que RLS le esconde fila a fila',
  Number(kit.revenue_cents) === 1900,
  `ingresos=${kit.revenue_cents} centavos`
);
record(
  'Y las vistas de su contenido, que tampoco puede leer fila a fila',
  Number(kit.views) === 1,
  `vistas=${kit.views}`
);
record(
  'Y su número de seguidores',
  Number(kit.followers) === 1,
  `seguidores=${kit.followers}`
);
// Kit publicó dos a lo largo del test: el de la sección 4 y el de la 8.
record(
  'Y sus cursos publicados',
  Number(kit.published_courses) === 2,
  `cursos=${kit.published_courses}`
);

// Lo que de verdad importa: que sean SUS datos y no los de cualquiera.
const samTotals = await asUser(SAM, 'select * from creator_totals()');
const sam = samTotals.rows[0];
record(
  'AISLAMIENTO: Sam no ve ni un céntimo de los ingresos de Kit',
  Number(sam.revenue_cents) === 0,
  Number(sam.revenue_cents) === 0
    ? 'sus ingresos salen a cero'
    : `LE ESTÁ VIENDO ${sam.revenue_cents} — la función filtra datos ajenos`
);
record(
  'Ni sus vistas',
  Number(sam.views) === 0,
  `vistas=${sam.views}`
);

const anonTotals = await asUser(null, 'select * from creator_totals()');
record(
  'Sin sesión no hay datos de nadie',
  Number(anonTotals.rows[0].revenue_cents) === 0 && Number(anonTotals.rows[0].followers) === 0,
  'todo a cero'
);

// La serie diaria: los días sin actividad tienen que existir y valer cero, o el
// gráfico dibujaría una curva con la forma equivocada.
const serie = await asUser(
  KIT,
  `select * from creator_daily((current_date - 6), current_date)`
);
record(
  'La serie diaria devuelve todos los días del rango, también los vacíos',
  serie.rowCount === 7,
  `${serie.rowCount} días`
);
record(
  'Y la suma de la serie cuadra con el total',
  serie.rows.reduce((sum, row) => sum + Number(row.revenue_cents), 0) === 1900,
  `suma=${serie.rows.reduce((sum, row) => sum + Number(row.revenue_cents), 0)}`
);

const serieSam = await asUser(
  SAM,
  `select coalesce(sum(revenue_cents),0)::bigint as total from creator_daily((current_date - 6), current_date)`
);
record(
  'AISLAMIENTO: la serie de Sam tampoco trae nada de Kit',
  Number(serieSam.rows[0].total) === 0,
  `suma=${serieSam.rows[0].total}`
);

console.log('\n========================================');
const failed = results.filter((r) => !r.passed);
console.log(`${results.length - failed.length}/${results.length} comprobaciones pasan`);
if (failed.length) {
  console.log('FALLAN:');
  failed.forEach((f) => console.log(`  - ${f.name}: ${f.detail}`));
  process.exitCode = 1;
}

await client.end();
await pg.stop();
