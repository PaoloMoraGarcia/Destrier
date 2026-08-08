import { Easing, WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';

/**
 * Curvas y duraciones compartidas. Existen para que el splash y el feed se
 * muevan con el mismo peso: si cada pantalla inventa su propia animación, la app
 * deja de sentirse de una sola pieza.
 */

/** Curva estándar de iOS. Arranca rápido y frena largo. */
export const easeOutCupertino = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOutCupertino = Easing.bezier(0.65, 0, 0.35, 1);

export const duration = {
  fast: 180,
  medium: 320,
  slow: 560,
  /** Trazo del wordmark del splash. Largo a propósito: es el momento de marca. */
  wordmark: 1400,
} as const;

/** Muelle de los paneles: entra con cuerpo pero sin rebote visible. */
export const panelSpring: WithSpringConfig = {
  damping: 22,
  stiffness: 220,
  mass: 0.9,
  overshootClamping: false,
};

/** Muelle de retorno del gesto cuando no se supera el umbral. */
export const snapBackSpring: WithSpringConfig = {
  damping: 18,
  stiffness: 180,
  mass: 0.8,
};

export const timing = {
  fast: { duration: duration.fast, easing: easeOutCupertino } satisfies WithTimingConfig,
  medium: { duration: duration.medium, easing: easeOutCupertino } satisfies WithTimingConfig,
  slow: { duration: duration.slow, easing: easeOutCupertino } satisfies WithTimingConfig,
};

/**
 * Umbral de confirmación del swipe del splash (§6.3): por debajo del 40% de
 * progreso el gesto se deshace, por encima se completa la transición al feed.
 */
export const SWIPE_CONFIRM_THRESHOLD = 0.4;
