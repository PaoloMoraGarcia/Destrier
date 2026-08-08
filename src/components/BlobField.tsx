import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { blobPalette } from '@/theme';

/**
 * Fondo del splash (§6.1): manchas de color muy difuminadas en deriva lenta,
 * cubiertas por una capa de blur y saturación.
 *
 * `progress` (0 → 1) es el mismo valor que conduce el gesto de swipe: viaja la
 * paleta de fría (morado / verde / azul) a cálida (ámbar). Un solo shared value
 * gobierna color, deriva y capas, así que todo se mueve en sincronía sin pasar
 * por el hilo de JS.
 */

interface BlobSpec {
  /** Posición como fracción del ancho / alto de pantalla. */
  x: number;
  y: number;
  /** Diámetro como fracción del ancho de pantalla. */
  size: number;
  /** Amplitud y periodo de la deriva. */
  driftX: number;
  driftY: number;
  periodMs: number;
}

const BLOBS: BlobSpec[] = [
  { x: 0.18, y: 0.22, size: 0.95, driftX: 40, driftY: -28, periodMs: 9000 },
  { x: 0.78, y: 0.3, size: 0.8, driftX: -34, driftY: 36, periodMs: 11000 },
  { x: 0.32, y: 0.68, size: 1.05, driftX: 28, driftY: 30, periodMs: 13000 },
  { x: 0.85, y: 0.78, size: 0.7, driftX: -24, driftY: -34, periodMs: 10000 },
  { x: 0.5, y: 0.46, size: 0.62, driftX: 18, driftY: 22, periodMs: 15000 },
];

interface BlobFieldProps {
  progress: SharedValue<number>;
}

export function BlobField({ progress }: BlobFieldProps) {
  const { width, height } = useWindowDimensions();

  return (
    <Animated.View style={StyleSheet.absoluteFill} pointerEvents="none">
      {BLOBS.map((spec, index) => (
        <Blob
          key={index}
          spec={spec}
          index={index}
          progress={progress}
          width={width}
          height={height}
        />
      ))}

      {/*
        Estas dos capas hacen de "blur + saturación" del §6.1. React Native no
        tiene backdrop-filter: saturate(), así que la saturación se finge con un
        gradiente tenue por encima del blur.
      */}
      <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.75)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

function Blob({
  spec,
  index,
  progress,
  width,
  height,
}: {
  spec: BlobSpec;
  index: number;
  progress: SharedValue<number>;
  width: number;
  height: number;
}) {
  const drift = useSharedValue(0);

  useEffect(() => {
    // -1 → 1 en bucle con ida y vuelta: la deriva nunca "salta" al reiniciar.
    drift.value = withRepeat(
      withTiming(1, { duration: spec.periodMs, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [drift, spec.periodMs]);

  const diameter = width * spec.size;

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [blobPalette.cold[index % blobPalette.cold.length], blobPalette.warm[index % blobPalette.warm.length]]
    ),
    transform: [
      { translateX: drift.value * spec.driftX },
      { translateY: drift.value * spec.driftY },
      // Al calentarse, los blobs se juntan y crecen un poco: la pantalla se
      // "condensa" hacia el eslogan en vez de quedarse quieta.
      { scale: 1 + progress.value * 0.12 },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.blob,
        {
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          left: width * spec.x - diameter / 2,
          top: height * spec.y - diameter / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    opacity: 0.85,
  },
});
