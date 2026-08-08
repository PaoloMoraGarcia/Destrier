import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BlobField } from '@/components/BlobField';
import { GlassSurface } from '@/components/GlassSurface';
import { Wordmark } from '@/components/Wordmark';
import {
  colors,
  radius,
  snapBackSpring,
  spacing,
  SWIPE_CONFIRM_THRESHOLD,
  timing,
  type,
} from '@/theme';

const TAGLINE = "Be happy about the things you don't know.";

/** Velocidad a partir de la cual un flick corto ya cuenta como confirmación. */
const FLICK_VELOCITY = 900;

/**
 * Splash de Bihapia (§6).
 *
 * Un único `progress` (0 → 1) gobierna la pantalla entera: el viraje de los
 * blobs de frío a cálido, la subida de la tarjeta de cristal con el eslogan, y
 * la salida del wordmark. Vive en el hilo de UI, así que sigue al dedo sin pasar
 * por JS ni un solo frame.
 *
 * El gesto tiene doble función (§6.3): revela el eslogan y transiciona al feed.
 * Por debajo del 40% vuelve a su sitio; por encima, se completa.
 */
export function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const progress = useSharedValue(0);
  const [hintVisible, setHintVisible] = useState(false);

  /** Recorrido del dedo que equivale a un progreso completo. */
  const revealDistance = height * 0.3;

  const goToFeed = useCallback(() => {
    router.replace('/feed');
  }, [router]);

  const showHint = useCallback(() => setHintVisible(true), []);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      progress.value = Math.min(Math.max(event.translationY / revealDistance, 0), 1);
    })
    .onEnd((event) => {
      const confirmed =
        progress.value > SWIPE_CONFIRM_THRESHOLD || event.velocityY > FLICK_VELOCITY;

      if (confirmed) {
        progress.value = withTiming(1, timing.medium, (finished) => {
          if (finished) runOnJS(goToFeed)();
        });
      } else {
        progress.value = withSpring(0, snapBackSpring);
      }
    });

  // El wordmark cede el protagonismo: sube, encoge y se apaga a medida que entra
  // el eslogan. No desaparece del todo hasta el final del recorrido.
  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.75], [1, 0], 'clamp'),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -height * 0.14]) },
      { scale: interpolate(progress.value, [0, 1], [1, 0.84]) },
    ],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.05, 0.45], [0, 1], 'clamp'),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [height * 0.45, 0], 'clamp') },
    ],
  }));

  const hintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.2], [1, 0], 'clamp'),
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.root}>
        <BlobField progress={progress} />

        <Animated.View style={[styles.wordmarkSlot, wordmarkStyle]}>
          <Wordmark onFinished={showHint} />
        </Animated.View>

        {hintVisible && (
          <Animated.View
            style={[styles.hint, { bottom: insets.bottom + spacing.xxxl }, hintStyle]}
            pointerEvents="none">
            <View style={styles.hintChevron} />
            <Text style={styles.hintLabel}>Swipe down</Text>
          </Animated.View>
        )}

        <Animated.View
          style={[styles.cardSlot, { paddingBottom: insets.bottom + spacing.xl }, cardStyle]}
          pointerEvents="none">
          <GlassSurface variant="card" style={styles.card} intensity={55}>
            <Text style={styles.tagline}>{TAGLINE}</Text>
          </GlassSurface>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  wordmarkSlot: {
    alignItems: 'center',
  },
  hint: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing.sm,
  },
  /** Cheurón hacia abajo hecho con un cuadrado rotado: sin dependencia de iconos. */
  hintChevron: {
    width: 12,
    height: 12,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: colors.text.tertiary,
    transform: [{ rotate: '45deg' }],
  },
  hintLabel: {
    ...type.caption,
    color: colors.text.tertiary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  cardSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
  },
  card: {
    borderRadius: radius.xl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  tagline: {
    ...type.title,
    color: colors.text.primary,
    textAlign: 'center',
  },
});
