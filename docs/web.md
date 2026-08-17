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

### 3. La landing pública — **Destrier**, en `(public)/page.tsx`

**Destrier es un servicio.** Alguien sabe algo —un submarinista, un entrenador— y
quiere enseñárselo a su público; aquí se le construye el sitio desde el que
enseñarlo, y después **se le mantiene**. Eso último es la mitad del servicio y es
lo que casi nadie ofrece.

Durante muchas pasadas la página contó a ratos una cosa de formación y a ratos una
de hacer webs, y un visitante no podía saber a qué se dedicaba. Son las dos, y en
este orden: **se hacen webs para quien enseña**. La tesis de marca sigue siendo la
misma: *Be happy about the things you don't know*.

Todo el recorrido —filosofía, por qué el conocimiento necesita una forma, la
pregunta que organiza un curso, la invitación— lleva a **una sola acción**:
contar qué quieres enseñar. Por eso no hay precios, ni paquetes, ni lista de
servicios, ni prueba social, ni un CTA repetido en cada sección. Uno, al final.

La referencia ya no es houseofhoney.com — ver más abajo.

#### Dos nombres a la vez, y es a propósito

La web pública es **Destrier**; el panel del creador y la app móvil siguen
diciendo `bi&hapia`, porque el encargo pedía no tocarlos. Es una inconsistencia
conocida y temporal, no un descuido: unificarla es una decisión de producto, no
algo que deba colar dentro de un cambio de landing.

#### La referencia cambió: ahora es madewithgsap.com

La adaptación de houseofhoney.com se retiró entera. La maqueta actual se sacó
**midiendo fotograma a fotograma** la grabación de `Images/Página a replicar.mov`,
que es un recorrido por madewithgsap.com.

Con ella se fueron el `destrier` gigante en hueco a todo el ancho, el vídeo del
mar y las tres escenas clavadas. Lo que queda de la etapa anterior es lo que
seguía siendo bueno: el contenedor de scroll con Lenis, el registro que interpola
desde la posición en pantalla, la curva, las burbujas de cristal y el formulario.

**Ojo con lo que enseña una grabación.** El fondo de la referencia parecía un gris
cálido en todos los fotogramas y se implementó así; en realidad es blanco, y lo
gris era la atenuación de la propia captura de pantalla. Un color leído de una
grabación no es un color medido.

#### Nada se monta encima de nada

Parecía que la sección oscura entraba **por encima** de la portada. No entra. Se
midió sobre la grabación: cuando aparece, el texto de abajo de la portada ha
subido 638 px y la página ha bajado 637. Va uno a uno. Lo que da esa impresión es
que **la cabecera es fija** y se queda encima de las dos.

La portada llegó a medir una pantalla justa por esto mismo; hoy es una pista de
200svh con lo de dentro `sticky` —ver más abajo— y la relación con lo que sigue no
cambia: una cosa detrás de otra, sin solape.

#### La frase que se enciende palabra a palabra

Es lo que la referencia hace en su sección oscura, y encaja con lo que esta página
ya tenía: la frase está escrita entera desde el principio, apagada, y las palabras
cogen brillo de izquierda a derecha conforme la sección cruza la pantalla. Atado
al scroll: si paras a media frase, se queda donde llegaste.

El brillo es **opacidad y no color**. Sobre un fondo plano dan el mismo píxel,
pero la opacidad es un número que el compositor ya sabe animar, y la misma pieza
vale para la sección clara sin cambiar de fórmula.

#### La poda, y qué sobrevivió

La página llegó a medir **8,9 pantallas** contando tres negocios a la vez: la
portada decía `Destrier FX made with care` —un estudio de efectos—, las secciones
hablaban de enseñar, y una galería y un muro de valoraciones decían que hacíamos
webs. Medido: el 53 % del recorrido era enseñar trabajo ajeno y decir que había
gustado; el mensaje de la marca ocupaba el 16 %.

Se cortó por lo sano y la página bajó a 4,0 pantallas —hoy son 5,9, porque la
portada ganó una pista para el carrete—, y `public/` pasó de 59 MB a **6,6**:

| Se fue | Por qué |
| --- | --- |
| La galería 3D | 3,2 pantallas —el 36 %— de capturas de webs de otros estudios |
| El muro de valoraciones | caras de `randomuser.me` avalando un trabajo que no es este |
| El dock | metáfora de sistema operativo sobre una página de tres anclas; en una landing la navegación es el scroll |
| `portada.mp4` y su póster | 37,4 MB que se servían y no usaba nadie desde cuatro pasadas atrás |
| `lucide-react` | solo la usaba el dock |

Lo que se quedó lo hizo por haberse ganado el sitio: el registro de `motion.tsx`,
depurado a base de romperlo; el `mailto` que funciona sin servidor; los dos vídeos
de dispositivo, que es lo único de la página que es propio; y `.bubble` con el
sistema de tonos.

#### La portada **es** la pregunta

Toda la página existe para una pregunta —*qué quieres enseñar*— que se hacía abajo
del todo, después de cuatro pantallas. Ahora se hace en la primera línea:

```
                 I want to teach
                  sourdough ⟳
```

El hueco rota entre ejemplos concretos —masa madre, apnea, Ableton, ebanistería,
balances— hasta que se pulsa, y entonces **es un campo de texto**. Lo que se
escriba baja al formulario, que llega empezado; y al revés, lo que se escriba en
el formulario se lee arriba. El valor vive en `Landing.tsx` porque lo comparten
dos piezas que están en extremos opuestos de la página.

Los ejemplos hacen en un renglón lo que la galería intentaba en 3,2 pantallas:
enseñar el rango. Antes ahí rotaban adjetivos —"care", "intent", "patience"— que
no decían nada de a qué se dedica esto.

**La caja del titular no se mueve**, que es la trampa de esta pieza desde el
principio: mide 768x154 vacía, con un ejemplo rotando y con `freediving on one
breath` tecleado. Todo va absoluto sobre el ancho completo y el alto lo sostiene un
`&nbsp;` invisible.

Y la sección 02 dejó de ser la 01 con otro color: lleva los **tres principios**
además de la frase que se enciende.

#### El portátil de la portada

`Video final.mov` —ProRes 4444 con alfa, 2880x1800, 32,8 s, 5,76 GB— sustituye a
los dos aparatos que había. **Se reproduce y ya**: hubo una versión que iba
pasando fotogramas con el scroll y era un invento, no lo que se había pedido.

Recortado a la caja de su alfa (100, 310, 2681x1490) y compuesto sobre el blanco
de la página, porque en web no hay formato de vídeo con alfa que pinte en todos
los navegadores. Sale a 2560x1424 y pesa **24 MB**.

**El bitrate hubo que ponerlo a mano**, y es la parte que importa: ni los presets
de `AVAssetExportSession` ni los de `avconvert` lo dejan elegir, y su "máxima
calidad" son 21 Mbps — 88 MB para este clip. Bajar la resolución tampoco servía
(60 MB a 1920). Lo que había que tocar era el bitrate: a 6 Mbps y tamaño completo
son 24 MB y el material aguanta, porque es blanco y negro y sin grano fino. Va por
`AVAssetWriter` con `AVVideoAverageBitRateKey`.

Su alfa llegaba **a ras del borde inferior** del fotograma, así que el aparato
acaba en un canto recto. Ese canto es el borde de la portada y **la sección negra
arranca en la misma línea**: comprobado, el canto del vídeo, el final de la
portada y el principio de `#idea` caen los tres en el píxel 900. La portada no
está clavada ni forzada a una pantalla: mide su alto natural —1,27 pantallas— y el
portátil **se ve entero**.

**No va a sangre**: 86vw, que a 1440 deja 101 px de blanco a cada lado. A ancho
completo entraba de golpe.

Sobre la costura, una sombra que **sale del negro hacia arriba** y se desvanece.
Va en la sección y a todo lo ancho, no dentro de la caja del vídeo: con el
portátil más estrecho, metida ahí solo cubriría su ancho y se leería como un
degradado dentro de la imagen; a todo lo ancho cae también sobre el blanco de los
lados y se lee como una sombra en el suelo.

La portada se quedó en **dos piezas**: el titular con su hueco y el portátil.
Había un párrafo y un botón debajo; el párrafo se fue y el botón bajó a `#idea`,
donde el texto ya ha explicado algo y pedir la acción tiene sentido. Y cambió de
letra: estaba en la monoespaciada en versales —la de los rótulos y los `01 · 02 ·
03`— y a tamaño de botón se leía como una etiqueta grande. Ahora usa la grotesca
del titular, en caja baja.

#### La escala, y por qué la página se veía vacía

No faltaba contenido: **el techo de cada `clamp` cortaba antes de tiempo**. A 1440
de ancho el titular se quedaba en 64 px dentro de una caja de 768 —336 px de
margen muerto a cada lado— y el de sección en 44,6. Se subió la escala entera y se
ensancharon las medidas con ella; subir el cuerpo sin soltar la caja solo habría
cambiado dónde parten las líneas.

Medido en la página después: titular **105,6** (era 64), titular de sección
**73,6** (era 44,6), campos del formulario 24,8 (18,4), etiquetas 13 (11), y el
wordmark **30** (20). La portada sigue midiendo una pantalla justa y no corta nada.

El wordmark vuelve a la **gothic expandida de la marca**. Se descartó aquí en su
día y el descarte estaba mal diagnosticado: a 15 px una expandida se lee como un
logotipo pegado encima, pero el problema era el tamaño y no la letra. Por el
camino cayeron la grotesca del titular y la monoespaciada.

El botón salió de la cabecera —que se queda solo con el nombre— y bajó a la
portada, debajo del campo, donde puede ser grande sin comprimir nada. Como ahora
hay dos iguales, el marcado se sacó a un `Cta` compartido.

#### Los tres puntos, y dónde acaba el texto

Mientras se escribe, detrás de lo escrito aparecen `.` `..` `...` en bucle.

**El sitio hay que medirlo.** El campo está centrado y ocupa todo el ancho de la
línea —es lo que mantiene quieta la caja del titular—, así que el final del texto
no es el final de la caja y con CSS no hay dónde anclarlos. Se pinta un `<span>`
espejo invisible con el mismo texto y la misma tipografía, se mide, y los puntos
van a media anchura del centro. Comprobado: con `bread`, el texto acaba en 846 y
los puntos empiezan en 855.

Y llevan tope. Con el titular a 106 px basta una frase corriente para que lo
escrito mida más que la caja —`how to read a balance sheet without crying` da
1857 px en una caja de 1152— y sin `min()` los puntos se irían fuera de la
pantalla. Con él se paran en el borde, que es donde el campo deja de enseñar
texto. La caja del titular sigue midiendo 1152x260 en los tres casos: vacía, con
un ejemplo rotando y con la frase larga.

El viaje de los ejemplos que rotan **también se mide**: era de 150 px fijos y la
caja pasó a medir justo 150, así que la palabra que entraba cruzaba el recorte
medio visible y parecía cortada por la mitad. Ahora es 1,6 veces el alto de la
caja, leído del DOM.

#### El formulario ya no es un `mailto`

Lo fue mucho tiempo, y por una buena razón: no había dónde recibir nada y la regla
era no fingir un envío. Ahora hay `landing_requests` en el proyecto real
(`nhwkxjfzyayoxzkesvxd`), cuyo `public` estaba **completamente vacío** — las ocho
migraciones del repo nunca se habían aplicado allí, solo corrían contra el
Postgres local de los tests.

**La mitad que importa de esa tabla es que no se pueda leer.** RLS activo, una
sola policy de `insert` para `anon` y `authenticated`, y **ninguna de `select`**:
con RLS, lo que no se permite queda prohibido. La clave pública viaja en el
navegador de todo el que entre, así que una policy de lectura abierta sería
publicar los nombres, los correos y las ideas de todo el que haya escrito.

Y ahí hubo que corregir una aserción mal puesta: **una lectura prohibida por RLS
no da error, devuelve cero filas.** El `permission denied` solo aparece cuando
falta el `grant`, que es otra cosa. El test cuenta filas y además lleva control
positivo —el superusuario sí ve la fila—, porque si no, un cero por tabla vacía
pasaría por bueno. Con el `grant insert` que faltaba en el arnés, 80/80.

El envío va por Server Action, como el resto del panel, y el formulario tiene
estados de enviando, enviado y fallo. **El `mailto` sigue de recambio** si falta
configuración, y quién manda se decide en el servidor y baja como propiedad: así
el botón correcto sale ya en el primer pintado en vez de descubrirse tras una
pulsación que no hace nada.

#### La sección que dice a qué se dedica esto

`About.tsx`, entre `#idea` y `#path`. Titular *"You teach. I build and run the
place you teach from"* y tres pasos numerados que se encienden escalonados con el
registro de `motion.tsx` — el mismo bucle único de siempre, sin librerías nuevas.

Los ejemplos hacen el trabajo: **un submarinista y un entrenador**. Un caso
concreto explica un servicio mejor que tres párrafos de abstracción, y además
marca el terreno — esto no es para empresas con departamento de marketing.

Al meterla en blanco quedaban tres secciones claras seguidas, así que `#path` pasó
a negro: el recorrido vuelve a alternar de principio a fin.

#### El formulario no tiene backend, y no lo finge

La acción es un enlace `mailto` de verdad con las respuestas ya redactadas.
Funciona hoy, sin servidor, y nadie se queda con la sensación de haber enviado
algo que no llegó. El día que haya dónde recibirlo, lo único que cambia es a dónde
apunta.

Y el correo llega a No deseado por el buzón de destino, no por la página: lo envía
el cliente del visitante, así que desde aquí no hay palanca. Lo único que se hizo
fue quitarle al asunto la raya larga.

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

## Dos idiomas sin prefijo

La landing se sirve en inglés o en español según quien entre, y **la URL sigue
siendo `/` en los dos casos**.

Con prefijo —`/en` y `/es`— habría hecho falta una migración: la ruta pública es
`/[handle]/[slug]`, así que el primer tramo es un handle y quien se llamara `es`
se quedaría sin página. Los reservados de `0008` no incluyen ni `en` ni `es`.
Sin prefijo el problema no llega a existir.

**Inglés por defecto, y `Accept-Language` no decide nada.** Lo decidió durante una
pasada y el efecto era que la página salía en un idioma u otro según con qué
ordenador te sentaras: imposible saber qué se está enseñando sin mirar la cabecera
de la petición. Ahora el punto de partida es siempre inglés —el idioma en el que
está escrita la marca— y el español está a un clic en el pie.

`delNavegador` sigue en `idioma.ts` sin que lo llame nadie: reactivarlo es cambiar
una línea, y lo que costó escribir fue el orden por pesos `q`
(`en;q=0.5,es;q=0.9` es español aunque el inglés vaya primero).

**El selector del pie es parte del mecanismo, no un extra.** La detección
automática acierta casi siempre, y cuando falla —alguien con el sistema en un
idioma y la cabeza en otro— sin selector no hay salida.

El texto vive entero en `lib/textos.ts`, tipado: las dos versiones tienen que
cumplir la misma forma, así que una frase sin traducir no compila. No entró
ninguna librería de i18n; para dos idiomas y una página, un objeto y un tipo
hacen lo mismo. Dos consecuencias que no son evidentes:

- **Las acciones de servidor devuelven claves, no frases.** `enviarSolicitud`
  decía `'Falta tu nombre.'` en español a una página en inglés. Ahora devuelve
  `'sin-nombre'` y la frase la pone el lado que sabe el idioma.
- **`lang` va en un `<div>`, no en `<html>`.** El documento lo pone el layout
  raíz, que comparten el panel —español— y esta página. `lang` es global y vale
  el más cercano, así que declarándolo en el bloque de la landing un lector de
  pantalla la pronuncia bien sin tocar el panel.

Y una lección que costó un 500: **`tsc` no ve el límite entre cliente y
servidor**. `idioma.ts` es puro y `idioma.server.ts` lee `next/headers`, como
`landing.ts` y `landing.server.ts`. Juntos, el selector —de cliente— importaba
el nombre de la cookie y se llevaba la API de servidor al navegador. Los tipos
pasaban limpios.

## La pantalla de entrada que hubo, y por qué se fue

Durante una pasada la página abrió con una pantalla propia que se construía con la
rueda —`Soooo.........`, el titular, el hueco— y que **cerraba el scroll** hasta
que escribieras algo y pulsaras Enter.

**Dejó la web inservible.** Con el contenedor en `overflow: hidden`, las once
pantallas de debajo existían y no había forma de llegar a ellas. Se retiró entera
y la portada volvió a ser titular más portátil, con su entrada escalonada.

Vale la pena guardar por qué, porque la idea era buena y el fallo no estaba en la
idea:

- **Se verificó por partes y todas las partes pasaban.** Que la rueda no movía el
  scroll: pasaba. Que el avance pintaba: pasaba. Que la tecla abría: pasaba. Lo
  que no se hizo ni una vez fue **abrir la página y bajar de arriba abajo**, que
  es lo único que lo habría enseñado. Un mecanismo que bloquea el scroll no se
  puede comprobar a trozos: o recorres la página, o no sabes nada.
- **Y había un fallo de verdad debajo.** `useReducedMotion` empieza diciendo que
  no —el servidor no sabe la preferencia— y lo corrige en su efecto, ya en el
  navegador, cuando la entrada **ya ha cerrado el scroll**. Sin una reapertura
  explícita en esa rama, a quien tiene la preferencia puesta la página se le
  quedaba bloqueada para siempre. No lo enseña ningún test y no aparece en la ruta
  normal.

La regla que queda: **nada bloquea el scroll de la landing**. Si vuelve algo así,
la puerta tiene que abrirse sola —un temporizador de seguridad, o una pista alta
sin tocar el `overflow`—. Que la web se pueda usar no puede depender de que un
manejador acierte.

Un detalle que además confunde al medirlo: `overflow: hidden` **no impide asignar
`scrollTop` por código**, solo se lo impide a quien usa la página. Una prueba que
asigne `scrollTop` y vea que se mueve no está probando nada.

## Las tres frases, y por qué ya no clavan la pantalla

`#idea`, `#about` y `#path` revelan su frase con el scroll, cada una de una manera
distinta:

| | | |
|---|---|---|
| **Qué es esto** | negro | el texto ya está, y se **enciende** |
| **Qué es Destrier** | blanco | las palabras se **descubren** tras una cortina |
| **Cómo funciona** | negro | las palabras **llegan** desde abajo |

La cortina va con `clip-path` y no con un `overflow: hidden` por palabra, que era
lo evidente. Recortar por palabra se come las astas y los rabos —ya pasó en el
hueco del titular— y rellenar el recorte agranda la caja, que a su vez pisa la
línea de encima. Con `clip-path` el corte se pide **más grande que la letra**
(`-0.12em` por los lados que no cortan), así que en reposo no recorta nada.

La revelación **sigue atada al scroll**: si paras a media frase se queda a medias,
y si subes se deshace. Eso no cambió.

### Lo que sí cambió: ya no paran la página

Durante varias pasadas estas tres secciones clavaban la pantalla — pista de 2,4
pantallas, texto centrado en ella, y al salir se desplazaba hacia arriba a la
velocidad del scroll para que el despegue no diera un tirón.

Funcionaba, estaba medido al decimal, y **se veía mal**. El problema era
geometría, no ejecución:

- el texto centrado en una pantalla clavada deja media pantalla de vacío arriba y
  otra media abajo, siempre;
- la fase de salida lo empuja fuera por arriba, así que a media escena la frase
  aparece cortada y debajo hay un desierto;
- y con **tres seguidas**, la página entera se convierte en un pasillo.

Se quitó el clavado y la página pasó de 11,6 a **5,9 pantallas sin perder una sola
palabra**. La medida que lo dice: el mayor tramo de recorrido en el que ni un
texto ni un vídeo cruzan la banda central de la pantalla es **cero**, en
escritorio y en móvil. Antes de esto era casi una pantalla.

La lección, que es la cara y no la técnica: un mecanismo puede estar perfectamente
implementado y ser la decisión equivocada. Las capturas a media escena lo decían
desde el principio; las medidas de opacidad y desplazamiento, no.

## Los dos aparatos

En la sección que explica el servicio van un portátil y un teléfono, porque el
texto dice *«la web, la página de acceso o el sistema entero»* y esto lo enseña en
vez de contarlo.

Vienen en ProRes 4444 **recortados**: no llevan fondo negro, llevan alfa. En web
no hay formato de vídeo con alfa que pinte en todos los navegadores, así que se
componen **sobre el blanco de la página** al exportar. Si algún día se ven con un
marco oscuro alrededor, la exportación está mal, no el CSS.

Y salen **a su tamaño real**, recortados a la caja de su alfa:

| | caja en el original | salida | peso |
|---|---|---|---|
| portátil | 1776x1088 de un fotograma de 2500x1875 | 1776x1088 | 24 MB |
| teléfono | 576x1152 | 576x1152 | 5,8 MB |

La primera versión sacó el teléfono a 1100 de ancho: ampliar el doble un recorte
de 576 px es más peso y más borroso a la vez. El codificador está en
`scripts/codificar.swift`, y esta vez se queda en el repositorio — se escribió, se
usó y se perdió con la carpeta temporal.

## El botón manuscrito

Debajo de la frase de `#idea` había un párrafo pequeño que repetía la idea con
menos fuerza. Se quitó, y lo que queda es el botón — que ahora tiene que sostener
la pantalla él solo, así que va **a doble cuerpo y en manuscrita** (Caveat, cuarta
fuente del proyecto y **solo aquí**).

Rompe la regla de que los botones van en la grotesca, y la rompe a propósito: es
la única acción de la página. Se descartó una caligráfica enlazada porque el resto
suena formal y una letra de invitación de boda ahí dentro sería otra cosa.

Dos cosas que costaron una medida:

- **La manuscrita necesita más caja.** Altura de equis baja y rabos largos: con el
  relleno vertical del botón normal, la `p` y la `g` tocaban el borde de la
  píldora.
- **Y menos ancho del que parece.** Con `whitespace-nowrap` y relleno de
  escritorio, el botón medía **389 px en una pantalla de 375**. El mínimo del
  `clamp` no basta: lo que desborda es el relleno, y va atado al ancho.

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
- **`getBoundingClientRect` incluye los `transform`; `offsetHeight` no.** La
  columna mide su tarjeta para sacar el paso, y desde que hay escala el rect
  devolvía el alto ya encogido: de ahí un paso menor, de ahí otra escala, y así.
  Cuando lo que se necesita es el tamaño de maqueta y no el pintado, la propiedad
  es `offsetHeight`.
- **Medir un elemento que este mismo efecto ya ha movido.** La entrada de la
  portada calcula dónde tiene que empezar cada mitad del titular a partir de dónde
  está. React monta dos veces en desarrollo, y la segunda pasada medía las mitades
  con el desplazamiento de la primera ya aplicado: la cuenta salía 0 y la portada
  abría sin abrirse. Se borran los estilos y se fuerza el recálculo antes de leer.
  Es la misma trampa que la escena clavada que se medía a sí misma.
- **`gsap.getProperty` sobre un elemento fuera del DOM devuelve siempre 0.** La
  columna arrastra un `div` de mentira que no está en la página, y leerle la `y`
  con `getProperty` daba cero: acaba en `getComputedStyle`, y un elemento
  desconectado no tiene estilo calculado. Draggable funcionaba —su `y` iba a
  −720 mientras arrastraba— pero la columna leía otra cosa. Se lee de la
  instancia, con `function` y no con flecha, que GSAP llama a sus devoluciones
  con la instancia como `this`.
- **`allowNativeTouchScrolling: true` se lleva también el ratón.** Estaba puesto
  para que en táctil el gesto vertical fuera el scroll de la página; el efecto
  real es que Draggable cede el eje entero y `onDrag` no llega nunca, ni con
  ratón. `onPress` sí disparaba, así que parecía que el arrastre estaba
  enganchado. Se cambió por preguntar directamente si hay `(pointer: fine)`.
- **`mix-blend-mode` dentro de un elemento `fixed` no tiene página detrás.** El
  wordmark de la cabecera iba en blanco con `difference` para leerse sobre el
  fondo claro y sobre el oscuro. `position: fixed` crea contexto de apilado, y
  dentro de él la mezcla no encuentra el fondo de la página: salía blanco sobre
  blanco, invisible. Ahora el color lo decide mirando qué sección hay debajo.
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
  tinta; se cancelaba con dos márgenes en `em`, para que valiera a cualquier
  tamaño. Los números salían de `measureText`. La clase que los llevaba se
  retiró con la portada antigua, pero la trampa es la misma en cuanto vuelva a
  haber un texto grande al ras de algo.
- **Los eventos de puntero sintéticos no bastan para comprobar GSAP.** Draggable
  despacha `onDrag` desde su *ticker*, no desde el `pointermove`, así que
  disparar los eventos y leer el DOM en la misma vuelta enseña siempre el estado
  anterior. Y la pestaña del panel de vista previa está en `hidden`, donde
  `requestAnimationFrame` no corre: nada se anima hasta que una captura de
  pantalla fuerza un fotograma. Dos veces pareció que el arrastre estaba roto y
  no lo estaba.

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
