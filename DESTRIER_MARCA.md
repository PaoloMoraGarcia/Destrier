# Destrier — contexto de marca

Documento para dar contexto a una herramienta de diseño (generador de logos,
diseñador, agencia). Todo lo que hay aquí **ya está decidido y está en la página**:
no son intenciones, es lo que se ve en `studio/` funcionando.

> Este archivo es de **Destrier**, el estudio. La app móvil se llama **bi&hapia** y
> tiene su propio contexto en [BIHAPIA_CONTEXT.md](BIHAPIA_CONTEXT.md) — feed
> vertical, anti-FOMO, microcursos. Son dos marcas y comparten repositorio, nada
> más. No mezcles su identidad con esta.

---

## 1. Qué es

**Destrier es un estudio que construye y mantiene sistemas web para otros.** No es
una plataforma, no hay nada que registrar y no hay nada que aprender: el cliente
cuenta qué necesita y Destrier lo diseña, lo construye y **lo mantiene en marcha**.

Vende **dos cosas**, y las dos con nombre propio:

1. **Sistemas para quien enseña.** Cursos, reservas, pagos y área de alumnos —
   todo lo que hace falta para cobrar por lo que uno sabe sin pegar cinco
   herramientas con cinta adhesiva.
2. **Webs de empresa.** Una presencia clara, escrita y construida para que entren
   clientes. No para hacer bonito: para traer trabajo.

**El mantenimiento es la mitad del servicio**, y es lo que casi nadie ofrece. Si
un mensaje de marca no deja claro que Destrier sigue ahí después de entregar,
está incompleto.

## 2. A quién le habla

- Alguien que sabe algo —un submarinista, un entrenador, un profesor— y quiere
  cobrar por enseñarlo, pero no quiere convertirse en montador de herramientas.
- Una empresa pequeña o mediana cuya web no le trae clientes.

Ninguno de los dos es técnico. Ninguno de los dos quiere aprender un panel.

## 3. El nombre

**Destrier**: el caballo de guerra de la Edad Media, el que montaba el caballero
en la carga. Grande, entrenado y caro, y **no se montaba para viajar**: se sacaba
para el momento que importaba. Es un animal de trabajo, no de adorno — que es
exactamente la posición: la herramienta seria que alguien saca cuando va en serio.

Se escribe **`destrier`, en minúsculas**, siempre. Nunca en versales, nunca
`DESTRIER`, nunca `Destrier Studio` ni `Destrier FX` (eso fue una identidad
anterior, de efectos visuales, y está retirada).

## 4. La paleta — dos colores, y no hay tercero

```
Tinta   #0a0a0a   (negro, no puro: el puro vibra sobre pantalla)
Hueso   #f4f4ef   (blanco cálido, no #ffffff)
```

**No hay color de acento.** Hubo un ámbar (`#f5a623`) y se retiró: era una
píldora naranja en una página en blanco y negro, y en cuanto se quitó la página
se leyó mejor. Un logo que dependa de un color de acento para funcionar no sirve
aquí.

El ritmo de la página lo da **el corte entre tinta y hueso** sección a sección, no
el color. Eso significa que **el logo tiene que funcionar en los dos sentidos**:
tinta sobre hueso y hueso sobre tinta, sin versión especial para cada uno. En la
web la cabecera literalmente lo invierte al pasar de una sección a la otra.

## 5. La tipografía — tres familias y cada una tiene un trabajo

| Familia | Cuál | Para qué |
|---|---|---|
| Gothic expandida | Special Gothic Expanded One | **Solo el nombre.** El wordmark, nada más. |
| Grotesca | Inter Tight | Todo lo que se lee: titulares y texto corrido. |
| Monoespaciada | IBM Plex Mono | Rótulos, numeración `01 · 02 · 03`, etiquetas. |

**Nada de manuscrita.** Entró una Caveat para un solo botón y se fue con él.

El wordmark actual es texto en la gothic expandida, **macizo, a 30 px**, y en el
pie **en hueco** (relleno vacío, contorno de 1,2 px). Probamos ponerlo en la
grotesca y en la mono y las dos fallaron.

## 6. La voz

- **Habla el estudio, nombrado.** «Destrier construye y mantiene…». Ni «yo» ni
  «nosotros» — estuvo en primera persona y sonaba a autónomo.
- La única primera persona que queda es la del cliente: *«Quiero un sistema
  para ___»*, que es el titular de la portada y a la vez el campo del formulario.
- Frases cortas, verbos concretos, cero jerga de agencia. Nada de «soluciones»,
  «potenciar», «transformación digital».
- **Sin cifras de vanidad.** Ni número de clientes, ni valoraciones, ni «312
  personas ya lo tienen». Es deliberado, y viene de la filosofía del otro
  producto de la casa: la comparación social no vende aquí.

## 7. Cómo se siente la página (que es donde va a vivir el logo)

- Negro y hueso, alternando por secciones a sangre.
- Un abanico de arcos blancos finos barriendo despacio detrás del titular, sobre
  negro. Geometría limpia, trazo de 1,5 px, nada orgánico.
- Un MacBook y un iPhone en vídeo, sin marco y sin sombra.
- Movimiento atado al scroll: el texto se revela palabra a palabra. **Todo se
  apaga con `prefers-reduced-motion`.**
- Mucho aire, y el aire está medido: 128 px entre bloques distintos, 40 dentro de
  un mismo grupo.

Resumen en una línea: **técnico, sobrio, geométrico y con mucho negro.**

## 8. Qué se espera del logo

**Dónde va a vivir**: centrado en una cabecera fija, a **24–34 px de alto**, sobre
negro y sobre hueso alternándose mientras se hace scroll. También en el favicon y
en la firma del correo.

Lo que tiene que cumplir:

- **Legible a 24 px de alto**, que es su tamaño real. Todo lo que se pierda ahí
  sobra.
- **Un solo color, sobre transparente.** Se entrega en tinta `#0a0a0a` y la web lo
  invierte a hueso cuando toca. Si necesita dos tintas para leerse, no vale.
- **SVG**, con el espacio en blanco recortado.
- Funcionar **cuadrado** (favicon, avatar) y **apaisado** (cabecera) sin rehacerlo.
- Geométrico y construido, a juego con los arcos: círculos, ángulos, trazo de
  grosor constante.

## 9. Qué **no** debe llevar

- **Un caballo literal.** El nombre ya es el caballo; un caballo dibujado encima
  lo dice dos veces y convierte un estudio técnico en un club de hípica. Si algo
  del animal entra, que sea abstracto — una carga, un impulso, una silueta
  reducida a geometría —, no una ilustración.
- **Color de acento.** No hay tercer color en esta marca.
- **Degradados, brillos, sombras, biselados, 3D.** La página es plana.
- **Una `D` en un círculo.** Es el logo por defecto de todo estudio pequeño.
- **Iconos de tecnología**: `</>`, un cursor, un cohete, un rayo, un engranaje.
- **Cualquier cosa que solo se lea grande.** El sitio donde va son 24 px.
- **Una segunda tipografía.** Si el logo lleva letra, es la gothic expandida en
  minúsculas o es un símbolo sin letra.

## 10. Datos

- Contacto y agenda: `calendly.com/hello-destrier/30min`
- Web: la landing de `studio/`, en `/` — español por defecto, inglés a un clic.
