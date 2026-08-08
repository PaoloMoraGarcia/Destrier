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
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
  insert into auth.users (id) values ('${NORA}'), ('${KIT}'), ('${SAM}');
`);
console.log('OK');

console.log('\n=== 2. Aplicar migraciones ===');
for (const file of ['0001_init.sql', '0002_rls.sql', '0003_video_caption.sql']) {
  try {
    await client.query(readFileSync(`${MIGRATIONS}/${file}`, 'utf8'));
    record(`Migración ${file} aplica sin errores`, true);
  } catch (error) {
    record(`Migración ${file} aplica sin errores`, false, error.message.split('\n')[0]);
    process.exitCode = 1;
  }
}

console.log('\n=== 3. Datos base ===');
await client.query(`
  insert into profiles (id, handle, display_name) values
    ('${NORA}', 'noraverse',   'Nora Vessel'),
    ('${KIT}',  'kitbuilds',   'Kit Aranda'),
    ('${SAM}',  'samsaysless', 'Sam Oyelaran');
  insert into creator_verifications (profile_id, status, reviewed_at) values
    ('${NORA}', 'approved', now()),
    ('${KIT}',  'approved', now()),
    ('${SAM}',  'none',     null);
`);
console.log('3 perfiles; Nora y Kit verificadas, Sam no.');

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
