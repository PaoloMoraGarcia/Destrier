/**
 * Anota que ha pasado algo que importa.
 *
 * **No falla nunca y no espera a nadie.** Si no hay analítica cargada —en local,
 * o si el script no llega— no hace nada y la página sigue igual: una medición no
 * puede ser el motivo de que un botón no responda.
 *
 * Los dos que se miden son los dos finales del recorrido, y son los únicos que
 * hay que mirar para saber si la página vende: `agendar` y `solicitud`.
 */
export function medir(evento: 'agendar' | 'solicitud', datos?: Record<string, string>) {
  const p = (window as unknown as { plausible?: (e: string, o?: unknown) => void }).plausible;
  p?.(evento, datos ? { props: datos } : undefined);
}
