# Lo que le falta a la página para estar en internet

Comprobado sobre el código, no supuesto. Ordenado por lo que bloquea.

## Bloquea el lanzamiento

### 1. No está en ningún sitio

La página **solo existe en `localhost:3000`**. No hay dominio, no hay hosting y no
hay despliegue. Todo lo demás de esta lista depende de esto, incluida la analítica
—que necesita un dominio real— y la imagen al compartir.

Con Next 16 y Vercel es de las cosas rápidas. Y **los vídeos tienen que ir en el
repositorio**, no en Git LFS: Vercel no resuelve punteros LFS y servirías archivos
de texto en vez de vídeo. Son 53 MB hoy; la regla es no commitear una
recodificación que no vaya a publicarse.

### 2. Falta el logo

`public/imagenes/logo.svg` no existe, así que **cada carga da un 404** y la
cabecera enseña el wordmark de recambio. Instrucciones de cómo entregarlo en
`studio/public/imagenes/LEEME.md`.

### 3. Sin aviso legal, privacidad ni cookies

Los cuatro enlaces del pie apuntan a anclas de la propia página. **No hay ni una
página legal**, y el formulario guarda nombre y correo en Supabase: eso es
tratamiento de datos personales, con lo que en España hacen falta aviso legal
(LSSI) y política de privacidad con su base jurídica (RGPD), enlazada **junto al
formulario**, no solo en el pie.

De cookies propias no hay ninguna que consentir —Plausible no las usa y la del
idioma es técnica—, así que **no hace falta banner**. Eso fue deliberado al elegir
la analítica y conviene no perderlo.

Es lo único de esta lista con consecuencias legales, no solo comerciales.

### 4. El formulario no tiene dónde escribir en producción

`0009_landing_requests.sql` está en el repositorio pero **hay que aplicarlo al
proyecto real de Supabase**, y el hosting necesita `NEXT_PUBLIC_SUPABASE_URL` y
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. Sin eso el formulario cae al enlace de correo —no
se rompe, pero no guarda nada.

Las variables están documentadas en `.env.example`.

### 5. El precio

La objeción número uno del servicio, y la página no la toca. Necesita que decidas
el modelo antes de escribir una línea. Sin una cifra o un rango, quien entra supone
lo peor y no agenda.

## Se nota, pero no bloquea

### 6. No hay ni una razón para creerse nada

Sin trabajos que enseñar, sin proceso explicado y sin precio, la página pide una
llamada a cambio de confianza pura. Lo que se puede hacer sin inventar nada:
enseñar **esta misma página** como el trabajo, contar **qué pasa en esos 30
minutos**, y conseguir los dos o tres primeros encargos con permiso para
enseñarlos.

### 7. Nada para que la encuentren

No hay `robots.ts` ni `sitemap.ts`. Son dos archivos pequeños en Next y sin ellos
un buscador entra a ciegas. Con una sola página el sitemap importa poco; el
`robots` sí, para no bloquear nada por accidente.

### 8. Detalles que se ven

- **Comprobar el `favicon`**: si sigue siendo el de la plantilla de Next, es lo
  primero que se ve en una pestaña.
- **`<html lang>` se queda en `es`** aunque la página se sirva en inglés. El
  contenido lleva su `lang` correcto en el bloque de dentro, así que un lector de
  pantalla acierta, pero el documento miente. Viene de que el `layout` es
  compartido con el panel, que no se traduce.
- **No hay página de error ni 404 propias**: sale la de Next, que no es de la marca.
- **El correo es `hello.destrier@outlook.com`.** Con dominio propio,
  `hola@destrier.es` dice otra cosa a quien recibe la respuesta.

### 9. Tuyo, fuera del código

- **Calendly en zona horaria de Madrid** — sigue en America/New_York.
- **Google Calendar** conectado en Ajustes del sistema para que las citas aparezcan.
- **Dar de alta el sitio en Plausible** y poner `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`.

## Lo que ya no falta

Portátil con alfa real en todos los navegadores · titular que no se corta en móvil ·
la primera letra que ya no se pierde en Safari · título y tarjeta al compartir que
dicen qué se vende · tres salidas en el recorrido · formulario que valida en el
navegador · medición de las dos conversiones · Next 16 y `motion` al día · cero
errores de lint.
