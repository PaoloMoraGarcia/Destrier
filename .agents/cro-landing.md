# CRO de la landing de Destrier

**Fecha:** 2026-08-16 · Medido sobre la página real a 1440x900 y 390x844.
Contexto en [product-marketing.md](product-marketing.md).

Página: homepage que hace de landing. Acción única: agendar 30 minutos en Calendly
o mandar el formulario del final. **Tráfico hoy: ninguno.**

## Lo que está medido, no opinado

| | |
|---|---|
| Alto de la página | **7,5 pantallas** |
| Acciones para agendar en toda la página | **1** |
| Dónde aparece la primera | a **2,1 pantallas** (27 % del recorrido) |
| Acción visible al llegar | **ninguna** |
| Campos del formulario | 5, **ninguno obligatorio** |
| Analítica instalada | **ninguna** (ni GA, ni Plausible, ni PostHog, ni Umami) |
| Imagen para compartir (`og:image`) | **no hay** |
| `<title>` | «Destrier · Sé feliz con las cosas que no sabes» |

---

## Ganancias rápidas

### 1. El título de la página es el lema de la otra marca ✅

`<title>` y la descripción de Open Graph dicen **«Sé feliz con las cosas que no
sabes»**. Esa frase es la filosofía anti-FOMO de **Bihapia, la app** — no dice
nada de construir sistemas web, y es justo la confusión de identidad que
`CLAUDE.md` lleva media docena de pasadas intentando evitar. Está en la cadena más
visible que existe: la pestaña, el resultado de búsqueda y cualquier enlace pegado
en un chat.

Alternativas, las tres dicen lo que se vende:
- `Destrier · Sistemas para quien enseña y webs que traen clientes`
- `Destrier · Construimos y mantenemos el sistema de tu negocio`
- `Destrier · Cursos, reservas y pagos, montados y mantenidos`

### 2. Nada que compartir ✅

Sin `og:image`, pegar el enlace en WhatsApp, LinkedIn o Slack sale como un enlace
pelado. Hoy **el único canal de Destrier es mandar el enlace a gente**, así que
esto se paga en cada envío. Una imagen 1200x630 con el wordmark sobre tinta y la
frase de qué se vende. Se puede generar en el propio Next con `opengraph-image`.

### 3. El formulario solo dice lo que falta después del viaje al servidor ✅

**Corrección de una versión anterior de este documento:** dije que se podían
recibir solicitudes sin forma de contestar. **Es falso** — la acción de servidor
ya exigía nombre, correo y tema (`requests.actions.ts`). Lo que fallaba es que el
navegador no lo sabía: no había `required`, el botón estaba suelto fuera de un
`<form>`, y un campo vacío no se descubría hasta después de pulsar y esperar, con
el aviso abajo del todo, lejos del campo.

**Hecho:** los tres campos van marcados, el envío es un `<form>` de verdad —así
el navegador para el envío y enfoca lo que falta—, y los dos opcionales lo dicen.

### 4. No hay analítica ✅

Hoy no se sabe cuánta gente entra, cuánta llega al formulario ni cuánta pulsa
agendar. Todo lo de este documento se está decidiendo a ciegas, y también lo de
mañana. Es lo primero, antes que cualquier cambio de copy: si no, no habrá forma
de saber si algo funcionó.

---

## Cambios de calado

### 5. Cero acciones en las dos primeras pantallas ✅

Quien llega ve un titular, un portátil y **nada que hacer**. La primera
oportunidad de agendar está a 2,1 pantallas. Toda visita que se vaya antes se
pierde entera, y en una página que hoy recibe visitas contadas, eso duele.

Esto choca de frente con una regla escrita del proyecto —*«la portada solo lleva el
titular y el portátil»*—, así que **es decisión tuya, no mía**. Lo que dicen los
números: una acción visible al llegar es de lo que más mueve la aguja en una
página así. Un enlace de texto discreto bajo el titular, en la misma línea sobria
del resto, no rompería la portada.

### 6. Una sola acción en 7,5 pantallas ✅

Entre la llamada del 27 % y el formulario del final hay **cuatro pantallas y media
sin una sola salida**. Quien se convence leyendo los dos servicios —que es el
sitio donde se convence— no tiene dónde pulsar. Una repetición al final de la
sección de servicios cubre ese hueco.

### 7. No hay ni una razón para creerse nada

Sin trabajos que enseñar, sin nombres, sin testimonios y sin precio, la página
pide una llamada a cambio de confianza pura. Es **el problema número uno** y no se
arregla con copy.

Lo que sí se puede hacer sin inventar nada:
- **Enseñar esta misma página como el trabajo.** Está construida por Destrier, se
  ve al abrirla, y demuestra el nivel mejor que un testimonio.
- **Enseñar el proceso**: qué pasa en esa llamada de 30 minutos, cuánto se tarda,
  qué se entrega. La ansiedad de «no sé en qué me estoy metiendo» se mata con
  transparencia, no con prueba social.
- **Los primeros dos o tres trabajos, aunque sean baratos o gratis**, con permiso
  para enseñarlos. Es la única salida de verdad.

Lo que **no** hay que hacer: inventarse logotipos, testimonios o cifras. Además de
ser mentira, la página tiene una regla explícita contra las cifras de vanidad.

### 8. No hay precio, ni rango, ni «desde»

La objeción número uno de este tipo de servicio, y la página no la toca. Sin una
cifra, quien entra supone lo peor —o supone que si no lo dices es porque es caro—
y no agenda. Un simple *«los proyectos arrancan en X»* filtra a quien no puede
pagarlo y tranquiliza a quien sí. Requiere que decidas el modelo de negocio, que
hoy está sin definir.

---

## Ideas para probar (cuando haya tráfico que medir)

Ninguna de estas se puede evaluar hoy: sin analítica no hay línea base, y con
visitas contadas no hay significancia. Quedan anotadas para cuando la haya.

1. **Acción visible al llegar** vs. la portada actual. La de mayor recorrido.
2. **Precio de entrada visible** vs. sin precio. Bajará las llamadas y subirá las
   que valen; lo que hay que medir es la segunda cosa, no la primera.
3. **«Agendar una llamada» vs. «Ver si esto encaja»** — el segundo promete menos y
   asusta menos a quien no está listo para comprar.
4. **El formulario contra el Calendly.** Son dos acciones compitiendo por la misma
   intención; puede que una sola convierta más que las dos.

## Copy del botón

El actual, *«Agendar una llamada»*, describe la mecánica y no lo que se gana.
Alternativas:
- **«Cuéntame qué necesitas»** — el listón más bajo, no compromete a nada.
- **«Ver si esto encaja»** — permite decir que no, y por eso cuesta menos pulsarlo.
- **«Agendar 30 minutos»** — dice lo que cuesta en tiempo, que es la duda real.

## Lo que quedó hecho, medido después

| | antes | ahora |
|---|---|---|
| Acciones para agendar | 1 | **3** |
| La primera, a | 2,1 pantallas | **0,6** (0,5 en móvil) |
| Mayor tramo sin salida | 4,5 pantallas | **~3,5** |
| Campos que el navegador valida | 0 de 5 | **3 de 5** |
| Analítica | ninguna | instrumentada, a falta de encender |
| Tarjeta al compartir | enlace pelado | imagen 1200x630 generada |

Sin tocar: el titular, el portátil, la paleta ni la estructura de secciones.

## Por dónde empezar

1. ~~Analítica~~ · ~~título e imagen de compartir~~ · ~~formulario~~ — hechos
2. **Encender la medición**: `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` con el dominio real,
   y dar de alta el sitio en Plausible. Hasta entonces no se recoge nada.
3. **Precio o rango** — necesita que decidas el modelo de negocio
4. **Prueba**: enseñar el proceso, y conseguir los primeros trabajos enseñables
