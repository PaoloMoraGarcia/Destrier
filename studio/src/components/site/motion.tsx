'use client';

import Lenis from 'lenis';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

/**
 * El movimiento de la landing.
 *
 * Dos piezas, y la segunda es la que de verdad importa:
 *
 *  1. **Lenis** amortigua la rueda, para que el scroll no salte de golpe.
 *  2. **`useReveal` interpola desde la posición en pantalla**, no suelta una
 *     clase al entrar. Es la diferencia entre parecerse y ser igual: en una
 *     aparición por clase, si paras a media animación el texto termina de
 *     aparecer solo; aquí, si paras, se queda donde está. La página responde a
 *     la rueda de forma continua, y eso es la mitad de por qué se siente suave.
 *
 * Lo comprobé en la referencia parando el scroll a mitad: la palabra se quedó
 * quieta a media opacidad. Ese es el detalle que se está copiando.
 *
 * **Todo se apaga con `prefers-reduced-motion`.** Con esta cantidad de
 * movimiento no es cortesía: es la diferencia entre una página y un mareo.
 */

/** La curva de la referencia. Es una curva, no una marca. */
export const EASE = 'cubic-bezier(0.65, 0.05, 0.36, 1)';

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);

    const listen = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener('change', listen);
    return () => query.removeEventListener('change', listen);
  }, []);

  return reduced;
}

/**
 * El contenedor que scrollea.
 *
 * La página no scrollea en el `body` sino aquí dentro, que es lo que hace la
 * referencia y lo que Lenis necesita para poder gobernar el desplazamiento.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const wrapper = ref.current;
    if (!wrapper || reduced) return;

    const lenis = new Lenis({
      wrapper,
      content: wrapper.firstElementChild as HTMLElement,
      // Cuanto más bajo, más peso tiene la inercia. 0.085 deja el frenado largo
      // sin que llegue a sentirse que la página va por detrás de la mano.
      lerp: 0.085,
    });

    let frame = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [reduced]);

  return (
    <div
      ref={ref}
      data-scroll-root
      className="h-svh overflow-y-auto overflow-x-hidden overscroll-none">
      <div>{children}</div>
    </div>
  );
}

/**
 * El registro de apariciones y **un único bucle** para todas.
 *
 * La primera versión abría un `requestAnimationFrame` por elemento. Con
 * veinticinco apariciones eso son veinticinco bucles compitiendo por cada
 * fotograma para hacer un trabajo que cabe en uno. Con un registro compartido,
 * el bucle además se apaga solo cuando no queda nada suscrito.
 */
interface Subject {
  node: HTMLElement;
  span: number;
  rise: number;
  offset: number;
  /** Si está, el elemento cruza en horizontal en vez de aparecer. */
  travel?: number;
}

const subjects = new Set<Subject>();
let loop = 0;

function paintAll() {
  const height = window.innerHeight;

  for (const { node, span, rise, offset, travel } of subjects) {
    const rect = node.getBoundingClientRect();

    // El desplazamiento horizontal se mide contra la travesía completa del
    // elemento por la pantalla —de entrar por abajo a salir por arriba— para
    // que el recorrido dure toda la sección y no un tramo corto.
    if (travel !== undefined) {
      // El recorrido se mide en cada fotograma, nunca a ojo: depende del ancho
      // de la ventana y del tamaño de la fuente, y un número fijo se queda mal
      // en cuanto cambia cualquiera de los dos.
      //
      // **El texto cabe entero y barre de un borde al otro.** Se probó antes al
      // revés —más ancho que la pantalla, desplazándose para enseñar los
      // extremos— y no funciona: a mitad de recorrido, que es donde la frase
      // está cómoda de leer, siempre falta una letra por cada lado. Si cabe, no
      // hay ningún momento en que se corte.
      // El ancho real del texto sale del `span` interior, no de `scrollWidth`:
      // cuando el contenido cabe, `scrollWidth` se satura al ancho de la caja y
      // el hueco sobrante siempre daría cero.
      const line = node.firstElementChild as HTMLElement | null;
      const slack = Math.max(0, node.clientWidth - (line?.offsetWidth ?? node.scrollWidth));

      // El barrido se reparte **solo mientras la frase se ve entera**: empieza
      // cuando su borde inferior llega al fondo de la pantalla y acaba cuando el
      // superior llega arriba. Fuera de ahí no hay nada que mirar.
      const span = Math.max(1, height - rect.height);
      const progress = Math.min(1, Math.max(0, (height - rect.height - rect.top) / span));

      node.style.transform = `translate3d(${progress * slack * travel}px, 0, 0)`;
      continue;
    }

    // Empieza cuando el borde superior entra por abajo y termina `span`
    // pantallas más arriba. `offset` retrasa a los hermanos para escalonar.
    const start = height * (1 - offset * 0.12);
    const progress = (start - rect.top) / (height * span);
    const clamped = Math.min(1, Math.max(0, progress));

    // Suavizado en la salida: el último tramo se estira, así que el texto se
    // asienta en vez de llegar de golpe a su sitio.
    const eased = 1 - Math.pow(1 - clamped, 3);

    node.style.opacity = String(eased);
    node.style.transform = `translate3d(0, ${(1 - eased) * rise}px, 0)`;
  }

  loop = subjects.size > 0 ? requestAnimationFrame(paintAll) : 0;
}

function subscribe(subject: Subject) {
  subjects.add(subject);
  if (!loop) loop = requestAnimationFrame(paintAll);

  return () => {
    subjects.delete(subject);
    if (subjects.size === 0 && loop) {
      cancelAnimationFrame(loop);
      loop = 0;
    }
  };
}

/**
 * Cuánto ha entrado un elemento en pantalla, de 0 a 1.
 *
 * El valor no se guarda en estado de React: se escribe directo en el nodo desde
 * el bucle, porque un `setState` por fotograma y por elemento revienta
 * cualquier página con veinte apariciones.
 */
export function useReveal<T extends HTMLElement>(options?: {
  /** Fracción de pantalla que recorre la aparición. Más alto, más lento. */
  span?: number;
  /** Cuánto sube, en píxeles. */
  rise?: number;
  /** Retraso relativo, para escalonar hermanos. En fracción de pantalla. */
  offset?: number;
}) {
  const ref = useRef<T>(null);
  const reduced = useReducedMotion();
  const { span = 0.32, rise = 40, offset = 0 } = options ?? {};

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (reduced) {
      node.style.opacity = '1';
      node.style.transform = 'none';
      return;
    }

    return subscribe({ node, span, rise, offset });
  }, [reduced, span, rise, offset]);

  return ref;
}

/** Un bloque que aparece al entrar. */
export function Reveal({
  children,
  className = '',
  span,
  rise,
  offset,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  span?: number;
  rise?: number;
  offset?: number;
  as?: 'div' | 'p' | 'span' | 'li' | 'h2' | 'h3';
}) {
  const ref = useReveal<HTMLDivElement>({ span, rise, offset });

  return (
    <Tag ref={ref as never} className={className} style={{ opacity: 0 }}>
      {children}
    </Tag>
  );
}

/**
 * Una línea que cruza la pantalla conforme bajas.
 *
 * Atada al scroll y no en bucle por temporizador: si paras, se para. Un bucle
 * automático al lado de unas apariciones que responden a la rueda se notaría
 * como dos páginas distintas pegadas.
 *
 * La línea cabe entera y barre de un borde al otro, así que **no se corta en
 * ningún momento del recorrido**. Va en la fuente de display y sin partir.
 */
export function Drift({
  children,
  className = '',
  travel = 1,
}: {
  children: ReactNode;
  className?: string;
  /**
   * Fracción del hueco sobrante que se recorre. Con 1 la frase empieza pegada a
   * la izquierda y acaba pegada a la derecha.
   */
  travel?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (reduced) {
      node.style.transform = 'none';
      return;
    }

    return subscribe({ node, span: 1, rise: 0, offset: 0, travel });
  }, [reduced, travel]);

  return (
    <div className="w-full overflow-hidden">
      <div ref={ref} className={`whitespace-nowrap will-change-transform ${className}`}>
        {/* El `span` existe para poder medir el ancho real del texto. */}
        <span className="inline-block">{children}</span>
      </div>
    </div>
  );
}

/**
 * La marquesina.
 *
 * Dos mitades idénticas, **cada una de al menos el ancho del contenedor**, y un
 * desplazamiento de justo el 50 %: al llegar al final, la segunda mitad está
 * exactamente donde empezó la primera y el bucle empalma sin costura.
 *
 * Que cada mitad cubra la ventana es la pieza que importa, y por no tenerlo la
 * cinta se quedaba sin texto: con un número fijo de copias la pista medía menos
 * que pantalla y media, así que a mitad del recorrido el último tercio quedaba
 * vacío. El número de copias que hace falta depende del ancho de la ventana, y
 * por eso no se puede acertar poniéndolo a mano.
 *
 * El ancho mínimo va en `vw` y no en `%`: la pista es `w-max`, así que un `100%`
 * se resolvería contra ella misma y se mordería la cola. La cinta es siempre de
 * ancho completo, y lo que sobre lo recorta el contenedor.
 *
 * Se para con `prefers-reduced-motion`.
 */
export function Marquee({
  text,
  className = '',
  seconds = 26,
}: {
  text: string;
  className?: string;
  seconds?: number;
}) {
  const reduced = useReducedMotion();

  // `justify-around` reparte las copias por todo el ancho de la mitad, así que
  // el espaciado se mantiene aunque `min-w-full` la estire.
  const half = (
    <div className="flex min-w-[100vw] shrink-0 items-center justify-around">
      {Array.from({ length: 7 }).map((_, index) => (
        <span key={index} className="px-8">
          {text}
        </span>
      ))}
    </div>
  );

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <div
        className="flex w-max whitespace-nowrap"
        style={
          reduced
            ? undefined
            : ({ animation: `bh-marquee ${seconds}s linear infinite` } as CSSProperties)
        }>
        {half}
        {half}
      </div>
    </div>
  );
}

/**
 * La cortina de entrada.
 *
 * Tapa la página el instante justo para que la portada no se vea montarse, y se
 * va sola. No bloquea nada: si el JavaScript no llegara, no habría cortina y la
 * página se vería igual.
 */
export function Curtain() {
  const [gone, setGone] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(() => setGone(true), reduced ? 0 : 620);
    return () => clearTimeout(timer);
  }, [reduced]);

  if (gone) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] bg-[#f0f0ec]"
      style={{ animation: reduced ? undefined : `bh-curtain 620ms ${EASE} forwards` }}
    />
  );
}
