# Camino a la App Store

Qué falta para que Bihapia se pueda publicar, en orden de riesgo. Escrito para
que dentro de tres meses siga siendo cierto.

## Lo que bloquea por calendario, no por código

- **Alta en el Apple Developer Program**, 99 $/año. Como persona física tarda
  días; como empresa, semanas, porque exige número D-U-N-S. **Empezar el alta
  antes de necesitarla**: no depende de que la app esté lista y es lo único que
  no se puede acelerar.
- **Comprobar que "Bihapia" está libre** como nombre en App Store Connect y como
  marca.
- **Política de privacidad y Términos publicados en una URL.** Sin ellos no se
  puede ni rellenar la ficha.

## Guideline 1.2 — contenido generado por usuarios

Es el motivo número uno de rechazo de las apps tipo TikTok, y exige **las cuatro
cosas**:

1. Filtrado del material objetable antes de que se publique.
2. Mecanismo para reportar contenido, con respuesta puntual.
3. Posibilidad de **bloquear** a usuarios abusivos.
4. Datos de contacto del desarrollador, visibles.

Y actuar en **24 horas**: retirar el contenido y expulsar a quien lo subió. Los
términos tienen que decir explícitamente que no hay tolerancia con el contenido
objetable ni con los usuarios abusivos, y el usuario debe aceptarlos antes de
poder publicar.

**Estado hoy:** existe la tabla `reports` y nada más. No hay interfaz de reporte,
ni bloqueo, ni cola de moderación. Es trabajo de producto, no un trámite de
última hora, y conviene hacerlo antes de tener contenido real que moderar.

## Guideline 3.1.1 — compras integradas

Los cursos son contenido digital que se desbloquea dentro de la app, así que
**obligan a usar IAP**. No se puede cobrar con Stripe ni enlazar fuera para
comprar. El posicionamiento pagado del §3 es igual de digital, así que también.

Vender en web esquiva esta comisión entera; el matiz de qué se puede enlazar
desde dentro de la app está en [web.md](web.md).

Comisión: **30 %**, o **15 %** con el App Store Small Business Program, para el
que se cualifica por debajo de 1 M$ al año. Hay que solicitarlo, no es
automático.

Lo que eso significa en el modelo del §3: de un curso de **19 $** llegan unos
**16,15 $** con el 15 %, y de ahí todavía sale la parte del creador. El rango de
precios que hoy impone `courses.price_within_mvp_range` (3–99 $) tendrá que
casar con los tramos de precio de Apple.

Los pagos **a** los creadores van por fuera de la app —Stripe Connect u
similar—, y es ahí donde el KYC del §4 deja de ser opcional.

## Otros requisitos que se olvidan

- **Guideline 5.1.1(v): borrado de cuenta desde dentro de la app.** Obligatorio
  desde que existe registro. No vale un correo a soporte.
- **App Privacy** en App Store Connect, más el manifiesto
  `PrivacyInfo.xcprivacy`. Si algún día hay seguimiento publicitario, además el
  permiso de ATT.
- **Clasificación por edad**: contenido de usuarios sin filtrar tira a 17+.
- **Sign in with Apple**: obligatorio **solo** si se ofrece login social de
  terceros. Hoy solo hay correo con código, así que no aplica — y es una razón
  más para no añadir Google o Facebook a la ligera.

## Orden de trabajo

1. **Backend y publicación.** Subida de vídeo, crear curiosidad, perfil.
2. **Moderación completa.** Reportar, bloquear, cola de revisión, borrado de
   cuenta. Sin esto no se pasa la revisión.
3. **Pagos.** RevenueCat sobre IAP para comprar; Stripe Connect por fuera para
   pagar a creadores.
4. **TestFlight** con gente de verdad.
5. **Envío a revisión.**
6. **Android.** Google Play pide su propio formulario de Data Safety, política de
   contenido generado por usuarios y un nivel de API objetivo que sube cada año.

## Lo que decidirá si esto escala

- **El vídeo es el coste dominante.** Hoy se sirve desde Supabase Storage, que
  es almacenamiento de objetos: no transcodifica ni sirve HLS, así que cada
  reproducción descarga el MP4 entero. Es una deuda asumida a conciencia, y para
  que el feed sea usable hay que acotar por producto — vídeos cortos, una sola
  resolución, ficheros pequeños. La salida está preparada:
  `media_assets.provider` y `playback_id` existen, y `resolveMediaUrl` en
  `src/data/rowToCuriosity.ts` es el único punto que cambia al migrar a
  Cloudflare Stream.
- **El ranking del feed no existe.** `feed_items` ordena por fecha. El siguiente
  paso es una fórmula en SQL (recencia × interés × categoría), y sacarlo a un
  servicio aparte solo cuando duela.
- **Los contadores por trigger** aguantan miles de filas, no millones. A escala,
  la contención de bloqueos sobre `curiosity_stats` obliga a contadores por lotes.
- **RLS está bien planteado** y es lo que evita reescribir la seguridad entera
  más adelante. El paywall vive en una sola policy, la de `select` sobre
  `media_assets`, y está bajo test.

## Construir para las tiendas

`eas.json` define tres perfiles:

- `development` — build de desarrollo con dev client, para el simulador.
- `preview` — build interna instalable, para enseñarla sin pasar por TestFlight.
- `production` — la que se sube a la tienda.

Compilar en la nube con EAS evita depender de esta máquina, que ha necesitado un
Ruby compilado a mano para que CocoaPods funcione. Ver `docs/native-setup.md`.
