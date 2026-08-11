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
}

const subjects = new Set<Subject>();
let loop = 0;

function paintAll() {
  const height = window.innerHeight;

  for (const { node, span, rise, offset } of subjects) {
    const rect = node.getBoundingClientRect();

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
 * La cascada palabra por palabra.
 *
 * Cada palabra en su línea y con su propio retraso, que es exactamente lo que
 * hace la referencia con su manifiesto.
 */
export function WordCascade({
  words,
  className = '',
}: {
  words: string[];
  className?: string;
}) {
  return (
    <div className={className}>
      {words.map((word, index) => (
        <Reveal key={`${word}-${index}`} offset={index} rise={28} span={0.22}>
          {word}
        </Reveal>
      ))}
    </div>
  );
}

/**
 * La marquesina.
 *
 * El contenido va duplicado y se desplaza justo la mitad, que es lo que hace
 * que el bucle no tenga costura. Se para con `prefers-reduced-motion`.
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
  const repeats = 6;

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <div
        className="flex w-max whitespace-nowrap"
        style={
          reduced
            ? undefined
            : ({ animation: `bh-marquee ${seconds}s linear infinite` } as CSSProperties)
        }>
        {Array.from({ length: repeats * 2 }).map((_, index) => (
          <span key={index} className="px-8">
            {text}
          </span>
        ))}
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
