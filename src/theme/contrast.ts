/**
 * Contraste sobre fondos arbitrarios.
 *
 * Las entradillas de texto llevan un color de fondo elegido por el creador, así
 * que ni la tipografía ni la barra de estado pueden asumir que están sobre
 * negro. Lo que decide es la luminancia relativa, no el "parece claro".
 */

/** Luminancia relativa (WCAG 2.1) de un color hex de 6 dígitos. */
export function relativeLuminance(hex: string): number {
  const value = hex.replace('#', '');
  const channels = [0, 2, 4].map((offset) => {
    const channel = parseInt(value.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** true si sobre este fondo hay que pintar en oscuro. */
export function isLightBackground(hex: string): boolean {
  return relativeLuminance(hex) > 0.4;
}
