/**
 * Alfabeto cursivo de línea única.
 *
 * Cada glifo está escrito en las mismas métricas que el wordmark, para que
 * ambos se sientan de la misma mano:
 *
 *   ascendente 28 · altura de x 76 · base 108 · descendente 150
 *
 * Cada glifo entra por (0, 108) y sale por (advance, 108), con el trazo de
 * unión incluido: así las letras se encadenan solas sin lógica de ligaduras.
 * Los que llevan `lift: true` empiezan con el bolígrafo levantado — las
 * mayúsculas y los signos, que no se enlazan con lo anterior.
 *
 * Solo están las letras que hacen falta. Añadir una es escribir su trazo aquí.
 */

export interface Glyph {
  /** Trazo principal, sin el `M` inicial salvo que `lift` sea true. */
  d: string;
  advance: number;
  /** Trazos sueltos: puntos de las íes, travesaño de la t. */
  extras?: string[];
  /** Empieza con el bolígrafo levantado, no enlaza con la letra anterior. */
  lift?: boolean;
}

export const SPACE_ADVANCE = 26;

export const ALPHABET: Record<string, Glyph> = {
  B: {
    lift: true,
    advance: 54,
    d: 'M28,26 C20,60 14,92 12,112 C16,88 24,52 30,28 C48,18 66,32 58,50 C53,63 40,68 28,68 C48,66 66,74 64,92 C62,110 44,118 26,112 C34,114 44,114 54,108',
  },
  a: {
    advance: 38,
    d: 'C8,104 14,92 16,80 C8,72 -2,78 -2,94 C-2,110 10,118 16,106 C18,99 18,88 17,78 C17,94 18,106 22,111 C26,115 32,115 38,108',
  },
  b: {
    advance: 42,
    d: 'C6,88 12,56 14,28 C14,56 12,88 11,108 C15,90 25,80 33,84 C40,88 39,104 30,109 C25,112 20,111 16,108 C22,113 32,113 42,108',
  },
  d: {
    advance: 44,
    d: 'C6,102 14,94 22,92 C15,86 6,92 6,102 C6,112 16,118 24,110 C29,105 31,92 32,74 C33,56 34,40 34,28 C34,56 33,88 33,106 C34,112 38,112 44,108',
  },
  e: {
    advance: 34,
    d: 'C6,104 14,98 22,92 C26,89 24,82 18,82 C10,82 4,90 6,100 C8,110 18,116 26,110 C30,107 32,106 34,108',
  },
  g: {
    advance: 42,
    d: 'C6,102 14,94 22,92 C15,86 6,92 6,102 C6,112 16,118 24,110 C28,106 30,96 31,86 C30,106 29,130 26,142 C23,152 14,152 13,144 C17,150 25,146 31,136 C36,127 40,114 42,108',
  },
  h: {
    advance: 58,
    d: 'C10,96 16,58 18,28 C18,58 16,90 16,110 C18,86 28,74 38,76 C46,78 46,94 44,110 C46,114 52,114 58,108',
  },
  i: {
    advance: 40,
    d: 'C8,103 14,90 18,76 C20,92 20,104 24,110 C28,114 34,113 40,106',
    extras: ['M20,56 C22,54 25,55 25,58'],
  },
  k: {
    advance: 44,
    d: 'C6,88 12,56 14,28 C14,56 12,88 11,108 C17,100 26,92 33,86 C28,94 22,100 16,102 C22,102 30,104 36,110 C39,112 42,110 44,108',
  },
  n: {
    advance: 52,
    d: 'C6,100 12,88 14,78 C15,90 15,100 15,110 C17,88 27,76 36,78 C43,80 43,96 41,110 C43,113 48,113 52,108',
  },
  o: {
    advance: 42,
    // El bucle se cierra por arriba antes de salir. Sin ese cierre la panza
    // queda abierta por la derecha y la letra se lee como una "a".
    d: 'C4,100 9,84 19,79 C28,75 35,83 33,95 C31,106 20,113 13,105 C6,98 9,84 19,79 C26,76 31,82 31,91 C31,100 33,105 42,108',
  },
  p: {
    advance: 38,
    d: 'C8,100 14,88 16,76 C16,100 14,130 12,150 C14,126 16,100 17,78 C26,70 38,74 38,90 C38,106 26,114 16,106 C22,111 30,114 38,108',
  },
  s: {
    advance: 34,
    // Forma abierta, sin bucles: sube, cruza por arriba a la derecha, baja en
    // diagonal y sale por abajo. Las dos versiones anteriores se cerraban sobre
    // sí mismas a media altura y el trazo se leía como un rizo.
    d: 'C4,96 8,84 14,79 C20,74 27,78 25,85 C23,92 13,95 10,101 C8,106 15,108 21,105 C26,102 30,104 34,108',
  },
  t: {
    advance: 36,
    d: 'C5,96 10,70 12,44 C12,72 11,94 12,106 C13,112 18,113 24,110 C28,108 32,108 36,108',
    extras: ['M2,62 C10,60 20,59 26,59'],
  },
  u: {
    advance: 52,
    d: 'C6,100 12,88 14,78 C13,92 12,104 16,110 C22,116 30,106 33,90 C34,84 35,80 36,78 C35,92 34,104 38,110 C42,114 48,113 52,108',
  },
  w: {
    advance: 56,
    d: 'C6,100 12,88 14,78 C13,92 13,104 17,110 C21,115 26,106 28,92 C29,86 30,80 30,78 C30,92 30,104 34,110 C38,115 44,106 46,92 C47,86 48,80 48,78 C47,92 47,104 50,110 C52,113 54,110 56,108',
  },
  y: {
    advance: 46,
    d: 'C6,100 12,88 14,78 C13,92 13,104 17,110 C22,116 29,106 32,92 C33,86 34,80 35,78 C34,96 32,120 28,136 C25,148 16,150 14,142 C18,148 26,144 32,134 C38,124 42,114 46,108',
  },
  "'": {
    lift: true,
    advance: 14,
    d: 'M7,56 C8,62 8,70 7,76',
  },
  '.': {
    lift: true,
    advance: 18,
    d: 'M6,106 C8,104 11,105 11,108',
  },
};
