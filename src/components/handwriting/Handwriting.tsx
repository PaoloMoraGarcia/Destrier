import { useMemo } from 'react';
import Animated, { SharedValue, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { measurePath } from './measurePath';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface Stroke {
  /** Trazado en coordenadas del viewBox. Solo `M` y `C` absolutas. */
  d: string;
  /**
   * Tramo del progreso global en el que se dibuja este trazo, de 0 a 1. Permite
   * que los puntos de las íes caigan después de la palabra, como al escribir a
   * mano de verdad.
   */
  from: number;
  to: number;
}

interface HandwritingProps {
  strokes: Stroke[];
  /** 0 = nada escrito, 1 = escrito del todo. */
  progress: SharedValue<number>;
  viewBox: string;
  color: string;
  strokeWidth: number;
  width: number;
  height: number;
}

/**
 * Escritura a mano de verdad: el trazo se va dibujando por donde iría la punta
 * del bolígrafo.
 *
 * La técnica es `strokeDasharray` con un único hueco tan largo como el trazo, y
 * un `strokeDashoffset` que se reduce: lo que se ve crecer es la propia línea,
 * no una máscara que descubre algo ya dibujado. Es la diferencia entre escribir
 * y aparecer, y se nota.
 *
 * Por eso el wordmark no es tipografía: una fuente da contornos cerrados, y
 * animar el contorno de una letra dibuja su silueta, no su trazo. Hace falta
 * lettering de línea única.
 */
export function Handwriting({
  strokes,
  progress,
  viewBox,
  color,
  strokeWidth,
  width,
  height,
}: HandwritingProps) {
  const measured = useMemo(
    () => strokes.map((stroke) => ({ ...stroke, length: measurePath(stroke.d) })),
    [strokes]
  );

  return (
    <Svg viewBox={viewBox} width={width} height={height}>
      {measured.map((stroke, index) => (
        <StrokeLine
          key={index}
          stroke={stroke}
          progress={progress}
          color={color}
          strokeWidth={strokeWidth}
        />
      ))}
    </Svg>
  );
}

function StrokeLine({
  stroke,
  progress,
  color,
  strokeWidth,
}: {
  stroke: Stroke & { length: number };
  progress: SharedValue<number>;
  color: string;
  strokeWidth: number;
}) {
  const animatedProps = useAnimatedProps(() => {
    const span = stroke.to - stroke.from;
    const local = span <= 0 ? 1 : (progress.value - stroke.from) / span;
    const clamped = Math.min(Math.max(local, 0), 1);

    // Un pelo de más para que el final del trazo no se quede corto por el
    // redondeo del muestreo.
    return { strokeDashoffset: stroke.length * (1 - clamped) + 0.5 };
  });

  return (
    <AnimatedPath
      d={stroke.d}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      strokeDasharray={[stroke.length + 1, stroke.length + 1]}
      animatedProps={animatedProps}
    />
  );
}
