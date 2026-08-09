import { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedProps,
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, Rect, Text as SvgText } from 'react-native-svg';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface RevealTextProps {
  /** Cada elemento es una línea. El salto de línea se decide fuera, a mano. */
  lines: string[];
  fontFamily: string;
  fontSize: number;
  color: string;
  /** 0 = nada escrito, 1 = escrito del todo. */
  progress: SharedValue<number>;
  /** Letras huecas: solo contorno, sin relleno. */
  outlined?: boolean;
  strokeWidth?: number;
  letterSpacing?: number;
  /** Separación entre líneas, como múltiplo del cuerpo. */
  lineHeight?: number;
}

/**
 * Texto que se escribe letra a letra.
 *
 * Cada letra se destapa entera antes de que empiece la siguiente: dentro de su
 * turno el descubrimiento ocupa el primer 60 % y el resto es pausa, y esa pausa
 * es lo que hace que se lea como una mano escribiendo en vez de como un barrido
 * continuo.
 *
 * El texto se pinta **de una pieza** y se tapa con una máscara. Partirlo en un
 * elemento por letra sería más fácil de animar, pero rompería el espaciado que
 * la fuente calcula entre pares de caracteres.
 *
 * Va en SVG y no en un `<Text>` normal porque React Native no sabe dibujar
 * texto en hueco, y el contorno es justo lo que define este wordmark.
 */
export function RevealText({
  lines,
  fontFamily,
  fontSize,
  color,
  progress,
  outlined = false,
  strokeWidth = 2,
  letterSpacing = 0,
  lineHeight = 1.15,
}: RevealTextProps) {
  // El ancho de cada línea no se puede saber sin medirlo: ni SVG ni React Native
  // informan del ancho de un texto antes de pintarlo.
  const [widths, setWidths] = useState<Record<number, number>>({});

  const measure = useCallback(
    (index: number) => (event: LayoutChangeEvent) => {
      const measured = Math.ceil(event.nativeEvent.layout.width);
      setWidths((current) =>
        current[index] === measured ? current : { ...current, [index]: measured }
      );
    },
    []
  );

  // Cada línea recibe el tramo de progreso que le toca por número de letras, no
  // por número de líneas: si no, una línea de tres letras tardaría lo mismo que
  // una de veinte y el ritmo se rompería.
  const windows = useMemo(() => {
    const total = lines.reduce((sum, line) => sum + Math.max(line.length, 1), 0);
    let consumed = 0;

    return lines.map((line) => {
      const from = consumed / total;
      consumed += Math.max(line.length, 1);
      return { from, to: consumed / total };
    });
  }, [lines]);

  const rowHeight = fontSize * lineHeight;
  const measuredAll = lines.every((_, index) => widths[index] !== undefined);

  return (
    <View style={styles.container}>
      {/* Reglas invisibles: solo existen para medir el ancho de cada línea. */}
      <View style={styles.ruler} pointerEvents="none">
        {lines.map((line, index) => (
          <Text
            key={index}
            onLayout={measure(index)}
            style={{ fontFamily, fontSize, letterSpacing }}>
            {line}
          </Text>
        ))}
      </View>

      {measuredAll &&
        lines.map((line, index) => (
          <Line
            key={index}
            text={line}
            width={widths[index]}
            height={rowHeight}
            fontFamily={fontFamily}
            fontSize={fontSize}
            letterSpacing={letterSpacing}
            color={color}
            outlined={outlined}
            strokeWidth={strokeWidth}
            progress={progress}
            window={windows[index]}
            index={index}
          />
        ))}
    </View>
  );
}

/** Pesos aproximados: las estrechas ocupan bastante menos que la media. */
function charWeight(character: string): number {
  if ('ilj|!.,\'’:;'.includes(character)) return 0.42;
  if ('ftr'.includes(character)) return 0.66;
  if ('mwMW&@'.includes(character)) return 1.35;
  if (character === ' ') return 0.5;
  return 1;
}

/** Posiciones acumuladas donde termina cada letra, de 0 a 1. */
function letterStops(text: string): number[] {
  const weights = [...text].map(charWeight);
  const total = weights.reduce((sum, weight) => sum + weight, 0) || 1;

  const stops = [0];
  let running = 0;
  for (const weight of weights) {
    running += weight;
    stops.push(running / total);
  }
  return stops;
}

function Line({
  text,
  width,
  height,
  fontFamily,
  fontSize,
  letterSpacing,
  color,
  outlined,
  strokeWidth,
  progress,
  window: slot,
  index,
}: {
  text: string;
  width: number;
  height: number;
  fontFamily: string;
  fontSize: number;
  letterSpacing: number;
  color: string;
  outlined: boolean;
  strokeWidth: number;
  progress: SharedValue<number>;
  window: { from: number; to: number };
  index: number;
}) {
  const stops = useMemo(() => letterStops(text), [text]);
  const clipId = `reveal-${index}-${text.length}`;

  const animatedProps = useAnimatedProps(() => {
    const span = slot.to - slot.from;
    const local = span <= 0 ? 1 : (progress.value - slot.from) / span;
    const clamped = Math.min(Math.max(local, 0), 1);

    const letters = stops.length - 1;
    const position = clamped * letters;
    const current = Math.min(Math.floor(position), letters - 1);

    // Dentro del turno de cada letra: se descubre en el primer 60 % y el resto
    // es pausa. Esa pausa es lo que se percibe como "letra a letra".
    const within = Math.min((position - current) / 0.6, 1);
    const start = stops[current];
    const end = stops[current + 1];
    const fraction = clamped >= 1 ? 1 : start + (end - start) * within;

    return { width: Math.max(fraction * width, 0) };
  });

  // Sitúa la línea base dentro de la caja. Aproximado a propósito: cada familia
  // reparte su altura de forma distinta y esto se afina mirándolo.
  const baseline = fontSize * 0.82;

  return (
    <Svg width={width + strokeWidth * 2} height={height} style={styles.line}>
      <Defs>
        <ClipPath id={clipId}>
          <AnimatedRect x={0} y={0} height={height} animatedProps={animatedProps} />
        </ClipPath>
      </Defs>

      <SvgText
        x={strokeWidth}
        y={baseline}
        fontFamily={fontFamily}
        fontSize={fontSize}
        letterSpacing={letterSpacing}
        fill={outlined ? 'none' : color}
        stroke={outlined ? color : 'none'}
        strokeWidth={outlined ? strokeWidth : 0}
        clipPath={`url(#${clipId})`}>
        {text}
      </SvgText>
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  ruler: {
    position: 'absolute',
    opacity: 0,
  },
  line: {
    overflow: 'visible',
  },
});
