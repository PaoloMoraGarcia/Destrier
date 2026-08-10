# La web de Bihapia

Quien publica cursos y mentorías trabaja desde el navegador. Montar un curso de
doce lecciones en un móvil —subir vídeos, ordenarlos, escribir descripciones,
mirar ingresos— es un castigo. De ahí sale la necesidad de web.

Pero "web" son **tres productos distintos**, y confundirlos es el error caro.

## Las tres superficies

### 1. Estudio del creador — **en construcción, en `studio/`**

Subir vídeo, montar y ordenar cursos, escribir, ver ingresos, pasar la
verificación. Es un producto de escritorio: formularios, tablas, arrastrar para
reordenar, subida de archivos grandes.

**No debía ser Expo web**, y no lo es: vive en `studio/` como proyecto Next.js
con Tailwind, `@supabase/ssr` y Recharts. Comparte repo y base de datos con la
app, y nada más.

Estéticamente es lo contrario de la app: cabecera blanca con el wordmark en
hueco, navegación lateral, y un lienzo gris con tarjetas blancas. Ese contraste
es lo que separa la cabecera del cuerpo — con todo blanco no se separa nada.

Hecho: el armazón, la estética y el resumen leyendo datos reales.
Pendiente: gestión de cursos, subida de vídeo y perfil.

### 2. Páginas públicas de curso y perfil — la de más palanca

URLs compartibles e indexables: el creador enseña su curso a su audiencia y
Google encuentra a Bihapia. Necesita renderizado en servidor de verdad, que es
otra razón para Next.js: `react-native-web` produce un DOM que no sirve para SEO.

### 3. Feed de consumo en web — la que menos aporta

Nadie hace scroll de Reels en un portátil como hábito. Y un vertical a pantalla
completa en un monitor 16:9 se ve mal. Funciona hoy, pero no es una prioridad.

## Por qué la web toca al dinero

Vender en web **deja el 100 %**; vender dentro de la app de iOS deja el 85 %,
porque los cursos son contenido digital y obligan a usar compras integradas (ver
[app-store.md](app-store.md)). En el modelo del §3 esa diferencia es mucha.

El patrón de **vender fuera y consumir dentro** es viejo y legítimo — es lo que
hacen los servicios multiplataforma. Lo delicado es **qué se puede decir o
enlazar dentro de la app de iOS**: las reglas antidesvío dependen del país y
llevan años moviéndose por litigios y regulación.

**Esto hay que verificarlo con la política vigente antes de apostar el modelo a
ello.** Queda escrito como oportunidad, no como hecho establecido.

## Arquitectura

Dos proyectos en el mismo repositorio: la app Expo en la raíz y el panel en
`studio/`. Metro ignora `studio/` por `metro.config.js` y el `tsconfig` de la app
lo excluye, así que cada uno compila por su cuenta.

Lo que hace barato ese segundo frente ya está hecho: **el esquema de Supabase con
RLS es el contrato compartido**. Ambos proyectos hablan con la misma base, con
las mismas policies, y el paywall vive en un solo sitio. Sin eso habría que
reimplementar la seguridad entera.

## Lo que no traduce bien a web

Comprobado ejecutándolo en navegador:

- **El feed a pantalla completa en escritorio.** Una publicación ocupa el alto de
  la ventana, así que en un monitor ancho el vídeo se estira a lo bestia. Lo
  correcto sería una columna con proporción de móvil centrada. **Pendiente.**
- **El wordmark del splash** escala con el ancho de la ventana, así que en un
  monitor grande sale enorme. **Pendiente.**
- **Liquid Glass no existe.** `GlassSurface` cae al blur, que es lo previsto.
- **Los gestos** están pensados para el pulgar: arrastrar con el ratón funciona,
  pero el feed no responde a la rueda del ratón como esperaría alguien en un
  escritorio. **Pendiente.**

### Fallos de web ya corregidos

Cuatro cosas que solo se rompían en navegador y que ya están arregladas:

- **La sesión no se recogía.** `detectSessionInUrl` estaba fijo en `false`; en
  web el enlace del correo devuelve el token por la URL y sin eso la sesión se
  perdía. Ahora depende de la plataforma.
- **El texto SVG salía en serifa.** Un `<Text>` de React Native hereda la fuente
  del sistema, pero un texto SVG no: en web cae al serif del navegador. Todos los
  textos SVG declaran familia explícitamente (`fonts.uiStack`).
- **El vídeo no llenaba la tarjeta.** El elemento `<video>` se quedaba en su
  tamaño natural, 640×360, con la portada asomando debajo. Se fuerza el 100 %.
- **El vídeo no arrancaba.** Los navegadores prohíben autoreproducir con sonido
  sin interacción previa. En web arranca en silencio; **falta un control para
  activar el sonido**, que es lo que hacen todos los feeds de vídeo en web.

### Ruido conocido, no defectos

- `AbortError: play() interrupted ... paused to save power` en consola: es Chrome
  pausando el vídeo cuando la pestaña no está en primer plano.
- Si aparece un `ReferenceError` de algo que sí existe en el archivo, casi seguro
  es **caché de Metro**. `npx expo start --web --clear` y vuelve a mirar antes de
  cambiar código: perseguí una explicación equivocada un buen rato por esto.

## Lo que le falta al esquema para el estudio

**Resuelto:** el creador no podía ver sus propios datos. `purchases` solo lo lee
el comprador e `interactions` solo quien interactúa, así que ni las ventas ni las
vistas le eran visibles. Se arregló con agregados `security definer` en
`0006_creator_analytics.sql` — **cuántos, nunca quiénes** — en lugar de abrir las
policies, que habría expuesto el rastro de cada persona. Bajo test en la sección
9 de `schema.test.mjs`, incluido que un creador no ve los datos de otro.

**Pendiente:**

- **Subida de media.** Nada escribe en `media_assets` ni sube ficheros; el bucket
  de Storage no está creado ni tiene políticas.
- **Edición de cursos.** Las policies dejan al autor gestionar sus cursos y
  `course_items`, pero no hay ninguna interfaz ni flujo de reordenación.
- **Liquidaciones.** Los ingresos ya se pueden leer, pero no hay nada para pagar
  al creador.
- **Verificación.** `creator_verifications` existe y el trigger bloquea el cobro
  sin ella, pero no hay flujo para solicitarla ni para revisarla.
