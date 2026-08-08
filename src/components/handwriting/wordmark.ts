import { Stroke } from './Handwriting';

/**
 * El wordmark "Bihapia", dibujado como lettering de línea única.
 *
 * No es una fuente. Una fuente da contornos cerrados, y animar el contorno de
 * una letra dibuja su silueta en vez de su trazo: se ve el bolígrafo bajar por
 * un lado de la letra y volver por el otro. Para que parezca escritura de verdad
 * el trazo tiene que ser la línea que recorre la punta del bolígrafo, y eso hay
 * que dibujarlo a medida.
 *
 * Métricas del viewBox: base 110, altura de x 76, ascendente 26, descendente 150.
 * La palabra entera es un solo trazo continuo, como se escribe a mano; los
 * puntos de las íes caen al final, que es también el orden real.
 */

const WORD = [
  // B — bajada del asta, vuelta arriba, panza alta y panza baja
  'M28,26 C20,60 14,92 12,112',
  'C16,88 24,52 30,28',
  'C48,18 66,32 58,50 C53,63 40,68 28,68',
  'C48,66 66,74 64,92 C62,110 44,118 26,112',
  'C34,114 44,114 54,108',
  // i
  'C62,103 68,90 72,76',
  'C74,92 74,104 78,110 C82,114 88,113 94,106',
  // h
  'C104,96 110,58 112,28',
  'C112,58 110,90 110,110',
  'C112,86 122,74 132,76 C140,78 140,94 138,110',
  'C140,114 146,114 152,108',
  // a
  'C160,102 166,90 168,78',
  'C160,70 150,76 150,92 C150,108 162,116 168,104',
  'C170,97 170,86 169,76',
  'C169,92 170,104 174,109 C178,113 184,113 190,106',
  // p
  'C198,100 204,88 206,76',
  'C206,100 204,130 202,150',
  'C204,126 206,100 207,78',
  'C216,70 228,74 228,90 C228,106 216,114 206,106',
  'C212,111 220,114 228,108',
  // i
  'C236,102 242,90 244,76',
  'C246,92 246,104 250,110 C254,114 260,113 266,106',
  // a
  'C274,102 280,90 282,78',
  'C274,70 264,76 264,92 C264,108 276,116 282,104',
  'C284,97 284,86 283,76',
  'C283,92 284,104 288,109 C292,113 298,113 306,104',
].join(' ');

export const WORDMARK_VIEWBOX = '0 0 330 170';
export const WORDMARK_RATIO = 330 / 170;

export const WORDMARK_STROKES: Stroke[] = [
  { d: WORD, from: 0, to: 0.9 },
  { d: 'M74,56 C76,54 79,55 79,58', from: 0.9, to: 0.95 },
  { d: 'M246,56 C248,54 251,55 251,58', from: 0.95, to: 1 },
];
