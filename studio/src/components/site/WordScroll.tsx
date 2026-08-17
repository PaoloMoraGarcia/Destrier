'use client';

import { useEffect, useRef, type ReactNode } from 'react';

import { FlechaGuia } from './FlechaGuia';
import { repartir, subscribe, useReducedMotion } from './motion';

/**
 * Una escena que para la página y revela su frase con la rueda.
 *
 * **Va atada al scroll, no disparada por él.** Si paras a media frase, se queda a
 * medias; si subes, se deshace. Esa es la diferencia con una animación que se
 * lanza al entrar en pantalla y termina sola, y la razón de que el registro de
 * `motion.tsx` interpole en vez de poner una clase.
 *
 * ## Las tres fases, y por qué existen
 *
 * La primera versión clavaba con `position: sticky` a secas y se sentía como un
 * salto: la página se paraba en seco y, al terminar la frase, tiraba para abajo
 * de golpe.
 *
 * **Esa discontinuidad no se puede quitar.** El contenedor va a la velocidad del
 * scroll y al pegarse pasa a cero de un fotograma al siguiente; no es una
 * animación, es el scroll, y no hay curva que lo suavice. Lo que sí se puede es
 * **hacer continuo el contenido aunque el contenedor no lo sea**:
 *
 *  1. **Aproximación.** El texto no espera a que la página se pare. Entra desde
 *     abajo mientras la pista todavía sube y frena —curva de salida— hasta
 *     quedarse quieto justo cuando la página se para. El ojo lee una
 *     deceleración, no un frenazo. Antes, el escenario cruzaba una pantalla
 *     entera vacío y el texto aparecía de golpe ya clavado.
 *  2. **Lectura.** La revelación.
 *  3. **Salida.** El texto empieza a subir **a la misma velocidad a la que va a
 *     ir la página**, así que se marcha como se marcha cualquier texto al
 *     scrollear. Al soltar no hay salto porque en ese fotograma las dos
 *     velocidades ya coinciden: no se suaviza el despegue, se llega a él ya en
 *     marcha.
 *
 *     Hubo una versión que en vez de esto desvanecía el texto. Escondía el salto
 *     igual de bien y se veía mal: un texto que se disuelve solo, quieto, no se
 *     parece a nada que haga una página. Este se va, que es distinto.
 *
 * El fondo va en el contenedor de fuera, así que durante la entrada y la salida
 * el color no se mueve. Solo viaja el texto.
 *
 * **Las fronteras se calculan, no se escriben.** El progreso en el que la pista
 * se clava sale de su alto y de la carrerilla; puesto a ojo, la revelación
 * empieza antes o después de que la página se pare y el salto vuelve. Es la
 * tercera vez en este proyecto que un número a ojo desalinea una escena.
 *
 * ## Tres maneras de revelar, y tienen que verse distintas
 *
 * La página usa esto tres veces seguidas. Si se revelaran igual, la segunda y la
 * tercera se leerían como repeticiones de la primera:
 *
 *  - **`brillo`** — la frase está escrita entera, muy apagada, y coge luz de
 *    izquierda a derecha. Un barrido sobre algo que ya está: se intuye lo que
 *    viene.
 *  - **`cortina`** — cada palabra se descubre de abajo arriba con un borde
 *    limpio. No se desvanece: se destapa.
 *  - **`llegada`** — no hay nada, y cada palabra entra desde abajo y aterriza.
 *    La frase se construye.
 *
 * La cortina va con `clip-path` y no con un `overflow: hidden` por palabra, que
 * era lo evidente. Recortar por palabra **se come las astas y los rabos** —ya
 * pasó en el hueco del titular—, y la solución de rellenar el recorte obliga a
 * agrandar la caja, que a su vez pisa la línea de encima. Con `clip-path` el
 * corte se puede pedir **más grande que la letra** (`-0.12em` por los tres
 * lados), así que en reposo no hay recorte que valga y la caja no cambia.
 */

/*
 * El ritmo vertical.
 *
 * **El problema nunca fue la cantidad, fue que todo medía lo mismo.** Medido:
 * rótulo→frase 24 px, frase→párrafo 74, párrafo→aparatos 73, aparatos→numerados
 * 74. Con un solo valor para todo nada se agrupa, y la sección entera se lee como
 * un bloque pegado por muy grande que sea el valor. Subirlo de 9 a 14 svh no se
 * notó, y con razón.
 *
 * Lo que se ve es **el salto**: dentro de un grupo se está cerca, entre grupos
 * lejos, y la diferencia tiene que ser de más del doble.
 *
 * Y va en píxeles, no en `svh`: `svh` encoge justo donde más falta hace. En una
 * ventana de navegador con su barra, el 14 % de la altura es menos aire que a
 * pantalla completa, y es ahí donde se ve pegado al marco.
 */
const AIRE = {
  /** Entre partes de una misma idea — el rótulo y su frase. */
  cerca: 'mt-10',
  /** Entre una frase y el párrafo que la desarrolla. */
  medio: 'mt-14',
  /**
   * **Entre bloques distintos.** Este es el que hace el trabajo.
   *
   * Ha pasado por 74 —todo igual, se leía pegado—, por 140 —el párrafo flotaba
   * solo— y por 96, que seguía apretando el botón contra un titular de 74 px. Se
   * queda en 128: más del triple que el aire de dentro de un grupo, que es lo que
   * hace que las cosas se agrupen, y suficiente para que una acción no parezca
   * pegada a la frase que la justifica.
   */
  lejos: 'mt-[128px]',
  /**
   * Lo que va **con** la frase pero no pegado a ella: el botón de la acción y lo
   * que venga detrás. Menos que `lejos` porque no es otro bloque, es la misma
   * idea continuando — a 128 el botón se leía como una sección aparte.
   */
  accion: 'mt-[88px]',
  /** Arriba y abajo de la sección. */
  seccion: 'py-[180px]',
};

/**
 * **El cuerpo de los textos de apoyo, y va en `style`.**
 *
 * El párrafo blanco que va debajo del titular y los títulos de los bloques de
 * abajo miden **lo mismo**, y lo miden porque salen de aquí. Antes cada uno
 * llevaba su propio `clamp` en una clase, parecidos pero distintos, y el párrafo
 * se leía más pequeño sin que hubiera ninguna razón para ello.
 *
 * En `style` y no en clases por lo de siempre en esta página: una clase entre
 * corchetes puede no llegar a la hoja de estilos y entonces el navegador pinta
 * **el tamaño por defecto** sin que nada falle. Ya pasó con el fondo del botón y
 * con las columnas de los servicios. Y es además lo que hace que Safari y Chrome
 * enseñen lo mismo: un valor en el marcado no depende de que se haya compilado
 * una clase nueva ni de qué hoja tenga cacheada cada navegador.
 */
const CUERPO = {
  /** Los dos servicios de `#path`: es lo que se vende, y va grande. */
  destacado: 'clamp(1.9rem, 3.6vw, 3rem)',
  /** El resto — y el párrafo de apoyo, que comparte medida con ellos. */
  normal: 'clamp(1.45rem, 2.3vw, 1.95rem)',
};

/** La medida del párrafo de apoyo. En caracteres, que es como se mide un renglón. */
const MEDIDA_PARRAFO = '46ch';

/**
 * Lo apagada que está una palabra antes de su turno, en `brillo`.
 *
 * Subió de 0,2 a 0,3 por la revisión de contraste: a 0,2 el texto en reposo daba
 * **1,71:1** sobre el negro, muy por debajo del 3:1 que la pauta pide para texto
 * grande. A 0,3 son 2,4:1 — mejor, y **sigue sin llegar al mínimo**.
 *
 * Es una tensión real y se deja anotada en vez de fingir que no existe: el mínimo
 * de contraste está pensado para texto que hay que leer, y esto es el fotograma
 * cero de una revelación atada al scroll que termina en 1. Nadie lee la frase
 * apagada; la lee mientras se enciende. Subirla más mataría el barrido, que es lo
 * único que hace la sección.
 */
const APAGADA = 0.3;

/** Cuánto sube una palabra al llegar, en proporción a su cuerpo. */
const VIAJE = 0.55;

/** Cuánto se sale el corte de la letra, para no comerse astas ni rabos. */
const HOLGURA = '-0.12em';

/**
 * El alto de la pista, en `svh`. Una pantalla es el escenario y el resto es
 * recorrido con la escena quieta.
 *
 * **Es el mando de la duración**, y bajó de 240 a 180: con 240 cada escena se
 * llevaba 1,4 pantallas clavada y entre las tres dejaban un desierto de negro y
 * blanco vacíos. A 180 son 0,8, que sigue dando recorrido para leer la frase sin
 * que la página se convierta en un pasillo.
 */
const PISTA = 180;

/** Pantallas de carrerilla antes de clavarse, durante las que el texto entra. */
const APROXIMACION = 0.35;

/** Qué fracción del recorrido dura la marcha. */
const SALIDA = 0.22;

/** Y cuánto se queda la frase entera y quieta antes de empezar a irse. */
const RESPIRO = 0.06;

/** Cuánto viaja el bloque entero al entrar y al salir, en píxeles. */
const DESLIZ = 160;

/** Pantallas de scroll con la escena ya clavada. */
const CLAVADO = PISTA / 100 - 1;

/** El recorrido completo que mide el registro: carrerilla más clavado. */
const RECORRIDO = APROXIMACION + CLAVADO;

/** El progreso exacto en el que la pista se pega arriba. Calculado, no elegido. */
const PEGA = APROXIMACION / RECORRIDO;

/** Y en el que el texto empieza a marcharse. */
const MARCHA = 1 - SALIDA;

const acotar = (n: number) => Math.min(1, Math.max(0, n));

export function WordScroll({
  eyebrow,
  text,
  lead,
  visual,
  principios,
  tone = 'ink',
  destacado = false,
  clavado = false,
  revelado = 'brillo',
  children,
}: {
  /** La etiqueta pequeña de arriba, con su punto. */
  eyebrow: string;
  /** La frase. Se parte por espacios y cada palabra va en su propio `<span>`. */
  text: string;
  /** El párrafo pequeño, que va después de la pista y no dentro del escenario. */
  lead?: string;
  /**
   * Una pieza gráfica entre el párrafo y los bloques numerados.
   *
   * Va aquí y no por `children` porque `children` cae al final de todo, después
   * de los numerados, y lo que entra por aquí —los aparatos— tiene que verse
   * antes: es lo que ilustra la frase, no lo que la cierra.
   */
  visual?: ReactNode;
  /** Los bloques numerados, si la sección los lleva. También van después. */
  principios?: { numero: string; titulo: string; cuerpo: string }[];
  tone?: 'ink' | 'bone';
  /**
   * Los bloques numerados a tamaño de servicio: dos columnas anchas y el título
   * al cuerpo de un titular pequeño. Es la diferencia entre enumerar un método y
   * **enseñar lo que se vende**.
   */
  destacado?: boolean;
  /** Si la escena para la página mientras se revela. */
  clavado?: boolean;
  /** Cómo se revela. Las tres escenas de la página usan una cada una. */
  revelado?: 'brillo' | 'cortina' | 'llegada';
  /** Lo que va debajo de todo — en esta página, el botón. */
  children?: ReactNode;
}) {
  const frase = useRef<HTMLParagraphElement>(null);
  const pista = useRef<HTMLDivElement>(null);
  const escena = useRef<HTMLDivElement>(null);
  const cola = useRef<HTMLDivElement>(null);
  const bloques = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const palabras = text.split(' ');

  // Con movimiento reducido no se clava: una escena clavada sin animación es una
  // página que se queda quieta mientras giras la rueda y no pasa nada.
  const clava = clavado && !reduced;

  useEffect(() => {
    const nodo = frase.current;
    if (!nodo) return;

    const partes = Array.from(nodo.querySelectorAll<HTMLElement>('[data-palabra]'));

    if (reduced) {
      partes.forEach((parte) => {
        parte.style.opacity = '1';
        parte.style.transform = 'none';
        parte.style.clipPath = 'none';
      });
      return;
    }

    const revelar = (progreso: number) =>
      partes.forEach((parte, index) => {
        const t = repartir(partes.length, index, progreso);

        if (revelado === 'llegada') {
          parte.style.opacity = String(t);
          parte.style.transform = `translate3d(0, ${(1 - t) * VIAJE}em, 0)`;
          return;
        }

        if (revelado === 'cortina') {
          // El corte se sale de la letra por los tres lados que no cortan, así
          // que en reposo no recorta nada y la caja no cambia de tamaño.
          parte.style.clipPath = `inset(${(1 - t) * 100}% ${HOLGURA} ${HOLGURA} ${HOLGURA})`;
          parte.style.transform = `translate3d(0, ${(1 - t) * 0.18}em, 0)`;
          return;
        }

        parte.style.opacity = String(APAGADA + (1 - APAGADA) * t);
      });

    if (!clavado) {
      return subscribe({
        node: nodo,
        startAt: 0.72,
        span: 0.5,
        rise: 0,
        offset: 0,
        paint: revelar,
      });
    }

    const carril = pista.current;
    const bloque = escena.current;
    if (!carril || !bloque) return;

    return subscribe({
      // Se mide **la pista**, no el escenario: el escenario está pegado arriba y
      // su `top` vale cero todo el rato, así que no diría nada. La pista sí se
      // mueve, y su borde superior es cuánto llevas dentro.
      node: carril,
      // La carrerilla: el progreso empieza a contar antes de clavarse, que es lo
      // que da la entrada. No es el valor por defecto, que arranca cuando el
      // bloque asoma por abajo — con eso, media frase se revelaba fuera de
      // pantalla.
      startAt: APROXIMACION,
      span: RECORRIDO,
      rise: 0,
      offset: 0,
      paint: (p) => {
        if (p < PEGA) {
          // Entrando. Curva de salida: rápido al principio y frenando, para
          // llegar con velocidad cero justo cuando la página se para.
          const e = acotar(p / PEGA);
          const suave = 1 - Math.pow(1 - e, 3);

          bloque.style.opacity = String(suave);
          bloque.style.transform = `translate3d(0, ${(1 - suave) * DESLIZ}px, 0)`;
        } else if (p > MARCHA) {
          /*
           * Marchándose, **a la velocidad exacta de la página**.
           *
           * `p` es fracción de un recorrido que mide `RECORRIDO` pantallas, así
           * que los píxeles de scroll transcurridos desde que empezó la marcha
           * son eso mismo por el alto de la ventana. Desplazando el bloque justo
           * esos píxeles hacia arriba, se mueve como se movería si la pista ya
           * lo hubiera soltado — y cuando lo suelta de verdad, las velocidades
           * coinciden y no hay tirón que ver.
           *
           * No hace falta que llegue a salirse por arriba. Lo que quita el salto
           * es que las velocidades cuadren en ese fotograma, no dónde esté.
           */
          const recorrido = (p - MARCHA) * RECORRIDO * window.innerHeight;

          bloque.style.opacity = '1';
          bloque.style.transform = `translate3d(0, ${-recorrido}px, 0)`;
        } else {
          bloque.style.opacity = '1';
          bloque.style.transform = 'translate3d(0, 0, 0)';
        }

        // La revelación ocupa solo el tramo de lectura, y termina un respiro
        // antes de la marcha: acabar la última palabra en el mismo fotograma en
        // que el texto empieza a irse no da tiempo a leerla.
        revelar(acotar((p - PEGA) / (MARCHA - RESPIRO - PEGA)));
      },
    });
  }, [reduced, clavado, revelado]);

  /*
   * Los bloques numerados se encienden uno detrás de otro.
   *
   * Estaba en `About.tsx`, que era otra implementación del mismo efecto sobre
   * los mismos datos. Al clavarse las tres secciones, About pasó a ser esta
   * pieza con otro color, así que el escalonado se mudó aquí y aquel archivo
   * desapareció.
   */
  useEffect(() => {
    const nodo = cola.current;
    if (!nodo) return;

    const bloques = Array.from(nodo.querySelectorAll<HTMLElement>('[data-bloque]'));
    if (bloques.length === 0) return;

    if (reduced) {
      bloques.forEach((b) => {
        b.style.opacity = '1';
        b.style.transform = 'none';
      });
      return;
    }

    return subscribe({
      node: nodo,
      startAt: 0.8,
      span: 0.7,
      rise: 0,
      offset: 0,
      paint: (progreso) => {
        bloques.forEach((b, i) => {
          const t = repartir(bloques.length, i, progreso);
          b.style.opacity = String(0.15 + 0.85 * t);
          b.style.transform = `translate3d(0, ${(1 - t) * 18}px, 0)`;
        });
      },
    });
  }, [reduced, principios]);

  const oscuro = tone === 'ink';

  const rotulo = (
    <p className="text-center font-mono text-[13px] uppercase tracking-[0.22em] opacity-65">
      <span aria-hidden className="mr-3">
        &bull;
      </span>
      {eyebrow}
    </p>
  );

  const estilo = (() => {
    if (revelado === 'llegada') return { opacity: 0, transform: `translate3d(0, ${VIAJE}em, 0)` };
    if (revelado === 'cortina')
      return { clipPath: `inset(100% ${HOLGURA} ${HOLGURA} ${HOLGURA})` };
    return { opacity: APAGADA };
  })();

  const parrafo = (
    <p
      ref={frase}
      // `flex-wrap` y no un texto corrido: cada palabra necesita su propia caja
      // para poder revelarse por su cuenta. El `gap-x` en `em` mantiene el
      // espacio entre palabras proporcional al cuerpo.
      className={`mx-auto ${AIRE.cerca} flex flex-wrap justify-center gap-x-[0.26em] text-center text-[clamp(2.1rem,5.2vw,4.6rem)] leading-[1.12] tracking-[-0.025em] ${
        revelado === 'brillo'
          ? 'max-w-[22ch] font-medium sm:max-w-[26ch]'
          : 'max-w-[19ch] font-semibold sm:max-w-[22ch]'
      }`}>
      {palabras.map((palabra, index) => (
        <span key={`${palabra}-${index}`} data-palabra className="inline-block" style={estilo}>
          {palabra}
        </span>
      ))}
    </p>
  );

  const resto = (
    <div ref={cola}>
      {lead && (
        /*
         * El tamaño y la medida van aquí y no en clases: es el mismo `CUERPO.normal`
         * que usan los títulos de los bloques de abajo, y así se lee igual de grande
         * que ellos en cualquier navegador. Con la medida en una clase entre
         * corchetes, un navegador que no tuviera esa clase compilada pintaba el
         * párrafo de borde a borde — que es exactamente lo que se veía en Safari.
         */
        <p
          className={`mx-auto ${AIRE.lejos} text-center`}
          style={{
            maxWidth: MEDIDA_PARRAFO,
            fontSize: CUERPO.normal,
            lineHeight: 1.45,
            opacity: 0.92,
          }}>
          {lead}
        </p>
      )}

      {visual && <div className={lead ? AIRE.lejos : ''}>{visual}</div>}

      {principios && (
        <div
          ref={bloques}
          /*
           * **Las columnas van en `style`, no en clases con punto de ruptura.**
           *
           * Con `sm:grid-cols-2` los dos servicios salían apilados en pantallas
           * donde tenían sitio de sobra: basta con que la ventana esté estrecha o
           * con zoom para caer por debajo del punto de ruptura, y encima si esa
           * clase no llega a la hoja de estilos pasa lo mismo sin avisar. Dos
           * formas distintas de romperse, las dos vistas ya en esta página.
           *
           * `auto-fit` con un mínimo no depende ni del punto de ruptura ni del
           * compilador: hay dos columnas siempre que quepan dos, y una cuando de
           * verdad no cabe otra. Se adapta al ancho real, que es lo que se quería.
           */
          className={`relative mx-auto grid ${destacado ? 'max-w-6xl' : 'max-w-5xl'} ${AIRE.lejos}`}
          style={{
            // 260 y no 300: con 300 los dos servicios se apilaban ya por debajo de
            // 740 px de ventana, y ahí caben perfectamente. Así aguantan hasta los
            // ~620, que es donde de verdad dejan de caber.
            gridTemplateColumns: `repeat(auto-fit, minmax(${destacado ? 260 : 210}px, 1fr))`,
            columnGap: destacado ? 64 : 48,
            rowGap: destacado ? 72 : 56,
          }}>
          {/* La línea que va del primer número al último. Mide el DOM, así que
              se orienta sola según los bloques estén en fila o apilados. */}
          <FlechaGuia contenedor={bloques} />

          {principios.map((principio) => (
            <div key={principio.titulo} data-bloque style={{ opacity: 0.15 }}>
              <p
                data-numero
                className="font-mono text-[13px] uppercase tracking-[0.28em] opacity-60">
                {principio.numero}
              </p>
              {/* Mismo `CUERPO` que el párrafo de arriba, y por el mismo motivo:
                  los dos tienen que medir lo mismo y no pueden depender de que una
                  clase entre corchetes haya llegado a la hoja de estilos. */}
              <p
                className="mt-3 font-medium leading-[1.12] tracking-[-0.025em]"
                style={{ fontSize: destacado ? CUERPO.destacado : CUERPO.normal }}>
                {principio.titulo}
              </p>
              <p
                className={`mt-5 leading-relaxed opacity-70 ${
                  destacado
                    ? 'max-w-[40ch] text-[clamp(1.05rem,1.4vw,1.25rem)]'
                    : 'max-w-[34ch] text-[clamp(0.95rem,1.2vw,1.05rem)]'
                }`}>
                {principio.cuerpo}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* La ranura va centrada: lo que entra por aquí es el botón de la página,
          y un `max-w` sin alineación lo dejaba pegado a la izquierda. */}
      {children && (
        // Con margen propio: la cola iba pegada a la frase y el botón acababa
        // tocando la última línea del texto de encima.
        <div className={`mx-auto flex max-w-4xl justify-center ${AIRE.accion}`}>{children}</div>
      )}
    </div>
  );

  const fondo = oscuro ? 'bg-[#0a0a0a] text-[#f4f4ef]' : 'bg-[#ffffff] text-[#0a0a0a]';
  const hayCola = Boolean(lead || visual || principios || children);

  if (!clava) {
    return (
      /*
       * El ritmo vertical, después de pasarse por los dos lados.
       *
       * Llegó a `py-[18svh]` con una pista clavada de 2,4 pantallas por sección —un
       * pasillo— y de ahí se recortó a `py-[9svh]`, que era lo contrario: todo
       * apelotonado. Esto es el punto medio, y no es un número inventado: la pauta
       * de disposición dice **agrupar lo relacionado y separar lo que no**, así que
       * el aire grande va entre bloques distintos (`14svh` entre secciones, `9svh`
       * entre el párrafo, los aparatos y los numerados) y el pequeño dentro de un
       * mismo bloque (`mt-6`, `mt-10`).
       */
      <div className={`w-full px-5 ${AIRE.seccion} sm:px-8 ${fondo}`}>
        <div>
          {rotulo}
          {parrafo}
        </div>
        {hayCola && resto}
      </div>
    );
  }

  return (
    <div className={`w-full ${fondo}`}>
      <div ref={pista} className="relative" style={{ height: `${PISTA}svh` }}>
        {/* Una ventana exacta y centrada: la frase se queda quieta en medio
            mientras la pista corre por debajo. */}
        <div className="sticky top-0 flex h-svh w-full flex-col justify-center px-5 sm:px-8">
          {/* El bloque que entra y se va. Va por dentro del pegajoso: transformar
              el propio elemento `sticky` funciona, pero deja de ser evidente
              quién manda sobre su posición. */}
          <div ref={escena} style={{ opacity: 0 }}>
            {rotulo}
            {parrafo}
          </div>
        </div>
      </div>

      {/* La cola arranca justo donde la pista suelta, sin un respiro de más: el
          texto ya se ha ido desvaneciendo, así que lo de abajo entra en una
          pantalla vacía. */}
      {/* Poco aire por arriba y por abajo: la pista ya deja una pantalla entera
          de nada antes de esto, y sumarle 18svh convertía cada corte en un
          desierto. */}
      {hayCola && <div className="px-5 pb-[180px] pt-[40px] sm:px-8">{resto}</div>}
    </div>
  );
}
