'use client';

import { useEffect, useRef, useState } from 'react';

import { useReducedMotion } from './motion';

/**
 * El portátil de la portada, **con su transparencia de verdad**.
 *
 * No va atado al scroll: hubo una versión que avanzaba sus fotogramas con la
 * rueda y era un invento mío, no lo que se había pedido. Se reproduce y ya.
 *
 * ## Por qué esto no es un `<video>` a secas
 *
 * El original es ProRes 4444 con alfa. En web no hay ningún formato de vídeo con
 * transparencia que reproduzcan todos los navegadores —Safari hace HEVC con alfa,
 * Chrome y Firefox hacen VP9 con alfa, y no se solapan—, así que durante muchas
 * pasadas el portátil fue un vídeo **compuesto sobre negro**: un rectángulo
 * opaco. Mientras detrás hubo un fondo liso, nadie lo notó. En cuanto detrás
 * aparecieron los arcos, ese rectángulo se puso a taparlos y dibujó su caja —
 * ochenta y siete niveles de salto en línea recta, medidos, y en todos los
 * navegadores igual.
 *
 * Se intentó esquivarlo apagando los arcos antes de llegar al aparato. No vale:
 * **dónde cae el borde del portátil depende de la forma de la ventana** —el 40 %
 * de la altura de la portada a 1990x1000 y el 77 % a 375x812—, así que cualquier
 * umbral que funcione en una pantalla falla en otra.
 *
 * ## La alfa viaja dentro de la imagen
 *
 * `mac-empaquetado.mp4` es un MP4 corriente, sin canal alfa, que mide **el doble
 * de alto**: arriba el color y abajo el recorte en gris. Aquí se vuelven a juntar
 * — dos lecturas de la misma textura y `vec4(color, alfa)`. Un archivo, un
 * resultado, todos los navegadores.
 *
 * **WebGL y no un canvas 2D**: recomponer a mano son 3,6 millones de píxeles por
 * fotograma entre `getImageData` y `putImageData`, y eso no va a 60 Hz en ningún
 * sitio. Así es una subida de textura y dos muestreos, trabajo de GPU.
 *
 * El color viene **premultiplicado** desde el codificador —es lo que deja
 * componerlo sobre negro—, así que el lienzo se pide premultiplicado y no hay que
 * deshacer nada. Desmultiplicar para volver a multiplicar es de donde salen los
 * halos oscuros en el borde del recorte.
 *
 * ## Y si nada de esto llega a correr
 *
 * Hay póster. Sin JavaScript lo sirve un `<noscript>`, y si WebGL no arranca se
 * pide desde aquí. **No se descarga en el camino bueno**, que es lo que hace que
 * un recambio de 376 KB no le cueste nada a quien no lo necesita.
 * La regla de la casa es que la portada no puede depender de JavaScript para
 * verse; aquí eso significa que sin él no habrá movimiento, pero habrá portátil.
 */

/**
 * Dos tamaños del **mismo** archivo, y esto no es volver a lo de antes.
 *
 * Lo que no puede haber es un **formato** por navegador: eso daba dos resultados
 * distintos y es lo que se acaba de enterrar. Dos tamaños del mismo MP4 es otra
 * cosa — todos los navegadores reproducen los dos, y lo único que cambia es
 * cuántos píxeles hay que mover.
 *
 * Y hacen falta. Perfilando con la CPU de un móvil frenada cuatro veces, el
 * **77 % del tiempo** se iba en `texImage2D`; los arcos, que era el sospechoso
 * obvio, se llevaban el 1 %. En un teléfono el portátil se dibuja en 671x371
 * píxeles y se estaban subiendo 2560x2832 a la GPU en cada fotograma: **veintinueve
 * veces más píxeles de los que se ven**. La variante pequeña mueve la cuarta parte
 * y pesa 12 MB en vez de 32.
 *
 * Cuál se coge se decide al montar, no con `<source media>`: ese atributo no lo
 * respetan todos los navegadores en vídeo y aquí eso sería descargarse los dos.
 */
const PACK = {
  ancho: '/video/mac-empaquetado.mp4',
  estrecho: '/video/mac-empaquetado-movil.mp4',
};
const POSTER = '/video/mac-poster.jpg';

/**
 * Cuántas veces por segundo se sube el fotograma a la GPU.
 *
 * **Es el número que decide si esto va o no va en un móvil.** Perfilando la
 * página con la CPU frenada cuatro veces salió que el **77 % del tiempo** se iba
 * en `texImage2D` — y solo el 1 % en los arcos, que eran el sospechoso obvio.
 * No es de extrañar: con la alfa empaquetada el fotograma mide 2560x2832, son
 * 7,25 millones de píxeles, y el original viene a 60 por segundo.
 *
 * A 30 se sube la mitad y **no se nota**: es un portátil quieto enseñando un
 * vídeo, no una panorámica. El vídeo sigue decodificando a su ritmo —de eso se
 * encarga el hardware—; lo que se recorta es el trabajo que hace la página.
 *
 * Lo suyo sería además sacar el archivo a 30 y que pesara la mitad. El
 * codificador ya sabe hacerlo (`codificar … empaquetada 30`), pero hace falta el
 * ProRes original, que ya no está en el disco.
 */
const SUBIDAS_POR_SEGUNDO = 30;

/**
 * La imagen ocupa la mitad de arriba del fotograma; el recorte, la de abajo.
 *
 * `pos` recorre el cuadrado unidad. En pantalla, `y = 1` es arriba; en la textura
 * la fila 0 es la de arriba, así que hay que darle la vuelta — y **solo la Y se
 * parte por la mitad**: la X recorre el fotograma entero.
 */
const VERTICE = `
attribute vec2 pos;
varying vec2 uv;
void main() {
  uv = vec2(pos.x, (1.0 - pos.y) * 0.5);
  gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
}`;

/**
 * `uv.y` recorre 0..0.5 y es la mitad de arriba: el color. La máscara está medio
 * fotograma más abajo, y de ella basta un canal — es gris.
 */
const FRAGMENTO = `
precision mediump float;
uniform sampler2D fuente;
varying vec2 uv;
void main() {
  vec3 color = texture2D(fuente, uv).rgb;
  float alfa = texture2D(fuente, uv + vec2(0.0, 0.5)).r;
  gl_FragColor = vec4(color, alfa);
}`;

function compilar(gl: WebGLRenderingContext, tipo: number, fuente: string) {
  const sh = gl.createShader(tipo);
  if (!sh) return null;
  gl.shaderSource(sh, fuente);
  gl.compileShader(sh);
  return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
}

export function Mac() {
  const video = useRef<HTMLVideoElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const [sinWebGL, setSinWebGL] = useState(false);

  useEffect(() => {
    const v = video.current;
    const canvas = lienzo.current;
    if (!v || !canvas) return;

    /*
     * El archivo se elige aquí y no en el marcado: el servidor no sabe con qué
     * pantalla se está mirando, y poner el ancho por defecto en el HTML haría que
     * un móvil se descargase los 32 MB antes de que a nadie le diera tiempo a
     * cambiarlo. El precio es que el vídeo no empieza a bajar hasta que hidrata,
     * y se paga con gusto: quien no tiene JavaScript ve el póster.
     */
    if (!v.src) {
      const estrecha = window.matchMedia('(max-width: 767px)').matches;
      v.src = estrecha ? PACK.estrecho : PACK.ancho;
    }

    /*
     * `premultipliedAlpha` porque el color ya viene multiplicado por su alfa, y
     * `alpha: true` porque de eso va todo esto: lo que quede fuera del portátil
     * tiene que dejar ver los arcos.
     */
    const gl = (canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
    }) ?? null) as WebGLRenderingContext | null;

    if (!gl) {
      setSinWebGL(true);
      return;
    }

    const programa = gl.createProgram();
    const vs = compilar(gl, gl.VERTEX_SHADER, VERTICE);
    const fs = compilar(gl, gl.FRAGMENT_SHADER, FRAGMENTO);
    if (!programa || !vs || !fs) {
      setSinWebGL(true);
      return;
    }

    gl.attachShader(programa, vs);
    gl.attachShader(programa, fs);
    gl.linkProgram(programa);
    if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) {
      setSinWebGL(true);
      return;
    }
    gl.useProgram(programa);

    // Dos triángulos que cubren el lienzo. No hay más geometría en toda la pieza.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
      gl.STATIC_DRAW
    );
    const attr = gl.getAttribLocation(programa, 'pos');
    gl.enableVertexAttribArray(attr);
    gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0);

    const textura = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textura);
    // Sin mipmaps y con `CLAMP_TO_EDGE`: el fotograma no es potencia de dos, y
    // repetir el borde traería la máscara al color por el canto.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    let bucle = 0;
    let vfc = 0;
    let enPantalla = true;
    let pestanaVisible = true;
    let pintado = false;

    const medir = () => {
      // El lienzo se pide a la resolución real de la pantalla, hasta 2x: es un
      // aparato con detalle fino y a 1x se le ven los dientes al canto.
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const caja = canvas.getBoundingClientRect();
      const w = Math.round(caja.width * dpr);
      const h = Math.round(caja.height * dpr);
      if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    let ultimaSubida = 0;

    const pintar = (limitado = false) => {
      if (v.readyState < 2) return;
      // La subida es lo caro; el resto del fotograma no cuesta nada. Se salta
      // entera cuando aún no toca, en vez de dibujar de nuevo lo mismo.
      const ahora = performance.now();
      if (limitado && ahora - ultimaSubida < 1000 / SUBIDAS_POR_SEGUNDO - 1) return;
      ultimaSubida = ahora;

      medir();
      gl.bindTexture(gl.TEXTURE_2D, textura);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, v);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (!pintado) {
        pintado = true;
        canvas.style.opacity = '1';
      }
    };

    /*
     * `requestVideoFrameCallback` donde exista: sube la textura **cuando hay
     * fotograma nuevo**, no sesenta veces por segundo. El vídeo va a 60 y la
     * diferencia no es de fotogramas, es de subidas de textura que no hacían
     * falta. Donde no exista, `requestAnimationFrame`.
     */
    type ConVFC = HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: () => void) => number;
      cancelVideoFrameCallback?: (id: number) => void;
    };
    const vv = v as ConVFC;
    const hayVFC = typeof vv.requestVideoFrameCallback === 'function';

    const paso = () => {
      pintar(true);
      if (hayVFC) vfc = vv.requestVideoFrameCallback!(paso);
      else bucle = requestAnimationFrame(paso);
    };

    const arrancar = () => {
      if (bucle || vfc || !enPantalla || !pestanaVisible) return;
      void v.play().catch(() => {});
      paso();
    };

    const parar = () => {
      if (bucle) cancelAnimationFrame(bucle);
      if (vfc && vv.cancelVideoFrameCallback) vv.cancelVideoFrameCallback(vfc);
      bucle = 0;
      vfc = 0;
      v.pause();
    };

    // Con movimiento reducido: un fotograma y se acabó. Se ve el portátil, no el
    // movimiento, y no queda ningún bucle corriendo.
    if (reduced) {
      const unaVez = () => pintar();
      if (v.readyState >= 2) unaVez();
      else v.addEventListener('loadeddata', unaVez, { once: true });
      window.addEventListener('resize', unaVez, { passive: true });
      return () => window.removeEventListener('resize', unaVez);
    }

    const alRedimensionar = () => pintar();

    const alCambiarPestana = () => {
      pestanaVisible = document.visibilityState === 'visible';
      pestanaVisible && enPantalla ? arrancar() : parar();
    };

    const vigia = new IntersectionObserver(
      (entradas) => {
        enPantalla = entradas[0]?.isIntersecting ?? true;
        enPantalla && pestanaVisible ? arrancar() : parar();
      },
      { threshold: 0 }
    );

    vigia.observe(canvas);
    window.addEventListener('resize', alRedimensionar, { passive: true });
    document.addEventListener('visibilitychange', alCambiarPestana);
    arrancar();

    return () => {
      parar();
      vigia.disconnect();
      window.removeEventListener('resize', alRedimensionar);
      document.removeEventListener('visibilitychange', alCambiarPestana);
    };
  }, [reduced]);

  return (
    // La proporción va en el contenedor y no en el lienzo: así el hueco del
    // portátil está reservado desde el primer pintado y nada salta cuando el
    // vídeo llega. Es la mitad de color del fotograma, 2560x1416.
    <div className="relative w-full" style={{ aspectRatio: '2560 / 1416' }}>
      <video
        ref={video}
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
        // Fuera de la vista, pero **no `display: none`**: un vídeo oculto así no
        // decodifica en algunos navegadores y la textura se queda en negro.
        className="pointer-events-none absolute h-px w-px opacity-0"
        tabIndex={-1}
      />

      <canvas
        ref={lienzo}
        aria-hidden
        // Aparece cuando ha pintado su primer fotograma. Sin esto se ve un
        // parpadeo del lienzo vacío antes de que el vídeo tenga datos.
        className="block h-full w-full transition-opacity duration-300"
        style={{ opacity: 0 }}
      />

      {/* Si WebGL no arranca. Se pide desde JavaScript, así que en el camino
          bueno este archivo no se descarga nunca. */}
      {sinWebGL && (
        // eslint-disable-next-line @next/next/no-img-element -- recambio estático, sin optimizar, pedido solo cuando falla WebGL.
        <img src={POSTER} alt="" aria-hidden className="absolute inset-0 h-full w-full" />
      )}

      {/* Y sin JavaScript. El navegador solo lo pide si el scripting está
          apagado, que es exactamente cuando hace falta. */}
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={POSTER} alt="" className="absolute inset-0 h-full w-full" />
      </noscript>
    </div>
  );
}
