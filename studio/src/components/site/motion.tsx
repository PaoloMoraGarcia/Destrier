'use client';

import Lenis from 'lenis';
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react';

/**
 * El movimiento de la landing.
 *
 * Dos piezas, y la segunda es la que de verdad importa:
 *
 *  1. **Lenis** amortigua la rueda, para que el scroll no salte de golpe.
 *  2. **El registro interpola desde la posición en pantalla**, no suelta una
 *     clase al entrar. Es la diferencia entre parecerse y ser igual: en una
 *     aparición por clase, si paras a media animación el texto termina de
 *     aparecer solo; aquí, si paras, se queda donde está. La página responde a
 *     la rueda de forma continua, y eso es la mitad de por qué se siente suave.
 *
 * Lo comprobé en la referencia parando el scroll a mitad: la palabra se quedó
 * quieta a media opacidad. Ese es el detalle que se está copiando.
 *
 * **Aquí no entra GSAP.** Se añadió al proyecto para la columna arrastrable, que
 * necesita inercia de verdad, y vive en `drag.ts`. Para lo atado al scroll no
 * aporta: `ScrollTrigger` daría exactamente este mismo valor de progreso, pero
 * la página no scrollea en la ventana sino en un contenedor propio, y eso
 * obligaría a montar un `scrollerProxy` — una capa más entre el scroll y el
 * píxel, para sustituir treinta líneas que ya funcionan y que se pueden leer
 * enteras.
 *
 * **Todo se apaga con `prefers-reduced-motion`.** Con esta cantidad de
 * movimiento no es cortesía: es la diferencia entre una página y un mareo.
 */

/** La curva de la referencia. Es una curva, no una marca. */
export const EASE = 'cubic-bezier(0.65, 0.05, 0.36, 1)';

/**
 * La consulta, una sola vez para todo el módulo.
 *
 * `matchMedia` **devuelve un objeto nuevo en cada llamada**, y eso ya costó una
 * pasada: un `change` disparado a mano sobre uno recién pedido no llega nunca al
 * oyente que escucha en otro. Con una sola instancia, todos los suscriptores
 * miran exactamente lo mismo.
 */
const CONSULTA = '(prefers-reduced-motion: reduce)';
let consulta: MediaQueryList | null = null;

const media = () => {
  if (typeof window === 'undefined') return null;
  consulta ??= window.matchMedia(CONSULTA);
  return consulta;
};

/**
 * Si quien mira ha pedido que no haya movimiento.
 *
 * **Va con `useSyncExternalStore` y no con un efecto**, que es lo que había. Aquel
 * arrancaba en `false` y llamaba a `setState` dentro del efecto para corregirse:
 * un render de más en cada carga, un fotograma en el que el movimiento sí está
 * encendido para quien pidió que no lo estuviera, y un aviso de React con toda la
 * razón —poner estado dentro de un efecto es pedir renders en cascada—.
 *
 * Esta es la API que React tiene para exactamente esto: leer algo de fuera que
 * cambia por su cuenta. El valor correcto está **en el primer render**, y el
 * servidor —que no tiene `matchMedia`— responde `false`, que es el único valor
 * honesto ahí: no se puede saber la preferencia de nadie sin un navegador.
 */
export function useReducedMotion() {
  return useSyncExternalStore(
    (avisar) => {
      const q = media();
      if (!q) return () => {};
      q.addEventListener('change', avisar);
      return () => q.removeEventListener('change', avisar);
    },
    () => media()?.matches ?? false,
    () => false
  );
}

/**
 * La instancia de Lenis en marcha, si la hay.
 *
 * Vive fuera del componente porque `irA` la necesita desde cualquier parte de la
 * página. Con movimiento reducido no hay instancia, y `irA` lo resuelve saltando
 * sin animación — que es lo que se ha pedido en ese caso.
 */
let activo: Lenis | null = null;

/**
 * Baja hasta un ancla con desplazamiento suave.
 *
 * Sin esto, un `href="#contact"` salta de golpe: el ancla nativa no sabe nada de
 * Lenis y el viaje se pierde. Y no vale un `scroll-behavior: smooth` en CSS,
 * porque Lenis gobierna el contenedor y los dos se pelearían.
 */
export function irA(selector: string, duracion = 1100) {
  const destino = document.querySelector(selector);
  const raiz = document.querySelector<HTMLElement>('[data-scroll-root]');
  if (!destino || !raiz) return;

  const desde = raiz.scrollTop;
  const hasta = destino.getBoundingClientRect().top + desde;

  // Sin Lenis —movimiento reducido— el salto es instantáneo a propósito: quien
  // ha pedido que no haya movimiento no quiere un viaje de segundo y medio.
  if (!activo) {
    raiz.scrollTop = hasta;
    return;
  }

  /*
   * El viaje se hace aquí y no con `scrollTo` de Lenis.
   *
   * Con el suyo se quedaba **1080 px corto** de forma reproducible: pedía 4255 y
   * paraba en 3175, con el formulario aún fuera de pantalla. Se descartó que
   * fuera un tope —con la rueda la página llega al final— y que la maqueta
   * cambiara de alto por el camino. Dar con el motivo exacto dentro de Lenis no
   * compensaba, y un tween propio de doce líneas es determinista y se puede
   * comprobar.
   *
   * Lenis se para mientras dura, así que no hay dos cosas escribiendo el mismo
   * scroll a la vez, y se reanuda al acabar.
   */
  activo.stop();

  const arranque = performance.now();

  const paso = (ahora: number) => {
    const p = Math.min(1, (ahora - arranque) / duracion);
    const suave = 1 - Math.pow(1 - p, 3);

    raiz.scrollTop = desde + (hasta - desde) * suave;

    if (p < 1) requestAnimationFrame(paso);
    else activo?.start();
  };

  requestAnimationFrame(paso);
}

/*
 * Aquí hubo un `cerrarScroll` / `abrirScroll` para una pantalla de entrada con
 * puerta. **No vuelve.**
 *
 * Cerrar el `overflow` del contenedor deja la página entera inalcanzable si
 * cualquier eslabón de la cadena que la reabre falla — y uno falló: con
 * `prefers-reduced-motion`, la preferencia se conoce un instante después de que
 * el efecto ya haya cerrado, así que la página se quedaba bloqueada para siempre.
 *
 * Si algún día hace falta otra vez, la regla es que **la puerta se abra sola**:
 * un temporizador de seguridad, o directamente no tocar el `overflow` y usar solo
 * una pista alta. Nada que dependa de que un manejador acierte para que la web se
 * pueda usar.
 */

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

    activo = lenis;

    let frame = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      activo = null;
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
  /** Fracción de pantalla que dura el recorrido. Más alto, más lento. */
  span: number;
  /** Cuánto sube el nodo, en píxeles. Se ignora si hay `paint`. */
  rise: number;
  /** Retraso relativo, para escalonar hermanos. En fracción de pantalla. */
  offset: number;
  /**
   * A qué altura de la pantalla el progreso vale 0, en fracción — 1 es el borde
   * de abajo. Por defecto lo decide `offset`.
   */
  startAt?: number;
  /**
   * Si está, el nodo no aparece él: recibe el progreso y pinta lo que quiera.
   * Es lo que permite que una frase se ilumine palabra a palabra sin que el
   * registro sepa nada de palabras.
   */
  paint?: (progress: number) => void;
}

const subjects = new Set<Subject>();
let loop = 0;

/**
 * Reparte un tramo de progreso entre varios elementos y devuelve, para cada uno,
 * cuánto le toca de 0 a 1.
 *
 * Las ventanas se solapan: cada uno dura lo que dos, así que casi siempre hay dos
 * entrando a la vez. Sin solape se ve como un contador, a tirones, y no como una
 * frase construyéndose.
 *
 * **Los arranques se reparten sobre `1 - ventana`, no sobre 1.** Con la versión
 * anterior el último elemento arrancaba tan tarde que a progreso 1 solo había
 * recorrido la mitad de su ventana: se quedaba en 0,875 y no llegaba nunca. En una
 * frase eso es la última palabra permanentemente más apagada que las demás, y solo
 * se ve cuando lo mides. Ahora el último termina justo en 1.
 */
export function repartir(total: number, index: number, progress: number) {
  if (total <= 0) return 0;
  if (total === 1) return 1 - Math.pow(1 - Math.min(1, Math.max(0, progress)), 3);

  const ventana = Math.min(1, 2 / total);
  const inicio = (index / (total - 1)) * (1 - ventana);
  const local = (progress - inicio) / ventana;
  const clamped = Math.min(1, Math.max(0, local));

  return 1 - Math.pow(1 - clamped, 3);
}

function paintAll() {
  const height = window.innerHeight;

  for (const { node, span, rise, offset, startAt, paint } of subjects) {
    const rect = node.getBoundingClientRect();

    // Empieza cuando el borde superior cruza `startAt` y termina `span`
    // pantallas más arriba. `offset` retrasa a los hermanos para escalonar.
    const start = height * (startAt ?? 1 - offset * 0.12);
    const progress = (start - rect.top) / (height * span);
    const clamped = Math.min(1, Math.max(0, progress));

    if (paint) {
      paint(clamped);
      continue;
    }

    // Suavizado en la salida: el último tramo se estira, así que el texto se
    // asienta en vez de llegar de golpe a su sitio.
    const eased = 1 - Math.pow(1 - clamped, 3);

    node.style.opacity = String(eased);
    node.style.transform = `translate3d(0, ${(1 - eased) * rise}px, 0)`;
  }

  loop = subjects.size > 0 ? requestAnimationFrame(paintAll) : 0;
}

export function subscribe(subject: Subject) {
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
  span?: number;
  rise?: number;
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
 * se resolvería contra ella misma y se mordería la cola.
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
      className="pointer-events-none fixed inset-0 z-[100] bg-[#ffffff]"
      style={{ animation: reduced ? undefined : `bh-curtain 620ms ${EASE} forwards` }}
    />
  );
}
