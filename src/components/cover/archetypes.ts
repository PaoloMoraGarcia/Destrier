/**
 * Los cuatro arquetipos de portada.
 *
 * La gramática viene de un pack de micrografías: trazo fino, versalitas muy
 * espaciadas, líneas de guía, metadatos en los márgenes. Todo está **redibujado
 * aquí**, no exportado: los recursos de Figma Community llevan su propia
 * licencia y las fuentes que traen dentro no se relicencian con la plantilla, así
 * que nada de ese archivo viaja dentro de la app. Lo que se toma prestado es el
 * idioma, que no se licencia.
 *
 * El lienzo es 360 × 640, la proporción de una pantalla de móvil.
 */

export type CoverArchetype = 'lockup' | 'arc' | 'numbered' | 'seal';

export const COVER_VIEWBOX = { width: 360, height: 640 };

export const ARCHETYPES: CoverArchetype[] = ['lockup', 'arc', 'numbered', 'seal'];

/**
 * Qué portada le toca a cada publicación.
 *
 * Determinista a partir del id: la misma publicación enseña siempre la misma
 * portada. Si se sorteara al azar, cambiaría en cada render y una portada que
 * baila no es una portada.
 */
export function archetypeFor(id: string): CoverArchetype {
  let hash = 0;
  for (let index = 0; index < id.length; index++) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }
  return ARCHETYPES[hash % ARCHETYPES.length];
}

/** El número de dos cifras que se pinta en el arquetipo numerado. */
export function ordinalFor(id: string): string {
  let hash = 0;
  for (let index = 0; index < id.length; index++) {
    hash = (hash * 17 + id.charCodeAt(index)) >>> 0;
  }
  return String((hash % 99) + 1).padStart(2, '0');
}

/**
 * Ancho medio de un carácter respecto al cuerpo, para una sans semibold.
 * Es una estimación: el texto SVG no ajusta línea ni informa de su ancho, así
 * que si no se calcula a mano, un título largo se sale del lienzo por los lados.
 */
const CHAR_RATIO = 0.54;

interface FitOptions {
  /** Ancho disponible en unidades del viewBox. */
  maxWidth: number;
  maxFontSize: number;
  maxLines: number;
}

export interface FittedTitle {
  lines: string[];
  fontSize: number;
}

/** Reparte palabras en líneas sin pasarse del objetivo de caracteres. */
function wrapWords(words: string[], target: number): string[] {
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && candidate.length > target) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) lines.push(current);
  return lines;
}

/** Por debajo de esto el texto deja de ser legible en un móvil. */
const MIN_FONT_SIZE = 11;

/**
 * Ajusta un título al lienzo bajando el cuerpo hasta que quepa.
 *
 * **Nunca recorta palabras.** Si al llegar al cuerpo mínimo la frase sigue
 * necesitando más líneas de las previstas, se devuelven todas: una portada con
 * una línea de más se arregla mirándola, pero una que se come el final de la
 * frase engaña, porque parece correcta.
 */
export function fitTitle(title: string, options: FitOptions): FittedTitle {
  const words = title.trim().split(/\s+/);
  let lines = words;
  let fontSize = options.maxFontSize;

  for (; fontSize >= MIN_FONT_SIZE; fontSize -= 0.5) {
    const charsPerLine = Math.floor(options.maxWidth / (fontSize * CHAR_RATIO));
    lines = wrapWords(words, charsPerLine);

    // La palabra más larga tiene que caber entera: si no, ninguna cantidad de
    // líneas arregla el desbordamiento y hay que seguir bajando el cuerpo.
    const longest = Math.max(...lines.map((line) => line.length));
    if (lines.length <= options.maxLines && longest <= charsPerLine) break;
  }

  return { lines, fontSize: Math.max(fontSize, MIN_FONT_SIZE) };
}
