# imagenes/

Aquí va **`logo.svg`**, el logotipo de Destrier, y la cabecera lo coge sola.

Cómo tiene que venir:

- **En tinta (`#0a0a0a`) sobre transparente.** La cabecera lo invierte con
  `filter: invert(1)` cuando pasa por encima de una sección oscura; si el
  archivo ya trae dos colores o un fondo, la inversión lo estropea.
- **SVG**, para que aguante cualquier densidad de pantalla. Si acaba siendo PNG,
  se cambia la extensión de `LOGO` en `components/site/Header.tsx` y ya.
- El alto lo pone la cabecera (24–34 px); el ancho sale de la proporción del
  archivo. Recórtale el espacio en blanco de alrededor o se verá pequeño.

**Mientras el archivo no esté, la cabecera enseña el wordmark de texto.** No hay
nada roto: es el recambio, y desaparece solo en cuanto exista `logo.svg`.
