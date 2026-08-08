/**
 * Paleta de Bihapia — §5 del contexto de producto.
 *
 * Negro absoluto de base y un único acento ámbar cálido. Deliberadamente no hay
 * azul en la paleta de marca: está saturado en el mercado y trabaja en contra de
 * la sensación de calma que persigue el anti-FOMO.
 */

export const colors = {
  /** Fondo de la app. Negro puro, no gris oscuro: da profundidad al glass. */
  background: '#000000',

  /**
   * Hoja blanca que se abre desde el centro al tocar un reel. Es opaca a
   * propósito: mientras lees el caption, el vídeo no compite.
   */
  sheet: '#FFFFFF',

  /** Acento de marca. */
  amber: '#F5A623',
  amberSoft: '#FFC65C',
  amberDeep: '#C97F12',

  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.62)',
    tertiary: 'rgba(255, 255, 255, 0.38)',
    /** Sobre tarjetas de texto de fondo claro. */
    onLight: '#0A0A0A',
  },

  /**
   * Superficies glass del fallback (cuando no hay Liquid Glass nativo).
   * El borde superior claro es lo que vende la ilusión de material: sin él,
   * un blur se lee como "capa borrosa", no como "cristal".
   */
  glass: {
    /**
     * Velo bajo el contenido de toda superficie glass. Sin él, el panel sobre
     * una entradilla de fondo claro se vuelve texto blanco sobre cristal blanco.
     */
    scrim: 'rgba(0, 0, 0, 0.42)',
    tint: 'rgba(255, 255, 255, 0.08)',
    tintStrong: 'rgba(255, 255, 255, 0.14)',
    stroke: 'rgba(255, 255, 255, 0.18)',
    strokeSoft: 'rgba(255, 255, 255, 0.10)',
  },
} as const;

/**
 * Los dos extremos de la interpolación del splash (§6.2): al arrastrar hacia
 * abajo, cada blob viaja de su color frío a su color cálido. Ambos arrays deben
 * tener la misma longitud — se emparejan por índice.
 */
export const blobPalette = {
  cold: ['#6C5CE7', '#00D2A0', '#4A90D9', '#8E6CF0', '#2FA8C7'],
  warm: ['#F5A623', '#FF8A3D', '#FFC65C', '#E0761A', '#FFB03A'],
} as const;

/** Fondos disponibles para las entradillas de solo texto (§7). */
export const textCardBackgrounds = [
  '#FFFFFF',
  '#F5A623',
  '#101010',
  '#E8E4DC',
  '#1C1B4D',
] as const;
