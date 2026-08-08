import { ALPHABET, SPACE_ADVANCE } from './alphabet';
import { Stroke } from './Handwriting';
import { measurePath } from './measurePath';

/**
 * Compone una frase con el alfabeto de línea única y reparte el tiempo de
 * escritura entre los trazos.
 *
 * El reparto es **proporcional a la longitud de cada trazo**, no al número de
 * letras. Es lo que hace que la mano avance a velocidad constante: si cada letra
 * recibiera la misma porción de tiempo, una "i" se escribiría igual de despacio
 * que una "w" y el resultado se lee como una máquina, no como una mano.
 */

interface LayoutOptions {
  /** Ancho máximo de línea en unidades del alfabeto. Corta por palabras. */
  maxWidth: number;
  /** Separación entre líneas base, en unidades. */
  lineHeight: number;
}

export interface HandwrittenText {
  strokes: Stroke[];
  /** viewBox que encierra el resultado, con margen para el grosor del trazo. */
  viewBox: string;
  ratio: number;
}

/** Desplaza un trazado absoluto. Asume pares x,y, que es como están escritos. */
function translatePath(d: string, dx: number, dy: number): string {
  let index = 0;
  return d.replace(/-?\d*\.?\d+/g, (match) => {
    const value = Number(match) + (index % 2 === 0 ? dx : dy);
    index += 1;
    return String(Math.round(value * 100) / 100);
  });
}

function wordWidth(word: string): number {
  let width = 0;
  for (const character of word) {
    width += ALPHABET[character]?.advance ?? SPACE_ADVANCE;
  }
  return width;
}

export function layoutHandwriting(text: string, options: LayoutOptions): HandwrittenText {
  const words = text.split(' ');

  // Reparte las palabras en líneas sin partir ninguna.
  const lines: string[][] = [[]];
  let lineWidth = 0;

  for (const word of words) {
    const width = wordWidth(word);
    const withSpace = lines[lines.length - 1].length > 0 ? width + SPACE_ADVANCE : width;

    if (lineWidth + withSpace > options.maxWidth && lines[lines.length - 1].length > 0) {
      lines.push([word]);
      lineWidth = width;
    } else {
      lines[lines.length - 1].push(word);
      lineWidth += withSpace;
    }
  }

  // Coloca cada glifo y acumula los trazos, todavía sin tiempos.
  const placed: { d: string; length: number }[] = [];
  let widest = 0;

  lines.forEach((line, lineIndex) => {
    const dy = lineIndex * options.lineHeight;
    const content = line.join(' ');
    // Centrado: cada línea arranca donde le toque para quedar a eje.
    let x = (options.maxWidth - wordWidth(content)) / 2;

    for (const character of content) {
      const glyph = ALPHABET[character];

      if (!glyph) {
        x += SPACE_ADVANCE;
        continue;
      }

      // Los glifos enlazados se escriben sin `M`, dando por hecho que el
      // bolígrafo ya está en (0,108); se lo ponemos antes de desplazarlo todo.
      const body = glyph.lift ? glyph.d : `M0,108 ${glyph.d}`;
      const d = translatePath(body, x, dy);
      placed.push({ d, length: measurePath(d) });

      for (const extra of glyph.extras ?? []) {
        const moved = translatePath(extra, x, dy);
        placed.push({ d: moved, length: measurePath(moved) });
      }

      x += glyph.advance;
      widest = Math.max(widest, x);
    }
  });

  // Ahora sí, los tiempos: cada trazo ocupa la fracción del total que le
  // corresponde por longitud.
  const total = placed.reduce((sum, stroke) => sum + stroke.length, 0);
  let consumed = 0;

  const strokes: Stroke[] = placed.map((stroke) => {
    const from = consumed / total;
    consumed += stroke.length;
    return { d: stroke.d, from, to: consumed / total };
  });

  const margin = 14;
  const top = 28 - margin;
  const bottom = 150 + (lines.length - 1) * options.lineHeight + margin;
  const height = bottom - top;
  const width = options.maxWidth + margin * 2;

  return {
    strokes,
    viewBox: `${-margin} ${top} ${width} ${height}`,
    ratio: width / height,
  };
}
