/**
 * La página de venta de un curso: el modelo.
 *
 * Aquí no se importa Supabase. Las consultas viven en `landing.server.ts` y
 * están separadas por una razón concreta, no por gusto: el editor es un
 * componente de cliente y necesita estos tipos y estas constantes, así que si
 * este archivo tocara `next/headers` arrastraría medio servidor al navegador y
 * la compilación se cae. Lo aprendí rompiéndolo.
 *
 * Dos piezas que no hay que mezclar:
 *
 *  - **El curso** (`CourseData`) sale de la base de datos y el creador no lo
 *    escribe aquí: título, precio, lecciones, autor. El precio en particular
 *    vive en `courses`, donde lo protegen el gate de KYC y el rango del MVP.
 *  - **La composición** (`Landing`) es lo único que se edita en esta pantalla:
 *    qué bloques hay, en qué orden y con qué texto.
 *
 * Esa separación es la razón de que la vista previa sea fiable: los datos son
 * los de verdad y lo único que cambia al editar es la presentación.
 */

export type LandingTheme = 'papel' | 'tinta' | 'ambar';

export type Block =
  | { type: 'hero' }
  | { type: 'preview' }
  | { type: 'outcomes'; items: string[] }
  | { type: 'syllabus' }
  | { type: 'author' }
  | { type: 'faq'; items: { q: string; a: string }[] }
  | { type: 'quote'; text: string; author: string }
  | { type: 'closing' };

export type BlockType = Block['type'];

export interface Landing {
  theme: LandingTheme;
  promise: string;
  ctaLabel: string;
  blocks: Block[];
}

export interface Lesson {
  title: string;
  isPreview: boolean;
}

export interface CourseData {
  handle: string;
  slug: string;
  title: string;
  summary: string | null;
  coverUrl: string | null;
  priceCents: number | null;
  currency: string;
  authorName: string;
  authorBio: string | null;
  authorAvatarUrl: string | null;
  isVerified: boolean;
  lessons: Lesson[];
}

/**
 * Los tres temas.
 *
 * Se eligió dar tres combinaciones cerradas en vez de un selector de color
 * libre. Con libertad total la mayoría de páginas salen peor, porque acertar con
 * contraste y jerarquía es un oficio; con tres opciones ninguna puede quedar
 * mal. Es la diferencia concreta frente a Skool, donde la única palanca del
 * creador es la imagen de portada y por eso todas las portadas acaban gritando.
 *
 * Van como variables CSS en el contenedor, no como clases condicionales: añadir
 * un tema es añadir datos aquí y nada más.
 */
export const THEMES: Record<LandingTheme, { label: string; vars: Record<string, string> }> = {
  papel: {
    label: 'Papel',
    vars: {
      '--l-canvas': '#f0f0ec',
      '--l-surface': '#ffffff',
      '--l-ink': '#0a0a0a',
      '--l-soft': '#5f5f59',
      '--l-line': '#dededa',
      '--l-accent': '#f5a623',
      '--l-on-accent': '#0a0a0a',
    },
  },
  tinta: {
    label: 'Tinta',
    vars: {
      '--l-canvas': '#0a0a0a',
      '--l-surface': '#151513',
      '--l-ink': '#f4f4ef',
      '--l-soft': '#a3a39b',
      '--l-line': '#2b2b26',
      '--l-accent': '#f5a623',
      '--l-on-accent': '#0a0a0a',
    },
  },
  ambar: {
    label: 'Ámbar',
    vars: {
      '--l-canvas': '#fdf3e2',
      '--l-surface': '#fffaf1',
      '--l-ink': '#241a08',
      '--l-soft': '#6b5734',
      '--l-line': '#ecdcc0',
      '--l-accent': '#0a0a0a',
      '--l-on-accent': '#fdf3e2',
    },
  },
};

/** Etiqueta y descripción de cada bloque, para el editor. */
export const BLOCK_INFO: Record<BlockType, { label: string; hint: string }> = {
  hero: { label: 'Portada', hint: 'Imagen, título, promesa y botón.' },
  preview: { label: 'La lección gratis', hint: 'Se ve entera antes de pagar.' },
  outcomes: { label: 'Lo que vas a saber', hint: 'Lista corta, escrita por ti.' },
  syllabus: { label: 'Temario', hint: 'Se genera solo desde tus lecciones.' },
  author: { label: 'Quién lo enseña', hint: 'Sale de tu perfil.' },
  faq: { label: 'Preguntas', hint: 'Lo que te preguntan antes de comprar.' },
  quote: { label: 'Una cita', hint: 'Un testimonio en texto. Sin estrellas.' },
  closing: { label: 'Cierre', hint: 'El botón otra vez, con el precio.' },
};

/** El orden en que se ofrecen los bloques apagados. */
export const BLOCK_ORDER: BlockType[] = [
  'hero',
  'preview',
  'outcomes',
  'syllabus',
  'author',
  'faq',
  'quote',
  'closing',
];

/** Un bloque recién encendido, con su contenido de partida. */
export function emptyBlock(type: BlockType): Block {
  switch (type) {
    case 'outcomes':
      return { type, items: ['', '', ''] };
    case 'faq':
      return { type, items: [{ q: '', a: '' }] };
    case 'quote':
      return { type, text: '', author: '' };
    default:
      return { type } as Block;
  }
}

/**
 * La página con la que se abre el editor cuando no hay nada guardado.
 *
 * No es un adorno: una página en blanco con ocho bloques apagados no enseña qué
 * se puede hacer, y el creador se va sin llegar a montarla.
 */
export const DEFAULT_LANDING: Landing = {
  theme: 'papel',
  promise: '',
  ctaLabel: 'Empezar',
  blocks: [
    { type: 'hero' },
    { type: 'preview' },
    { type: 'outcomes', items: ['', '', ''] },
    { type: 'syllabus' },
    { type: 'author' },
    { type: 'closing' },
  ],
};

export interface EditorState {
  /** Con `false` se puede componer y mirar, pero no guardar. */
  saveable: boolean;
  /** Vacío en la muestra: no hay curso real al que escribir. */
  courseId: string;
  landing: Landing;
  course: CourseData;
}

/**
 * Curso de muestra.
 *
 * Sin `.env.local` no hay base de datos, y sin base de datos el editor no tendría
 * ni un título que enseñar. La app móvil resuelve lo mismo con `src/data/mock.ts`
 * y ese camino no se puede romper; aquí vale el mismo criterio, con la condición
 * de que se vea que es una muestra y que no se pueda guardar.
 */
export const DEMO_COURSE: CourseData = {
  handle: 'noraverse',
  slug: 'lo-que-no-sabes-de-los-mapas',
  title: 'Lo que no sabes de los mapas',
  summary: 'Seis lecciones sobre por qué ningún mapa dice la verdad, y qué hacer con eso.',
  coverUrl: null,
  priceCents: 1900,
  currency: 'USD',
  authorName: 'Nora Vessel',
  authorBio: 'Cartógrafa. Llevo diez años dibujando cosas que no existen del todo.',
  authorAvatarUrl: null,
  isVerified: true,
  lessons: [
    { title: 'Por qué Groenlandia te ha mentido toda la vida', isPreview: true },
    { title: 'El meridiano que se decidió a mano alzada', isPreview: false },
    { title: 'Ciudades trampa: los pueblos inventados', isPreview: false },
    { title: 'Proyecciones: elegir qué deformar', isPreview: false },
    { title: 'El norte no siempre estuvo arriba', isPreview: false },
    { title: 'Dibujar un mapa honesto', isPreview: false },
  ],
};

export const DEMO_LANDING: Landing = {
  theme: 'papel',
  promise: 'Vas a mirar cualquier mapa y ver la decisión que hay detrás.',
  ctaLabel: 'Empezar',
  blocks: [
    { type: 'hero' },
    { type: 'preview' },
    {
      type: 'outcomes',
      items: [
        'Por qué toda proyección deforma algo, y cuál te conviene',
        'Cómo detectar un mapa que empuja una idea',
        'Dibujar el tuyo sin mentir sin querer',
      ],
    },
    { type: 'syllabus' },
    { type: 'author' },
    {
      type: 'faq',
      items: [
        { q: '¿Hace falta saber dibujar?', a: 'No. Todo lo que se hace a mano se hace con lápiz y regla.' },
        { q: '¿Cuánto dura?', a: 'Seis lecciones de menos de diez minutos.' },
      ],
    },
    { type: 'closing' },
  ],
};


