# Bihapia

App móvil de feed vertical (tipo Reels) con filosofía anti-FOMO y una capa de
microcursos freemium. Expo (React Native) + Supabase.

**Antes de tocar nada de producto o diseño, lee `../BIHAPIA_CONTEXT.md`** — y si
lo que tocas es la landing de `studio/`, lee `../DESTRIER_MARCA.md`: son **dos
marcas distintas** compartiendo repositorio. Bihapia es la app; Destrier es el
estudio que hace webs. Mezclar su identidad ya costó media docena de pasadas. Es la
fuente de verdad de todas las decisiones tomadas. Este archivo solo cubre cómo
está montado el código. El porqué técnico está en `docs/decisions.md`.

## Arrancar

```bash
npx expo start
```

Y en otra ventana, Run desde Xcode (`xed ios`) o `npx expo run:ios`. El montaje
nativo de esta máquina está en [docs/native-setup.md](docs/native-setup.md) —
tiene truco, porque el Ruby del sistema no sirve.

Sin `.env.local` la app funciona igualmente: el feed sirve los datos de
`src/data/mock.ts` y no hay sesión. **Ese camino no se puede romper**: es lo que
permite trabajar en la interfaz sin backend.

## Mapa

- `src/app/` — rutas (expo-router). `index.tsx` es el splash, `feed.tsx` el feed.
- `src/theme/` — paleta, tipografía, espaciado, curvas de animación. **Todo color,
  tamaño y duración sale de aquí**; no hay literales sueltos en los componentes.
- `src/components/GlassSurface.tsx` — la única abstracción del material Liquid
  Glass. Ninguna pantalla debe importar `BlurView` ni `GlassView` directamente.
- `src/components/feed/` — lista, tarjetas y panel de interacción.
- `src/data/feedRepository.ts` — única puerta de entrada del feed a los datos.
- `supabase/migrations/` — esquema y RLS. Ver `docs/data-model.md`.

- `studio/` — **el panel del creador**, un proyecto Next.js aparte con su propio
  `package.json`. Metro lo ignora por `metro.config.js`, y el `tsconfig` de la
  app lo excluye: son dos proyectos que comparten repo y base de datos, nada más.
  Se arranca con `npm --prefix studio run dev`.

La estrategia web está en [docs/web.md](docs/web.md).

## Reglas que no se rompen

- **La curiosidad es siempre gratis.** No añadas precio a `curiosities`, ni en la
  base de datos ni en los tipos. El paywall vive solo en los cursos.
- **Cobrar exige verificación.** El trigger `courses_require_verification` lo
  impone en la base de datos; no lo dupliques ni lo sustituyas por una
  comprobación en el cliente.
- **La primera vista de una publicación no lleva interfaz.** Ni iconos, ni
  nombre, ni contadores. Todo eso aparece al tocar. Si añades algo encima del
  contenido por defecto, estás rompiendo el §5.
- **El wordmark es `bi&hapia`**, en minúsculas y con ampersand, en Special
  Gothic Expanded One y siempre **en hueco**. El §5 del contexto pide una
  cursiva: está desactualizado, la dirección cambió a un lenguaje técnico.
- **`RevealText` no trocea el texto.** Lo pinta de una pieza y lo tapa con una
  máscara. Un elemento por letra rompería el espaciado entre pares que calcula
  la fuente.
- **El feed tiene tres niveles y un solo valor que los gobierna.** `depth` va de
  0 (contenido limpio) a 1 (caption) a 2 (ficha completa). No añadas estados
  paralelos: el caption y la ficha son valores derivados de `depth`.
- **Del tap no sale nada desde abajo.** En un reel se abre una hoja blanca desde
  el centro con el caption; en una entradilla de texto solo aparece la firma. Si
  vuelves a montar un panel inferior, estás deshaciendo una decisión tomada.
- **Sin contadores en la app.** La ficha tiene botones que cambian de color, no
  números. Enseñar cuánta gente ha dado a "me gusta" es la comparación social que
  el producto existe para evitar. **La regla es del consumidor, no del creador**:
  el panel de `studio/` es todo cifras, y así debe ser.
- **La landing vive en `/` y el panel en `/panel`.** La raíz del dominio enseña
  el producto, no un cuadro de mandos. Antes de añadir una ruta de dos tramos al
  panel, mira los handles reservados de `0008`: la pública es `/[handle]/[slug]`
  y una ruta estática nueva puede dejar sin página a quien tenga ese handle.
- **El wordmark en hueco es el de la app y el del pie, no el de la cabecera.** La
  de la landing lo lleva **macizo y en la gothic expandida de la marca, a 30 px**.
  Probamos la grotesca del titular y la monoespaciada y las dos fallaron; lo que
  fallaba de la gothic era el tamaño, no la letra — a 15 px una expandida se lee
  como un logotipo pegado encima. El hueco sigue siendo la regla donde el tamaño
  lo permite (`.wordmark`).
- **La cabecera lleva la marca, centrada, y se aparta al bajar.** Estuvo arriba a
  la izquierda; centrada choca con el contenido, que también va centrado, y el
  primer scroll ya montaba un titular encima de ella. No se mueve ni encoge: solo
  se apaga la opacidad en los primeros 35 % de pantalla de recorrido, y vuelve al
  subir. La marca es un **logo** (`public/imagenes/logo.svg`) con el wordmark de
  texto de recambio; el recambio se decide mirando `naturalWidth` al montar, **no
  solo con `onError`** — el HTML llega hecho del servidor, así que el fallo de
  carga ocurre antes de que React enganche el manejador y ese evento no lo oye
  nadie: la cabecera se quedaba con un `<img>` roto de cero píxeles y sin
  recambio.
- **La cabecera solo lleva la marca.** La portada llevó durante muchas pasadas
  solo el titular y el portátil, y **eso cambió con una medida delante**: la
  primera oportunidad de agendar estaba a 2,1 pantallas —el 27 % del recorrido—,
  así que quien entraba y no bajaba no tenía nunca nada que pulsar. Ahora hay un
  **enlace de texto** bajo el titular, y una tercera salida al final de `#path`,
  donde se termina de leer qué se vende. Son tres en total y ninguna es un botón
  grande: si la portada se llena, lo que se quita es el enlace, no el titular.
- **Las dos conversiones de la página se miden, y solo esas dos.** `agendar` y
  `solicitud`, desde `medir()` en `components/site/medir.ts`. La solicitud se
  cuenta **cuando el servidor dice que sí**, no al pulsar: contar los envíos
  fallidos inflaría la única cifra que importa. La analítica es Plausible, se
  enciende con `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` y **sin esa variable no se carga
  nada** — ni ensucia las cifras en local ni rompe el camino sin configuración. Va
  solo en la página pública: el panel del creador no se mide.
- **Lo que se ve fuera de la página tiene que decir qué se vende.** El `<title>`
  y la descripción de Open Graph dijeron durante mucho tiempo *«Sé feliz con las
  cosas que no sabes»* — **el lema de bi&hapia, la app**, en la página del
  estudio, sin una palabra del negocio y en la cadena más visible que existe. La
  tarjeta al compartir la genera `(public)/opengraph-image.tsx` leyendo el mismo
  diccionario, para que no se quede vieja a la primera reescritura.
- **Los botones van en la grotesca, no en la monoespaciada.** La mono es la letra
  de los rótulos y los `01 · 02 · 03`; a tamaño de botón se lee como una etiqueta
  grande en vez de como una acción.
- **El movimiento de la landing se apaga con `prefers-reduced-motion`**, entero:
  Lenis, apariciones, resaltado por palabras, entrada de la portada, marquesina y
  cortina. Y lo atado al scroll se interpola desde la posición en pantalla, no con
  una clase al entrar — si lo cambias por una clase, deja de sentirse continuo.
  Vive en `components/site/motion.tsx`, y la entrada en `Hero.tsx`.
- **Destrier vende dos cosas, y la página tiene que decir las dos.** Sistemas para
  quien enseña —cursos, reservas, pagos, área de alumnos— y **webs de empresa para
  captar clientes**. Durante muchas pasadas la página solo hablaba de enseñar y
  dejaba fuera a media clientela. Los dos servicios salen con su nombre en `#path`;
  si un texto vuelve a hablar solo de enseñar, está incompleto.
- **Y las dos se construyen y después se mantienen.** Si un texto no deja claro
  *quién* hace el trabajo y que sigue ahí después de entregar, está mal escrito.
  Quien lo hace es **Destrier**, nombrado, no una primera persona.
- **La página abre en español**, y el inglés está a un clic en el pie. `elegirIdioma`
  no mira `Accept-Language`: el punto de partida es fijo.
- **De lo que llega de fuera se coge el mecanismo, no el andamiaje.** El botón de
  la flecha viene de un componente de shadcn y entró **sin una sola dependencia**:
  ni `components/ui`, ni `cn()`, ni `class-variance-authority`, ni
  `@radix-ui/react-slot`, ni `lucide-react` para un icono. Este proyecto no es
  shadcn y no se va a convertir.
- **El enlace de Calendly es `calendly.com/hello-destrier/30min`**, el único evento
  activo de la cuenta. Si se cambia el `slug` en Calendly, el enlace muere sin que
  nada avise: no redirige.
- **Lo que no se puede permitir fallar no va en una clase de Tailwind.** El botón
  de agendar se vio negro sobre negro **dos veces**: fondo y color eran clases, y
  sin ellas queda texto oscuro sobre sección oscura, invisible y sin que nada
  avise. Sus colores y medidas van en `style`, que lo pinta el navegador con el
  marcado. Lo mismo con las columnas de los servicios: `repeat(auto-fit, minmax())`
  en `style` en vez de `sm:grid-cols-2`, que además de poder perderse dependía de
  un punto de ruptura y apilaba los bloques en ventanas donde cabían de sobra.
  Y el **cuerpo y la medida de los textos**: el párrafo de apoyo se veía de borde
  a borde en Safari y bien al medirlo aquí, porque `max-w-[46ch]` era una clase
  recién escrita que ese navegador no tenía compilada. Ahora sale de `CUERPO` y
  `MEDIDA_PARRAFO` en `WordScroll.tsx`, **en `style`**, y es la misma constante
  que usan los títulos de los bloques: miden lo mismo por construcción, no por
  coincidencia. Van ya cuatro veces que una clase entre corchetes se pierde.
- **Verifica al ancho en el que mira quien te lo pide, no al tuyo.** Tres pasadas
  seguidas midiendo a 1440 mientras el fallo solo aparecía por debajo de 740: los
  bloques apilados, la flecha vertical cruzando el texto y el titular desbordando.
  Si dice que se ve mal y las medidas dicen que está bien, **el ancho no es el
  mismo**.
- **Las clases de Tailwind se escriben enteras, nunca se construyen al vuelo.**
  Tailwind lee el código fuente buscando clases literales; una que solo existe al
  ejecutarse —`` `sm:grid-cols-${n}` `` o un ternario que la parte— puede no llegar
  nunca a la hoja de estilos, y entonces la rejilla cae a una columna o el botón se
  queda sin fondo **sin que nada falle**. Pasó con las dos cosas a la vez.
- **Si algo se ve mal en el navegador y bien al medirlo, la hoja de estilos está
  vieja.** Antes de tocar código: recargado forzado y volver a mirar. Se perdió una
  pasada entera persiguiendo un botón invisible que en el servidor tenía fondo.
- **Las solicitudes del formulario no se pueden leer con la clave pública.**
  `landing_requests` tiene RLS con una sola policy de `insert` y ninguna de
  `select`. Si algún día hay bandeja en `/panel`, que mire el rol; abrirla a
  `anon` sería publicar los correos de todo el que ha escrito.
- **Una lectura prohibida por RLS devuelve cero filas, no un error.** El
  `permission denied` es que falta el `grant`, que es otra cosa. Los tests de RLS
  cuentan filas y llevan control positivo, o un cero por tabla vacía pasa por
  bueno.
- **El titular no depende de JavaScript para verse. Nunca.** La entrada de la
  portada la hacía un efecto que ponía las piezas a `opacity: 0` y las traía dos
  fotogramas después; cuando ese efecto no llegaba a correr, **el titular se
  quedaba invisible** — la primera línea de la página, en blanco. Ahora la entrada
  es una animación de CSS, que corre sola, y **el titular no la lleva**: está desde
  el primer pintado y nada le toca la opacidad. Si se quiere animar, que la
  animación añada movimiento a algo ya visible, no que lo revele desde cero.
- **El hueco del titular mide lo que mide el ejemplo más largo, y se mide.** Lo
  sostenía un `&nbsp;` con el interlineado del titular: **una línea y solo una**.
  En una pantalla estrecha dos de los cinco ejemplos no caben a lo ancho
  —«presentar mi empresa» pide unos 420 px y hay 350—, envolvían a dos líneas, y
  con el `overflow: hidden` de la caja **la segunda línea se cortaba** y la tinta
  se subía encima de la línea anterior. En escritorio los cinco caben en una línea
  y por eso no se vio nunca. Ahora una regla invisible pinta los cinco, se coge el
  más alto **y se le suma el relleno vertical de la caja** —`min-height` cuenta
  desde el borde y la regla mide solo la tinta; sin esos nueve píxeles seguía
  asomando—. Se mide en vez de fijar un número porque hay dos idiomas y una frase
  nueva en `textos.ts` no puede volver a romperlo.
- **El hueco del titular va en bloque, no detrás del texto.** Con el interlineado
  apretado del titular la tinta se sale de su caja, y el hueco —que recorta— se
  montaba encima del final de la línea. La caja no está donde está la tinta, otra
  vez.
- **No hay ámbar en la página, y tampoco manuscrita.** El ámbar era una píldora
  naranja enorme en una página en blanco y negro; la manuscrita (Caveat) entró
  para ese único botón y se fue con él. En `#idea` lo que hay es **un enlace de
  texto para agendar llamada**, en la grotesca, con subrayado que se enciende al
  pasar. Tres familias en total: grotesca para leer, mono para rótulos, gothic
  para el nombre.
- **El enlace de Calendly está en una constante `AGENDA` al principio de
  `Landing.tsx`**, y hoy vale `CAMBIAME`. Mientras diga eso, el enlace no lleva a
  ningún sitio.
- **El portátil de la portada lleva su alfa dentro de la imagen.** No existe
  formato de vídeo con transparencia que reproduzcan todos —Safari hace HEVC con
  alfa, Chrome y Firefox VP9 con alfa, y no se solapan—, así que `mac-empaquetado.mp4`
  es un MP4 corriente **al doble de alto**: el color arriba y el recorte en gris
  abajo. `Mac.tsx` los junta con WebGL. Un archivo, un resultado, todos los
  navegadores.
  El color va **premultiplicado** desde el codificador y el lienzo se pide
  premultiplicado: desmultiplicar para volver a multiplicar es de donde salen los
  halos oscuros en el borde. Y la máscara sale **del mismo dibujo** que el color,
  no de un segundo escalado — dos escalados independientes no caen en el mismo
  píxel.
- **Componer sobre un color no vale cuando detrás hay algo, y no hay umbral que
  lo salve.** El portátil compuesto sobre negro es un rectángulo opaco; con los
  arcos detrás cortaba el abanico con un salto de **87 niveles de luminancia**,
  medido, y en todos los navegadores igual. Se intentó apagar los arcos antes de
  llegar a él y **no puede funcionar**: dónde cae el borde del portátil depende de
  la forma de la ventana —el 40 % de la altura de la portada a 1990x1000 y el 77 %
  a 375x812—, así que cualquier porcentaje que sirva en una pantalla falla en
  otra. Si algo tapa a los arcos, la salida es darle alfa de verdad, no afinar un
  número.
- **Los vídeos se etiquetan con su espacio de color** (`AVVideoColorPropertiesKey`,
  BT.709). Sin etiqueta cada navegador adivina el rango al decodificar y el mismo
  negro sale a un nivel distinto en cada uno. Con la alfa empaquetada es crítico:
  la mitad de abajo **no es imagen, es un dato**, y un desplazamiento de niveles
  ahí es un recorte con borde blando en un navegador y duro en otro.
- **El portátil sale en dos tamaños, y no es lo mismo que dos formatos.** Lo
  prohibido es un **códec** por navegador: eso daba dos resultados distintos. Dos
  tamaños del mismo MP4 los reproducen todos, y lo único que cambia es cuántos
  píxeles hay que mover. Cuál se coge se decide **al montar** con `matchMedia`, no
  con `<source media>` —ese atributo no lo respetan todos en vídeo y acabarías
  descargando los dos—.
- **En este portátil lo caro es `texImage2D`, no los arcos.** Perfilado con la CPU
  de un móvil frenada x4: **77 % en la subida de la textura y 1 % en los arcos**,
  que eran el sospechoso obvio. Con la alfa empaquetada el fotograma mide
  2560x2832 y en un teléfono se dibuja en 671x371 — veintinueve veces más píxeles
  de los que se ven. Con la variante de 1280 el móvil pasó de **17 a 87 fps** con
  la CPU x4. **Antes de optimizar un bucle de dibujo aquí, perfila**: bajar el
  número de subidas no sirvió de nada, porque a esa velocidad ya iban por debajo
  del tope.
- **El póster del portátil no se descarga en el camino bueno.** Va en un
  `<noscript>` —que el navegador solo pide si el scripting está apagado— y se pide
  desde JavaScript si WebGL no arranca. Así el recambio de 376 KB no le cuesta
  nada a quien no lo necesita. El vídeo que lo alimenta va fuera de la vista pero
  **nunca con `display: none`**: así oculto no decodifica en algunos navegadores y
  la textura se queda en negro.
- **Los vídeos de dispositivo se recortan a la caja de su alfa y salen a su tamaño
  real.** En el original el teléfono ocupa 576 px de ancho de un fotograma de
  2500: sin recortar se paga el peso de un 4K para enseñar un móvil, y ampliarlo
  es lo que lo pone borroso. Nada de sacarlos más grandes de lo que vienen.
- **Nada bloquea el scroll de la landing. Nunca.** Hubo una pantalla de entrada
  que cerraba el `overflow` del contenedor hasta que escribieras algo, y **dejó la
  web inservible**: todo lo de abajo existía y no había forma de llegar. Se
  retiró entera. Si algún día vuelve una idea así, la puerta tiene que abrirse
  sola —temporizador de seguridad, o una pista alta sin tocar el `overflow`—; que
  la web se pueda usar no puede depender de que un manejador acierte.
- **Una portada se verifica recorriéndola, no por partes.** El bloqueo se
  comprobó a trozos —que la rueda no movía el scroll, que el avance pintaba, que
  la tecla abría— y todos los trozos pasaban. Lo que nunca se hizo fue abrir la
  página y bajar de arriba abajo, que es lo único que habría enseñado que estaba
  rota. **Antes de dar por buena una pasada: cargar `/` limpio, comprobar que
  `overflow` es `auto`, y recorrer las cinco secciones.**
- **`repartir` reparte los arranques sobre `1 - ventana`, no sobre 1.** Antes el
  último elemento se quedaba en 0,875 a progreso 1 y no llegaba nunca: la última
  palabra de cada frase, permanentemente más apagada. Solo se ve midiendo.
- **Nada de la landing clava la pantalla, y la página mide seis pantallas.** Las
  tres frases se revelaron durante un tiempo con la pantalla clavada, y el precio
  era geometría: una pista de más de dos pantallas por sección, el texto centrado
  en ella y desplazándose al salir. Cada sección dejaba media pantalla de vacío
  arriba y otra abajo, y con tres seguidas la página era un pasillo. Se quitó, y
  la página bajó de 11,6 a 5,9 pantallas **sin perder ni una palabra**.
- **El contraste de la landing está medido, no estimado.** Se pasó entera por las
  pautas de Apple (`~/.claude/skills/apple-design`) y salieron **43 textos por
  debajo del mínimo** —rótulos a 3,16:1, numeración a 2,71:1, etiquetas del
  formulario a 3,71:1, el lema del pie a 2,95:1—. Todos venían de opacidades
  bajas: `opacity-35/40/45/50/55` sobre blanco o negro no llega a 4,5:1. **El
  suelo es `opacity-60`, y `opacity-65` para texto corrido.** Antes de bajar una
  opacidad, calcula el ratio.
- **Todo lo que se pulsa mide 44 px.** Los enlaces del pie median 16 de alto y el
  selector de idioma 18x16. Se arregla con `min-h-[44px]` y relleno vertical, y un
  `-my-3` en el contenedor para que la caja crezca sin mover la tinta. Los campos
  del formulario se quedaban en 41 en móvil: `pb-4`, no `pb-3`.
- **El espaciado se ve por el salto, no por la cantidad.** Todos los huecos median
  lo mismo —24/74/73/74 px— y por eso la sección se leía pegada; subirlos de 9 a
  14 svh no se notó, porque seguían siendo todos iguales. La escala está en `AIRE`
  en `WordScroll.tsx` y tiene que haber **más del doble** entre estar dentro de un
  grupo (40) y entre grupos (140). Y va **en píxeles, no en `svh`**: `svh` encoge
  en una ventana con barra del navegador, que es justo donde peor se ve.
- **Un vídeo compuesto sobre un color no se puede mudar de sección.** Los aparatos
  se sacaron sobre blanco para la sección clara; al pasarlos a la negra había que
  **volver a codificarlos** o habrían salido con un rectángulo blanco alrededor. El
  fondo es ahora un argumento de `scripts/codificar.swift` (`blanco`, `tinta`,
  `negro`, `alfa` o `empaquetada`), y la comprobación que lo delata es mirar el
  píxel de la esquina del vídeo: tiene que ser el color de la sección — o alfa
  cero, si va empaquetado.
- **El aire entre secciones lo da el corte de color, no el hueco.** Llegó a haber
  `py-[18svh]` y `space-y-[12svh]` encima del clavado. Antes de añadir margen
  vertical, mira cuánto recorrido queda sin nada en pantalla: la medida es el
  mayor tramo en el que ni un texto ni un vídeo cruzan la banda central, y tiene
  que ser cero.
- **La longitud se gana con contenido, no con recorrido.** La página llegó a nueve
  pantallas contando tres negocios a la vez —efectos, formación y hacer webs— y se
  podó a cuatro; después volvió a doce por las escenas clavadas, que eran
  recorrido sin contenido. Antes de añadir una sección, mira qué porcentaje del
  recorrido se lleva: la galería que se quitó ocupaba el 36 % y el mensaje de la
  marca el 16 %.
- **Las tres frases se revelan distinto a propósito.** `#idea` **enciende** un
  texto que ya está escrito y apagado; `#about` lo **descubre** tras una cortina;
  `#path` lo **construye** desde nada. Tres seguidas con la misma forma: si se
  revelaran igual serían la misma sección repetida.
- **La cortina va con `clip-path`, no con `overflow: hidden`.** Recortar por
  palabra se come las astas y los rabos —ya pasó en el hueco del titular— y
  rellenar el recorte agranda la caja, que pisa la línea de encima. Con
  `clip-path` el corte se pide **más grande que la letra** y en reposo no recorta
  nada.
- **Para comprobar de verdad hay Playwright, y trae WebKit.** El panel de vista
  previa es Chromium con `requestAnimationFrame` congelado, sin eventos de teclado
  y sin forma de emular `prefers-reduced-motion`. Con Playwright se comprueba en
  **el motor de Safari**, con movimiento reducido de verdad
  (`reducedMotion: 'reduce'`), teclado real y la CPU frenada por CDP
  (`Emulation.setCPUThrottlingRate`). Así salió el fallo de la primera letra, que
  llevaba meses ahí y **solo pasaba en Safari**.
- **El foco se pide en el mismo manejador, nunca en el fotograma siguiente.** El
  hueco del titular enfocaba dentro de un `requestAnimationFrame` «por si el campo
  no estaba pintado». Un elemento con `opacity: 0` **sí acepta el foco** —el que no
  lo acepta es uno con `display: none`—, y ese fotograma de retraso llegaba después
  de la primera tecla: en Safari escribías «bucear» y quedaba «ucear». En Chrome la
  carrera se ganaba por poco y no se veía. Mismo código, dos comportamientos.
- **`prefers-reduced-motion` no se puede emular en el panel de vista previa**, y
  disparar un `change` a mano tampoco vale: `matchMedia` devuelve un objeto nuevo
  en cada llamada, así que el evento no llega al oyente del hook. Para
  comprobarlo de verdad hay que cambiar la consulta por una que siempre case,
  mirar, y revertir. **El panel tampoco entrega eventos de teclado** —se puede
  escribir texto, pero un Enter no llega a la página—, así que un manejador de
  tecla se comprueba con un `KeyboardEvent` despachado, que sí burbujea hasta
  React. Y `requestAnimationFrame` está congelado: los enfoques diferidos a un
  fotograma, los tweens de `irA` y cualquier suavizado no avanzan salvo que una
  captura de pantalla fuerce el fotograma.
- **Nada de manuscrita.** Entró una Caveat para el botón grande de `#idea` y se
  fue con él: cuatro familias en una página son demasiadas, y una fuente que se
  descarga para un solo elemento es peso en cada visita. Quedan tres — grotesca
  para leer, mono para rótulos, gothic para el nombre.
- **La voz de la página es la de un estudio: Destrier hace el trabajo.** Ni "yo"
  ni "nosotros". Estuvo en primera persona y sonaba a autónomo. La única primera
  persona que queda es la de quien entra —*I want to teach*— y esa se queda.
- **La landing está en inglés por defecto**, y en español solo si se pide con el
  selector del pie, que deja la cookie `destrier-idioma`. **`Accept-Language` no
  decide nada**: llegó a decidirlo y hacía que la página saliera en un idioma u
  otro según con qué ordenador te sentaras, imposible de saber sin mirar la
  cabecera. La URL sigue siendo `/` en los dos casos, lo que esquiva reservar `en`
  y `es` como handles en `0008`. El panel y la página de venta siguen solo en
  español.
- **Todo el texto de la landing vive en `lib/textos.ts`.** Un objeto tipado con las
  dos versiones: si falta una frase en un idioma, no compila. No hay librería de
  i18n y no hace falta. Y **las acciones de servidor devuelven claves de error, no
  frases** — una acción no sabe en qué idioma se está sirviendo la página.
- **El límite entre cliente y servidor no lo ve `tsc`.** `idioma.ts` es puro y
  `idioma.server.ts` es el que lee `next/headers`, igual que `landing.ts` y
  `landing.server.ts`. Cuando estaban juntos, el selector —que es de cliente—
  importaba el nombre de la cookie y arrastraba la API de servidor al navegador:
  la comprobación de tipos pasó limpia y la página devolvía un 500.
- **El idioma no se decide en `proxy.ts`.** Parece el sitio y no lo es: ese
  archivo **se sale antes de tiempo si no hay `.env.local`**, que es justo el
  camino de la muestra. Se lee donde se usa, en `(public)/page.tsx`. El precio es
  que esa página deja de ser estática, y es un precio aceptado.
- **El titular de la portada es el formulario.** `I want to teach ___` comparte
  su valor con el campo *What do you want to teach?* del contacto, y ese valor
  vive en `Landing.tsx`. No lo dupliques en ninguna de las dos puntas.
- **La sesión se refresca en `proxy.ts`, no en `middleware.ts`.** En Next 16 ese
  nombre está deprecado: el archivo es `proxy.ts` y la función se llama `proxy`.
  Hay codemod (`npx @next/codemod@canary middleware-to-proxy .`), pero se planta
  si hay cambios sin commitear. La diferencia que importa: **`proxy` corre en Node
  y no admite el runtime `edge`**. Aquí da igual —solo habla con Supabase por
  HTTP—; si algún día hiciera falta `edge`, hay que volver al nombre viejo.
- **La animación viene de `motion/react`, no de `framer-motion`.** Es el mismo
  proyecto renombrado; `framer-motion` es el paquete heredado. La migración es una
  línea de `import`. Y es **solo para el hueco del titular**: todo lo demás —lo
  atado al scroll, las apariciones, la entrada de la portada— va en el registro de
  `motion.tsx` y en transiciones de CSS. GSAP entró para la columna
  arrastrable y salió con ella. Antes de traer otra librería de movimiento:
  la página scrollea en un contenedor propio, así que `ScrollTrigger` y compañía
  obligan a montar un `scrollerProxy` para calcular un número que ya se calcula.
- **Este proyecto no es shadcn y no se va a convertir.** No hay `components.json`,
  ni `tailwind.config.*` —Tailwind v4 va por CSS con `@theme`—, ni `cn()`, ni
  `components/ui`. Los componentes de la landing viven en `components/site/`. De
  los componentes que llegan de fuera se coge el mecanismo, no el andamiaje.
- **El vídeo de la portada se reproduce y ya. No va atado al scroll.** Hubo una
  versión que pasaba sus fotogramas con la rueda: era un invento y encima cortaba
  el portátil por la mitad. El aparato se ve entero, su canto recto de abajo es el
  borde de la portada, y la sección negra arranca en esa misma línea.
- **El codificador vive en `scripts/codificar.swift`**, y esta vez se queda en el
  repositorio. Se escribió, se usó, se perdió con la carpeta temporal y hubo que
  volver a escribirlo entero. `swiftc -O scripts/codificar.swift -o codificar` y
  `./codificar <entrada.mov> <salida.mp4> <ancho> <mbps>`.
- **Los fotogramas por segundo son la otra mitad del peso, y el bitrate es por
  segundo, no por fotograma.** El portátil de la portada se saca a **30** desde un
  original de 60: la mitad de subidas a la GPU y la mitad de trabajo. Pero bajar
  solo los fps **no adelgaza el archivo** —salieron los mismos 31 MB, con el doble
  de bits por fotograma—; hay que bajar también el bitrate a la mitad. A 30 fps y
  4 Mbps son 16 MB con la misma calidad por fotograma que a 60 y 8, y el canto del
  recorte pasa de 1 a 2 px sobre un fotograma de 2560 — poco más de un píxel en
  pantalla.
- **El bitrate de los vídeos se pone a mano.** Los presets de
  `AVAssetExportSession` y de `avconvert` no lo dejan elegir y su "máxima calidad"
  son 21 Mbps — 88 MB para el clip de la portada. Bajar la resolución no arregla
  eso (60 MB a 1920). Se codifica con `AVAssetWriter` y
  `AVVideoAverageBitRateKey`: a 6 Mbps y tamaño completo son 24 MB.
- **Al exportar no se reescala con CoreImage.** Su transformación afín no filtra,
  y sobre material con detalle fino eso alias: se ve pixelado. Va por `CGContext`
  con interpolación alta. Costó tres intentos descubrirlo.
- **La página de venta tampoco lleva cifras.** Ni alumnos, ni valoraciones, ni
  "312 personas ya lo tienen". Es la misma comparación social que la regla de
  arriba evita, solo que en el escaparate. La prueba de que el curso vale es que
  se ve una lección entera gratis (`course_items.is_preview`). Skool hace lo
  contrario y es deliberado no seguirle: ver [docs/web.md](docs/web.md).
- **La vista previa del editor y la página pública son el mismo componente.**
  `components/landing/Landing.tsx` se renderiza igual en `/pagina` y en
  `/[handle]/[slug]`. Si alguna vez hay dos versiones, "lo que ves es lo que se
  publica" deja de ser verdad al segundo cambio.
- **El creador ve cuántos, nunca quiénes.** Sus datos salen de las funciones
  agregadas de `0006_creator_analytics.sql`. No abras las policies de
  `purchases` ni de `interactions` para que le cuadren los números: eso expondría
  el rastro de cada persona.
- **El caption nunca va quemado en el vídeo.** Es un campo de `curiosities` que
  pinta la app, para que sea moderable, traducible y accesible.
- **Nada escribe en `purchases` desde el cliente.** Eso lo hace el webhook del
  proveedor de pago con la service role key.
- **El feed se ve sin cuenta.** El §2 dice que la curiosidad no tiene fricción.
  La sesión se pide en el momento de interactuar, nunca al abrir la app. No
  metas un muro de registro en la puerta.
- **Los cursos se cobran con IAP, no con Stripe.** Es obligatorio en iOS
  (guideline 3.1.1) y condiciona el margen. Ver [docs/app-store.md](docs/app-store.md).
- **No añadas login social sin leer antes** `docs/app-store.md`: en cuanto haya
  Google o Facebook, Sign in with Apple pasa a ser obligatorio. La app y el panel
  entran igual, con **código de seis cifras al correo**, y así debe seguir.
- **La sesión del panel va por cookies y Server Actions.** `studio/` no usa el
  cliente de la app: `lib/supabase.ts` con `@supabase/ssr`, y `proxy.ts`
  para refrescar el token —que dura una hora y que un Server Component no puede
  reescribir—. No metas un cliente de navegador en paralelo.
- **El panel manda a entrar, salvo sin configuración.** `(studio)/layout.tsx`
  redirige a `/entrar` si no hay sesión, pero **solo si `isConfigured`**. Sin
  `.env.local` no hay nada a lo que entrar, y redirigir dejaría el panel
  inalcanzable y mataría el camino de la muestra.
- **Las acciones del panel no comprueban de quién es cada cosa.** Eso lo deciden
  las policies con la sesión de la cookie. Duplicar la comprobación en el
  servidor da dos sitios donde equivocarse, y el que manda no sería ese.
- **Todo texto SVG declara `fontFamily`.** Un `<Text>` de React Native hereda la
  del sistema; un texto SVG no, y en web cae al serif del navegador.

## Verificar un cambio

```bash
npm run typecheck    # tipos
npm run test:schema  # esquema SQL contra un Postgres real, sin Docker
```

Y pruébalo en un dispositivo o simulador: el splash y el feed son gesto y
animación, y ningún test estático te va a decir si se sienten bien.

Si tocas `supabase/migrations/`, `npm run test:schema` es obligatorio. Las reglas
de monetización del §2 y del §4 están escritas como constraints, y ese test es lo
único que comprueba que siguen bloqueando lo que deben.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
