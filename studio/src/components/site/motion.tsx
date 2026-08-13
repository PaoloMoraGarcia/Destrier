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
  /**
   * Si está, el nodo no aparece él: reparte su progreso en dos fases —primero
   * las palabras del título, después los bloques que lo acompañan—. Con `pin`,
   * además clava la pantalla mientras lo hace.
   */
  scene?: { words: HTMLElement[]; items: HTMLElement[]; pin: boolean };
}

const subjects = new Set<Subject>();
let loop = 0;

/**
 * Reparte un tramo de progreso entre varios elementos.
 *
 * Las ventanas se solapan: cada uno tarda el doble de lo que le tocaría, así que
 * casi siempre hay dos entrando a la vez. Sin solape se ve como un contador, a
 * tirones, y no como una frase construyéndose.
 */
function revelar(parts: HTMLElement[], progress: number) {
  if (parts.length === 0) return;

  const step = 1 / parts.length;

  parts.forEach((part, index) => {
    const local = (progress - index * step) / (step * 2);
    const clamped = Math.min(1, Math.max(0, local));
    const eased = 1 - Math.pow(1 - clamped, 3);

    part.style.opacity = String(eased);
    part.style.transform = `translate3d(0, ${(1 - eased) * 16}px, 0)`;
  });
}

function paintAll() {
  const height = window.innerHeight;

  for (const { node, span, rise, offset, scene } of subjects) {
    const rect = node.getBoundingClientRect();

    // La escena, en dos fases: primero entra el título palabra a palabra y
    // después los bloques que lo acompañan. Clavando, lo de dentro va `sticky`,
    // así que la página parece detenida y lo que avanza es la escena.
    if (scene) {
      let progress: number;

      if (scene.pin) {
        const runway = Math.max(1, rect.height - height);

        // El reparto arranca **antes** de que la pantalla se clave: cuando el
        // borde superior de la pista todavía está a un 40 % de pantalla del
        // tope.
        //
        // Sin esta ventaja, al engancharse el clavado quedaba una pantalla
        // entera vacía con todo a opacidad 0 — y lo mismo al volver a subir.
        // Ahora, para cuando la página se detiene, la primera palabra ya está
        // dentro y nunca hay un fotograma en blanco.
        const lead = height * 0.4;
        progress = Math.min(1, Math.max(0, (lead - rect.top) / (runway + lead)));
      } else {
        // Sin clavado —cuando la escena no cabría en la pantalla— el reparto se
        // mide contra la travesía del bloque, de asomar por abajo a quedar
        // arriba del todo.
        const crossing = Math.max(1, height * 0.75);
        progress = Math.min(1, Math.max(0, (height * 0.85 - rect.top) / crossing));
      }

      // El título ocupa el primer tramo del recorrido y los bloques el resto.
      // Así se lee lo que la escena dice antes de que llegue el detalle.
      const CORTE = 0.55;

      revelar(scene.words, progress / CORTE);
      revelar(scene.items, (progress - CORTE) / (1 - CORTE));

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
 * Una escena que se construye con la pantalla clavada.
 *
 * Dos fases: primero entra el título palabra a palabra y después los bloques que
 * lo acompañan. La pista mide algo más que una pantalla y lo de dentro va
 * `sticky`, así que mientras pasa, la página **parece detenida** y lo que avanza
 * es la escena. Si la página siguiera bajando, el scroll estaría haciendo dos
 * cosas a la vez.
 *
 * **No clava si la escena no cabe en la pantalla.** Una escena clavada más alta
 * que la ventana es una página rota: se congela el scroll y parte del contenido
 * queda fuera sin forma de llegar a él. Se mide al montar y al redimensionar, y
 * si no cabe se comporta como flujo normal con la misma aparición. Ajustar los
 * tamaños a mano acierta en el móvil que pruebas y falla en el siguiente.
 */
export function PinnedScene({
  words,
  className = '',
  label,
  lead,
  items,
  itemsClassName = '',
}: {
  words: string[];
  className?: string;
  /** Etiqueta pequeña de la sección. Va dentro y sin animación. */
  label?: ReactNode;
  /** Línea de entrada bajo el título, si la hay. Entra con los bloques. */
  lead?: ReactNode;
  /** Los bloques que entran después del título. */
  items?: ReactNode[];
  itemsClassName?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [cabe, setCabe] = useState(true);

  // ¿Cabe la escena en la pantalla? De eso depende que se pueda clavar.
  //
  // Se mide el **contenido**, no el escenario. El escenario mide una pantalla
  // entera cuando está clavado, así que medirlo a él daba siempre "no cabe",
  // eso lo desclavaba, y al desclavarse volvía a caber: un bucle que acababa
  // con ninguna sección clavando.
  useEffect(() => {
    const node = stage.current;
    if (!node) return;

    const medir = () => {
      // Un margen de respiro: si va justa, tampoco conviene clavarla.
      setCabe(node.scrollHeight + 48 <= window.innerHeight);
    };

    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, []);

  const clava = cabe && !reduced;

  useEffect(() => {
    const node = track.current;
    if (!node) return;

    const words = Array.from(node.querySelectorAll<HTMLElement>('[data-word]'));
    const items = Array.from(node.querySelectorAll<HTMLElement>('[data-item]'));

    // Quien ha pedido que no haya movimiento no debería encontrarse la página
    // atrapada: se ve todo y no se clava nada.
    if (reduced) {
      [...words, ...items].forEach((part) => {
        part.style.opacity = '1';
        part.style.transform = 'none';
      });
      return;
    }

    return subscribe({ node, span: 1, rise: 0, offset: 0, scene: { words, items, pin: clava } });
  }, [reduced, clava]);

  return (
    <div
      ref={track}
      // Clavando, la pista mide una pantalla y media: la media pantalla de sobra
      // es exactamente lo que dura la pausa. Sin clavar no hace falta pista.
      className={clava ? 'relative h-[150svh]' : 'relative'}>
      <div
        className={`flex flex-col items-center px-6 ${
          clava ? 'sticky top-0 h-svh justify-center' : 'py-10'
        }`}>
        {/* El contenido va en su propia caja, de alto natural, y es la que se
            mide. La de fuera cambia de alto según se clave o no. */}
        <div ref={stage} className="flex w-full flex-col items-center">
        {/*
          La etiqueta va **dentro** y **sin animación**: se ve durante toda la
          pausa. Fuera se iría justo cuando más falta hace.
        */}
        {label && (
          <p className="mb-8 font-mono text-[11px] uppercase tracking-[0.28em] opacity-45">
            {label}
          </p>
        )}

        {/* `w-full`: como ítem flex, el párrafo crecería hasta su contenido y
            entonces `flex-wrap` no envolvería nada — la frase se saldría por la
            derecha en vez de partir y centrarse. */}
        <p className={`flex w-full flex-wrap justify-center gap-x-[0.28em] ${className}`}>
          {words.map((word, index) => (
            <span
              key={`${word}-${index}`}
              data-word
              className="inline-block will-change-transform"
              style={{ opacity: 0 }}>
              {word}
            </span>
          ))}
        </p>

        {lead && (
          <p
            data-item
            className="mt-10 max-w-[46ch] text-center text-[clamp(1rem,1.6vw,1.2rem)] leading-relaxed opacity-60"
            style={{ opacity: 0 }}>
            {lead}
          </p>
        )}

        {items && items.length > 0 && (
          <div className={`mt-14 w-full ${itemsClassName}`}>
            {items.map((item, index) => (
              <div key={index} data-item style={{ opacity: 0 }}>
                {item}
              </div>
            ))}
          </div>
        )}
        </div>
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
