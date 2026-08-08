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

## Barra de estado adaptativa, segunda vuelta

`FeedList` mira dos cosas para decidir el color de la barra: si la entradilla
activa tiene fondo claro, y si la hoja del caption está abierta sobre un reel.
El segundo caso obligó a subir el estado de "revelado" del item al feed —
el color de la barra es una decisión de pantalla, no de tarjeta.

## Pendientes que siguen abiertos

- **Dónde viven likes, comentarios, guardar y el CTA "ver curso completo".** Al
  dejar de subir el panel inferior se quedaron sin sitio. `InteractionPanel.tsx`
  sigue en el repo, sin montar, esperando esa decisión.
- La portada de las publicaciones: blanco y negro fijos, letras negras o blancas,
  estilo de trazo dibujado. Pendiente de concretar.
- La consulta real de Supabase en `feedRepository` (hoy lanza si hay credenciales).
- El ranking del feed, incluidas las promociones del §3.
- Auth, subida de contenido, pagos (RevenueCat) y comentarios funcionales.
- Naming y assets de marca más allá del wordmark tipográfico (§9).
