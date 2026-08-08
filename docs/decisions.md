# Decisiones técnicas

Registro corto de por qué el proyecto es como es. La fuente de verdad de producto
sigue siendo `BIHAPIA_CONTEXT.md`; esto solo cubre lo técnico.

## Stack: Expo (React Native) + Supabase

Frente a Flutter y a nativo, decidido sobre tres prioridades: velocidad de MVP en
equipo pequeño, animación fluida tipo Apple, y capacidad de escalar.

- Un solo código TypeScript para iOS y Android, con ciclo editar-ver de segundos.
- Reanimated ejecuta gestos y animaciones en el hilo de UI: el swipe del splash y
  el panel del feed van a la tasa de refresco real, sin pasar por JS.
- **iOS 26 da Liquid Glass auténtico** vía `expo-glass-effect`, que envuelve
  `UIGlassEffect`. Ni Flutter ni una reimplementación a mano llegan ahí.
- Supabase es Postgres estándar: si el backend se queda corto, el esquema migra
  sin rehacerse.

Descartado nativo (SwiftUI + Compose) por ser dos bases de código.

## Gesto para revelar el panel: tap

Frente al swipe lateral, que quedaba abierto en el §9. El tap no compite nunca
con el scroll vertical, que es la acción principal del feed, ni con el
back-swipe de borde de iOS.

Implementado con `Pressable` y no con `Gesture.Tap()` de gesture-handler: dentro
de una lista con scroll, `Pressable` es notablemente más fiable.

## Caption nativo y hoja blanca, nada que suba desde abajo

El caption quemado se descarta: el texto es un dato (`curiosities.caption`) que
pinta la app, así que es buscable, traducible y accesible, y se puede moderar sin
pedirle al creador que vuelva a subir el vídeo.

Al tocar un reel **no sube ningún panel**. Una hoja blanca opaca se abre desde el
centro hacia arriba y hacia abajo hasta cubrir la pantalla, y sobre ella entra el
caption con la firma del autor. Mientras se lee, el vídeo no compite.

La hoja se anima con `scaleY` desde su centro, que es el origen por defecto de
`transform` en React Native: de ahí sale el efecto de pintarse desde el medio sin
máscaras. El texto va en una capa aparte para que la escala no lo deforme.

Abre con muelle y cierra con curva. Cerrar con muelle hace que la hoja rebote al
desaparecer, y un rebote a la salida se lee como un fallo, no como carácter.

En las entradillas de texto no hay hoja que abrir: la tarjeta ya es una superficie
plana con su texto, así que el tap solo revela la firma del autor sobre el propio
fondo. Mismo gesto, la respuesta que pide cada formato. Esto último es criterio
mío, no una instrucción — el cambio se pidió para los reels.

## `GlassSurface` como única abstracción del material

Ninguna pantalla importa `BlurView` ni `GlassView`. `src/components/GlassSurface.tsx`
decide: material del sistema en iOS 26, blur con tinte y filo especular en el
resto. Cambiar de implementación no toca ninguna pantalla.

Lleva un **velo oscuro obligatorio** bajo el contenido. No es decoración: el
material del sistema toma su claridad de lo que tiene detrás, así que sobre una
entradilla de fondo blanco el cristal se volvía blanco y el texto del panel
desaparecía. Se detectó probando en el simulador, no leyendo el código.

## Barra de estado adaptativa en el feed

`FeedList` calcula la luminancia del fondo de la tarjeta activa y cambia el estilo
de la barra. Sin esto, la hora y la batería desaparecen sobre las entradillas de
fondo claro.

## `feedRepository` con dos implementaciones

El feed lee de `src/data/feedRepository.ts`, que sirve datos de prueba mientras no
haya credenciales de Supabase. La app es demostrable el día uno y la pantalla no
cambiará ni una línea cuando llegue el backend real.

## El splash se escribe, no aparece

El wordmark **no es tipografía**. Es lettering de línea única dibujado a medida
en `src/components/handwriting/wordmark.ts`, animado con `strokeDasharray` +
`strokeDashoffset`: lo que crece en pantalla es la propia línea, no una máscara
que descubre algo ya dibujado.

Esa distinción es la razón de todo el módulo. Una fuente da **contornos
cerrados**, así que animar el contorno de una letra dibuja su silueta —se ve el
bolígrafo bajar por un lado y volver por el otro—, y cualquier máscara sobre
texto es un barrido, no una escritura. Para que parezca una mano, el trazo tiene
que ser la línea que recorre la punta del bolígrafo, y eso hay que dibujarlo.

`alphabet.ts` lleva 19 glifos cursivos en las mismas métricas, con los que se
compone el eslogan. Cada glifo entra por (0,108) y sale por (advance,108) con el
enlace incluido, así que las letras se encadenan solas sin lógica de ligaduras.

`layout.ts` reparte el tiempo de escritura **proporcional a la longitud de cada
trazo**, no por número de letras. Si cada letra recibiera la misma porción, una
"i" se escribiría tan despacio como una "w" y el resultado se lee como una
máquina.

`measurePath.ts` calcula la longitud del trazado por muestreo, porque
react-native-svg no tiene `getTotalLength()` y sin la longitud no hay animación.

### Fondo blanco

Única pantalla clara de la app: tinta negra sobre papel. El trazo del eslogan va
más fino que el del wordmark (5 frente a 7) porque se dibuja mucho más pequeño, y
con el grosor del wordmark los ojos de las letras cerradas se rellenaban y la "s"
dejaba de leerse.

### El eslogan lo escribe el dedo

El progreso de escritura **es** el valor del gesto. Arrastras hacia abajo y se va
escribiendo; subes y se desescribe, sin una línea de código extra: es el mismo
valor yendo hacia atrás. Se descartó una animación de duración fija porque
bloqueaba la entrada al feed durante tres segundos en cada arranque.

## La portada se genera, no se sube

Cada publicación tiene portada aunque nadie la haya hecho:
`src/components/cover/` dibuja una composición en SVG a partir del id, el título
y el autor. Cuatro arquetipos —lockup, arco, numerado y sello— y el reparto es
**determinista por id**: la misma publicación enseña siempre la misma portada.
Si se sorteara, cambiaría en cada render, y una portada que baila no es una
portada.

Blanco y negro fijos, trazo de un punto, versalitas muy espaciadas: el idioma es
el de una lámina técnica, no el de una miniatura de vídeo. Se dibuja en cliente
porque así no cuesta ni una petición ni un byte de almacenamiento, y porque una
publicación sin portada subida sigue teniendo algo que enseñar.

**Sobre el origen.** La gramática viene de un pack de micrografías de Figma
Community, pero **no hay un solo asset importado**: está todo redibujado. Los
recursos de Community llevan licencia propia y las fuentes que traen dentro no se
relicencian con la plantilla, así que nada de ese archivo viaja en la app. Lo que
se toma prestado es el idioma visual, que no se licencia.

Dos cosas que costó acertar y conviene no deshacer:

- **El viewBox se estira a la proporción del hueco.** El lienzo de diseño es 9:16
  y los móviles son más largos; con un viewBox fijo la lámina quedaba encajada
  con franjas muertas arriba y abajo.
- **`fitTitle` nunca recorta palabras.** El texto SVG no ajusta línea ni informa
  de su ancho, así que el cuerpo se calcula a mano; la primera versión se comía
  el final de las frases largas, que es peor que verse pequeño porque el
  resultado parece correcto.

## Tres niveles de profundidad, un solo valor

El feed no tiene "estados": tiene una profundidad continua, `depth`, que va de 0
a 2.

```
0 — contenido a sangre, sin un solo elemento de interfaz
1 — el caption: hoja blanca desde el centro (reel) o la firma (texto)
2 — la ficha completa, que sube desde abajo
```

Un tap alterna entre 0 y 1. Un arrastre vertical mueve entre niveles. El caption
y la ficha son valores derivados del mismo `depth`, así que no hay dos estados
que se puedan desincronizar.

**El arrastre solo está activo a partir del nivel 1.** En el nivel 0 el eje
vertical pertenece al feed, que es donde pasas de una publicación a la siguiente;
dos gestos peleando por el mismo eje no se pueden desambiguar y siempre pierde
alguien. Por eso, mientras hay algo revelado, `scrollEnabled` está en false.

La consecuencia es que arrastrar hacia abajo desde el nivel 1 cierra el caption:
es la salida natural del modo lectura y evita que el usuario quede atrapado
teniendo que acordarse de tocar otra vez.

## La ficha no tiene contadores

Botones grandes que cambian de color al pulsarlos, y ningún número: ni likes, ni
comentarios, ni guardados. Enseñar cuánta gente ha dado a "me gusta" es
exactamente la comparación social que el anti-FOMO quiere evitar. Sabes lo que
has hecho tú; no cuántos van ganando.

Fondo plano, no glass: la ficha es una pantalla aparte, no una capa flotando
sobre el contenido.

## Barra de estado adaptativa, segunda vuelta

`FeedList` mira dos cosas para decidir el color de la barra: si la entradilla
activa tiene fondo claro, y si la hoja del caption está abierta sobre un reel.
El segundo caso obligó a subir el estado de "revelado" del item al feed —
el color de la barra es una decisión de pantalla, no de tarjeta.

## Pendientes que siguen abiertos

- La portada de las publicaciones: blanco y negro fijos, letras negras o blancas,
  estilo de trazo dibujado. Pendiente de concretar.
- Los likes y guardados de la ficha son estado local: no se persisten en ningún
  sitio hasta que exista auth y la escritura contra `interactions`.
- "Comments" es hoy un botón sin destino.
- La consulta real de Supabase en `feedRepository` (hoy lanza si hay credenciales).
- El ranking del feed, incluidas las promociones del §3.
- Auth, subida de contenido, pagos (RevenueCat) y comentarios funcionales.
- Naming y assets de marca más allá del wordmark tipográfico (§9).
