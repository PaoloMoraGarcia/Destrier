/**
 * Formatear cifras. Sin dependencias, a propósito.
 *
 * Vivían en `analytics.ts`, que importa Supabase y por tanto `next/headers`.
 * Mientras solo las usaba el panel daba igual; en cuanto la página de venta
 * —que se pinta también dentro del editor, que es cliente— pidió `formatMoney`,
 * ese import arrastró medio servidor al navegador y la compilación se cayó.
 */

/** Cifras grandes en formato corto: 1284 → 1,3 K. */
export function formatCount(value: number): string {
  if (value < 1000) return String(value);
  if (value < 1_000_000) {
    const thousands = value / 1000;
    return `${(thousands < 10 ? thousands.toFixed(1) : Math.round(thousands)).toString().replace('.', ',')} K`;
  }
  return `${(value / 1_000_000).toFixed(1).replace('.', ',')} M`;
}

/**
 * El importe se formatea como lo ve el comprador en la app (`$19`), no como lo
 * escribiría un español (`19 US$`). El creador tiene que reconocer sus cifras en
 * los dos sitios, y quien compra desde la página de venta tiene que ver el mismo
 * precio que le aparecerá al pagar.
 */
export function formatMoney(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
