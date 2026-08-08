# Modelo de datos

Implementado en [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql)
y [`0002_rls.sql`](../supabase/migrations/0002_rls.sql). Este documento explica el
porqué; el SQL es la fuente de verdad.

## Mapa

| Tabla | Para qué |
|---|---|
| `profiles` | Perfil público, 1:1 con `auth.users` |
| `creator_verifications` | Estado KYC. Es lo único que habilita cobrar (§4) |
| `categories` | Las 3 del MVP (§8), sembradas en la migración |
| `media_assets` | Vídeo desacoplado del contenido que lo usa |
| `curiosities` | Unidad mínima de contenido: vídeo o entradilla de texto |
| `courses` | Colección de curiosidades del mismo autor |
| `course_items` | Qué curiosidades forman un curso, en qué orden, cuáles son preview |
| `purchases` | Histórico contable de transacciones |
| `entitlements` | Lo que la app consulta para desbloquear |
| `interactions` / `curiosity_stats` | Likes, guardados, vistas y sus contadores |
| `comments`, `follows` | Capa social |
| `promotions` | Posicionamiento pagado (§3) |
| `reports` | Moderación reactiva del modelo abierto |

## Las cuatro decisiones que no son obvias

### 1. `curiosities` no tiene columna de precio

El §2 dice que la curiosidad es siempre gratis y nunca lleva paywall: es el motor
de descubrimiento y de viralidad. Esa regla no está escrita como una validación
que alguien pueda olvidar — está escrita como la ausencia de una columna. Dentro
de seis meses, cuando alguien quiera "probar a cobrar por curiosidades sueltas",
tendrá que abrir una migración y tomar la decisión conscientemente.

### 2. El gate de KYC es un trigger, no una comprobación en la app

`courses_require_verification` impide poner `pricing_mode = 'one_time'` si el
autor no tiene `creator_verifications.status = 'approved'`. Está en la base de
datos porque la app no será nunca el único cliente: habrá un panel de moderación,
scripts de importación y edge functions. Una regla que solo vive en el cliente
deja de cumplirse en cuanto aparece el segundo.

Publicar contenido **gratuito** no requiere nada: el modelo es abierto tipo
TikTok (§4). La verificación solo aparece en el momento de cobrar.

### 3. `entitlements` va separado de `purchases`

Con compras in-app, la fuente de verdad del pago es el receipt de Apple o Google,
no nuestra base de datos. `purchases` es el reflejo contable, inmutable, que sirve
para conciliar y para liquidar al creador. `entitlements` es la proyección que
consulta la app.

Separarlas permite tres cosas que con una sola tabla serían trampas: regalar
acceso sin inventar una compra falsa, revocar por fraude sin tocar el histórico,
y reconstruir los accesos desde el proveedor de pago sin reescribir transacciones.

Ningún cliente puede escribir en `purchases`: no hay policy de `insert`. Las crea
el webhook del proveedor con la service role key, que ignora RLS.

### 4. `course_items` en vez de un `course_id` en `curiosities`

El §2 deja abierta, en roadmap, la idea de páginas y feeds de nicho curados: una
misma curiosidad podría aparecer en más de una colección. Una tabla de unión lo
permite hoy sin coste; una columna obligaría a una migración con datos ya en
producción.

## Dónde vive el paywall

En `0002_rls.sql`, y en un solo sitio: la policy de `select` sobre `media_assets`.
El índice del curso (títulos, orden, número de lecciones) es público a propósito —
es el escaparate. Lo que se protege es el acceso al media de las lecciones que no
son preview, y se protege comprobando `entitlements`.

Esa es la única barrera real: si el `playback_id` se puede leer, el vídeo se puede
ver. Cualquier lógica de bloqueo que se añada en la app es cosmética.

## Antes de dar el esquema por bueno

Aplica las migraciones y comprueba a mano que **un `insert` de curso de pago con
un autor sin verificar falla**. El final de [`seed.sql`](../supabase/seed.sql)
tiene esa consulta preparada. Si pasa, el gate no está funcionando.
