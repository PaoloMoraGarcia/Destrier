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

### 2. Página de venta del curso — **hecha, en `(public)/[handle]/[slug]`**

URLs compartibles e indexables: el creador enseña su curso a su audiencia y
Google encuentra a Bihapia. Se sirve desde el servidor, que es otra razón para
Next.js: `react-native-web` produce un DOM que no sirve para SEO.

El creador la compone en `/pagina`: enciende, apaga y ordena bloques, y elige uno
de tres temas. **La vista previa es el mismo componente que la página pública**,
no una imitación — cualquier copia se separa de la realidad al segundo cambio.

Hecho: el modelo (`0007_course_landing.sql`), los ocho bloques, los tres temas,
el editor con guardado y dirección, y la ruta pública con sus metadatos.
Pendiente: el cobro, la portada (depende de la subida de media) y el perfil
público del creador.

**Guardar es explícito, con botón.** Nada de autoguardado: la página es pública,
y no puede ir cambiando a cada tecla mientras alguien la está leyendo. Lo hace
`saveLanding` en `lib/landing.actions.ts`, que escribe el escaparate y la
dirección y revalida la ruta pública —sin eso el creador vería su cambio en el
editor pero no al abrir su propio enlace—.

La acción **no comprueba de quién es el curso**. Eso lo deciden las policies de
`0007` con la sesión que viaja en la cookie; repetirlo en el servidor daría dos
sitios donde equivocarse. Lo que sí valida es la forma del texto, y solo para
devolver un mensaje legible en vez del error crudo de Postgres.

#### Qué se tomó de Skool y qué no

Se miró skool.com por dentro antes de diseñar. Lo que hace bien: **una sola
página lo explica todo** —portada, nombre, descripción y un botón— sin menú ni
pestañas. Eso se copia.

Lo que deja abierto es el hueco que ocupa esta superficie: **la única palanca de
personalización que Skool da al creador es la imagen de portada**. Tipografía,
colores, orden y secciones son plantilla fija para todos, y el resultado se ve en
su propia página de descubrimiento — una rejilla de miniaturas gritando, porque
cuando el diseño no distingue, la única forma de destacar es subir el volumen de
la imagen. Aquí el creador compone la página, y por eso los temas son **tres
combinaciones cerradas** en vez de un selector de color libre: con libertad total
la mayoría de páginas salen peor, y con tres ninguna puede quedar mal.

Lo que **no** se toma, y es una decisión, no un olvido: su motor es la
gamificación —un punto por like, niveles y tablas de clasificación a 7 días, 30
días e histórica—, montado alrededor del estatus. Es exactamente la comparación
social que este producto existe para evitar. Y por el mismo motivo la página
tampoco lleva su prueba social: nada de "3.800 miembros" ni valoraciones. La
prueba es que **una lección se ve entera y gratis antes de pagar**, que el
paywall de `0002_rls.sql` ya servía sin tocar una sola policy.

### 3. La landing pública — **hecha, en `(public)/page.tsx`**

La cara del producto, en la raíz del dominio. Por eso el panel se mudó a
`/panel`: bihapia.com tiene que enseñar el producto, no un cuadro de mandos.

Le habla a quien mira, no a quien publica, y lleva por delante la tesis
anti-FOMO. El recorrido y el movimiento están adaptados de **houseofhoney.com**.

#### Qué se tomó de la referencia

Se recorrió por dentro antes de diseñar. Va sobre Next.js, Tailwind y **Lenis**,
casi nuestra pila, así que se pudo reproducir de verdad y no de aproximación:

- **La página scrollea dentro de un contenedor**, no en el `body`. Es lo que
  Lenis necesita para gobernar el desplazamiento.
- **Las apariciones se interpolan desde la posición en pantalla**, no se sueltan
  con una clase al entrar. Se ve parando el scroll a media aparición: el texto se
  queda quieto donde esté en vez de terminar solo. Eso es lo que hace que la
  página responda a la rueda de forma continua, y es la mitad de por qué se
  siente suave; la otra mitad es Lenis. Lo comprobé primero en la referencia y
  luego en la nuestra, con los mismos números.
- Su curva, `cubic-bezier(0.65, 0.05, 0.36, 1)`, tal cual: es una curva, no una
  marca.
- Bloques de color a sangre, etiqueta pequeña y frase enorme de medida estrecha,
  marquesina, rejilla de tres y cierre con esquinas redondeadas sobre el pie.

La sección oscura la ocupa **una sola línea que barre la pantalla al bajar**,
`Nothing to chase`, en `Drift`. Va atada al scroll como todo lo demás: si paras,
se para. Un bucle por temporizador al lado de unas apariciones que responden a la
rueda se notaría como dos páginas distintas pegadas.

**La sección se clava y la frase se construye palabra a palabra.** La pista mide
una pantalla y media y lo de dentro va `sticky`, así que mientras pasa, la página
parece detenida y lo que avanza es la frase. La pausa se queda corta a propósito:
clavar el scroll mucho rato no se siente como un efecto, se siente como que la
web se ha roto.

Antes se probó una línea barriendo de un lado al otro y no funcionaba. Ni
ensanchándola ni acortándola: en la posición en que la frase está cómoda de leer
siempre faltaba algo por un lado. El problema era pedirle al scroll dos cosas a
la vez —bajar la página y mover el texto—; clavando la página solo hace una.

**El reparto arranca antes de que la pantalla se clave**, cuando la pista todavía
está entrando. Sin esa ventaja quedaba una pantalla entera de negro con todas las
palabras a opacidad 0 justo al engancharse el clavado — y lo mismo al volver a
subir. Ahora, para cuando la página se detiene, la primera palabra ya está
dentro.

**Y la frase va arriba, no centrada.** Centrada dejaba media pantalla de negro
entre el vídeo y el texto. Pegada al principio de la pista —que empieza justo
donde acaba el vídeo, sin relleno de por medio— la frase entra detrás del vídeo y
ese hueco desaparece. Se probó antes rellenarlo con una entradilla; sobra en
cuanto el hueco no existe.

Con `prefers-reduced-motion` **no se clava nada**: la pista se colapsa y la frase
se ve entera. Atrapar el scroll a quien ha pedido que no haya movimiento sería lo
contrario de lo que pide.

### La portada va enmarcada

Una franja arriba que cierra **al ras del asta de la "h" y del punto de la "i"**,
y el vídeo que abre **al ras del rabo de la "p"**. El nombre queda encajado entre
las dos.

Las dos usan la misma corrección: la caja de la línea no es donde está la tinta,
así que el wordmark sube `--ink-top` para que el filo y el arranque del asta
caigan en el mismo píxel. Comprobado a 1440 y a 375, que es lo que demuestra que
el ajuste en `em` escala.

La nav vive dentro del marco y **no va fija**: se va al bajar, igual que el
vídeo. Va en tres columnas (`1fr auto 1fr`) y no con `justify-between`, porque
así los enlaces quedan centrados **en la pantalla** y no entre el logo y el
botón, que no miden lo mismo.

Lo que **no** se tomó: la paleta —aquí es hueso, tinta y ámbar— ni el wordmark
macizo. El nuestro va en hueco incluso en la portada, porque esa es la regla de
la marca y no se rompe por parecerse más a la referencia.

**Dos tipografías, no tres.** Hubo una serif editorial para las frases grandes,
imitando la tensión sans/serif de la referencia. Se quitó: la marca funciona con
la de display para lo grande y IBM Plex Mono para etiquetas y datos, y la tercera
voz no encajaba. La fuente se retiró también del proyecto — descargándose sin
usarse era peso en cada visita.

#### El vídeo de portada

El original son 3840×2160 y **56 MB a 39 Mbps**, que es bitrate de banco de
imágenes: pensado para reeditar, no para reproducir. Se re-codifica **sin bajar
resolución** y queda en 37 MB.

Se comprobó comparando el mismo fotograma de los dos al 100 %: no se distingue.
Y se probó también 1080p, que baja a 15 MB pero **sí se nota** en una pantalla
Retina —la hierba y los guijarros pierden definición—, así que se descartó.

Lleva `poster`, y no es un adorno: con 37 MB, sin él la portada arranca con un
rectángulo negro. Y va silenciado por obligación, no por gusto.

#### Solo una sección clava la pantalla

La 01. Las demás usan la misma aparición palabra a palabra pero **sin detener la
página**: tres pausas seguidas en una misma bajada dejan de leerse como efecto y
empiezan a leerse como que la web no responde. Lo gobierna la opción `pin` de
`PinnedWords`, sobre el mismo bucle de animación compartido.

#### Las fotos de archivo se quitaron

Eran de archivo, de una reunión de equipo en un loft, y **no decían nada de la
tesis**: no había un móvil, ni vídeo vertical, ni nadie mirando nada. Sirvieron
para juzgar la maqueta y el movimiento y ya no hacen falta, así que se borraron
del repositorio.

En su lugar, la sección 02 lleva el texto que explica qué es Bihapia, y la banda
oscura tres objetivos de marca. Texto en vez de fotos prestadas: es lo que había
que decir desde el principio.

### 4. Feed de consumo en web — la que menos aporta

Nadie hace scroll de Reels en un portátil como hábito. Y un vertical a pantalla
completa en un monitor 16:9 se ve mal. Funciona hoy, pero no es una prioridad.

## Cómo se entra

Correo y código de seis cifras, el mismo flujo que la app (`src/lib/session.tsx`).
Comparten proyecto de Supabase, así que es literalmente la misma cuenta.

**Sin login social, y es deliberado**: `app-store.md` deja escrito que en cuanto
exista Google o Facebook, Sign in with Apple pasa a ser obligatorio en iOS.

Va por **Server Actions** (`lib/auth.actions.ts`) y no por un cliente de
navegador: en una acción sí se pueden escribir cookies, así que el `createClient()`
que ya existía sirve tal cual y no hay un segundo cliente que mantener en
sintonía.

`middleware.ts` refresca el token en cada petición. **No es opcional**: dura una
hora y un Server Component no puede reescribir cookies, así que sin él la sesión
se caería sola y no habría forma de recuperarla salvo volviendo a entrar.

Sin sesión, el panel redirige a `/entrar` — pero **solo si hay configuración**.
Sin `.env.local` no hay nada a lo que entrar, y redirigir dejaría el panel
inalcanzable y mataría el camino de la muestra.

### Todavía sin comprobar

Sin proyecto de Supabase no se ha podido ejecutar el ciclo real: que llegue el
correo con el código, que la sesión se cree y se refresque, que el `upsert`
escriba y que la página pública refleje lo guardado. El código está y compila, y
las policies que lo protegen sí están probadas contra un Postgres real en la
sección 10 de `schema.test.mjs` — pero el camino de ida y vuelta está **pendiente
de comprobar**, no dado por bueno.

Hace falta un proyecto en supabase.com y dos archivos, cada uno copiado de su
`.env.example`: `.env.local` en la raíz con `EXPO_PUBLIC_SUPABASE_URL` y
`EXPO_PUBLIC_SUPABASE_ANON_KEY`, y `studio/.env.local` con
`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

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

Y dentro de `studio/` hay a su vez **dos productos**, separados por grupos de
rutas: `(studio)/` lleva el armazón del panel —cabecera, navegación lateral,
lienzo gris— y `(public)/` no lleva ninguno, porque quien abre una página de
venta viene a mirar un curso y la marca que debe ver es la del creador.

La URL pública es `/[handle]/[slug]`, así que el handle ocupa el primer tramo y
compite con las rutas del panel. Hoy no chocan, pero el día que exista
`/cursos/[id]` quien tuviera el handle `cursos` se quedaría sin página. Como un
handle no se le puede quitar a alguien después sin romperle los enlaces que ya
repartió, `0007` lo impide con un check de palabras reservadas.

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

### Trampas del movimiento, encontradas rompiéndolo

- **Un `requestAnimationFrame` por elemento no escala.** La primera versión de
  las apariciones abría un bucle por cada una: veinticinco bucles peleándose por
  cada fotograma para un trabajo que cabe en uno. Ahora hay un registro
  compartido y un solo bucle, que además se apaga solo cuando no queda nada
  suscrito.
- **`rAF` no dispara con la pestaña en segundo plano.** Verificando, las
  opacidades se quedaban congeladas y parecía que el bucle estaba muerto. No lo
  estaba: el navegador lo pausa. Antes de dar por roto un bucle de animación,
  hay que traer la pestaña al frente.
- **Medir el wordmark mientras parte en dos líneas da un número falso.** Ajusté
  el tamaño con esa medida y me salió la mitad de lo que tocaba. Lleva
  `white-space: nowrap`, y no solo por estética.
- **El marquee se animaba dos veces**, en el contenedor y en la pista. La pista
  es la única que se mueve; el contenedor solo recorta.
- **La cinta se quedaba sin texto por ser más corta que pantalla y media.** Con
  12 copias medía 1866 px y al desplazarse el 50 % hacía falta cubrir hasta
  2364 en una ventana de 1440: el último tercio salía vacío. Poner más copias a
  ojo no vale, porque el número correcto depende del ancho de la ventana. Van
  **dos mitades, cada una de al menos el ancho de la ventana**, y el 50 % de
  desplazamiento empalma solo. El mínimo va en `vw` y no en `%`: la pista es
  `w-max`, así que un `100%` se resolvería contra ella misma.
- **`backdrop-filter` escrito a mano no llega a aplicarse.** El compilador de
  Tailwind v4 se quedó solo con la versión con prefijo —comprobado leyendo el CSS
  servido— y el valor calculado salía `none`: las burbujas eran un cristal sin
  cristal. Va con las utilidades (`@apply backdrop-blur-xl backdrop-saturate-150`),
  que rellenan la cadena de variables que el propio Tailwind espera.
- **Un párrafo dentro de un contenedor flex crece hasta su contenido**, así que
  `flex-wrap` no envuelve nada y el texto se sale por la derecha en vez de partir
  y centrarse. Necesita `w-full`. Le pasó lo mismo a la nav dentro del marco:
  medía 531 px de 1440 y las columnas no repartían nada.
- **Una sombra proyectada permanente bajo una pastilla translúcida se lee como
  pegatina recortada, no como cristal.** En reposo la burbuja solo lleva el filo
  especular de arriba, que sí es parte del material; la sombra entra al pasar el
  cursor, donde además dice algo — que la pieza se puede pulsar.
- **Un velo del color del lienzo desaparece sobre el lienzo.** La burbuja teñida
  con `--color-canvas` componía sobre el hueso exactamente el mismo color: cero
  diferencia, solo la separaba la sombra. El velo es **blanco**, así que siempre
  queda un punto más clara que lo que tenga detrás. Sobre hueso pasa de 0 a 11
  niveles de diferencia; el ratio WCAG sigue siendo 1,1 porque no sirve para
  medir dos casi-blancos, pero el filo se ve. El texto va sobrado en los dos
  fondos: 19,1 : 1 sobre hueso y 10,0 : 1 sobre el vídeo.
- **La caja de una línea de texto no es donde está su tinta.** Con
  `line-height` menor que 1, en el wordmark la "b" empieza 0.0622 em por debajo
  del borde superior y el rabo de la "p" sale 0.0892 em por debajo del inferior.
  Ajustar la separación con `mt`/`pt` es ajustar la caja mientras se mira la
  tinta; los dos márgenes de `.wordmark-hero` cancelan esa diferencia, en `em`
  para que valga a cualquier tamaño. Los números salen de `measureText`.

### Trampas del panel, encontradas rompiéndolo

- **Un componente de cliente no puede importar valores de un módulo que toque
  `next/headers`.** El editor pedía `THEMES` y `formatMoney`, y esos imports
  arrastraron `supabase.ts` al navegador; la compilación se cayó entera. Los
  tipos no cuentan —se borran— pero cualquier constante o función sí. De ahí
  salen `lib/landing.ts` (modelo puro) frente a `lib/landing.server.ts`, y
  `lib/format.ts` frente a `lib/analytics.ts`.
- **`divide-y` de Tailwind no sigue el tema.** Solo pone el grosor; el color se
  queda en `currentColor`, que es la tinta. Sobre papel salía una raya negra
  dura y en el tema Tinta habría sido negra sobre negro, o sea invisible. Los
  filos se piden explícitos con `var(--l-line)`.
- **Para encoger la vista previa, `zoom` y no `transform: scale`.** Con
  `transform` la caja conserva su tamaño original para la maquetación y hay que
  compensar con un margen negativo inventado, que unas veces corta la página y
  otras deja un hueco. `zoom` recalcula la caja y el scroll acaba donde debe.
- **Mover rutas deja tipos generados obsoletos.** Tras reorganizar `app/` en
  grupos, `tsc` se quejaba de módulos que ya no existen. Están en `.next/types`;
  se borran y se regeneran solos.

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

**Resuelto:** un curso no tenía URL. `0007` le da `slug`, único por autor —no
global, porque el handle va delante y dos creadores no se pisan— y añade
`course_landings` con la composición de la página en `jsonb`.

**Pendiente:**

- **Guardar la página de venta.** El editor compone y previsualiza, pero todavía
  no escribe en `course_landings`.
- **Subida de media.** Nada escribe en `media_assets` ni sube ficheros; el bucket
  de Storage no está creado ni tiene políticas. Es lo que bloquea la portada.
- **Edición de cursos.** Las policies dejan al autor gestionar sus cursos y
  `course_items`, pero no hay ninguna interfaz ni flujo de reordenación.
- **Liquidaciones.** Los ingresos ya se pueden leer, pero no hay nada para pagar
  al creador.
- **Verificación.** `creator_verifications` existe y el trigger bloquea el cobro
  sin ella, pero no hay flujo para solicitarla ni para revisarla.
