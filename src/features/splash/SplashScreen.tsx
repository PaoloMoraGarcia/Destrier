import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Handwriting } from '@/components/handwriting/Handwriting';
import { layoutHandwriting } from '@/components/handwriting/layout';
import {
  WORDMARK_RATIO,
  WORDMARK_STROKES,
  WORDMARK_VIEWBOX,
} from '@/components/handwriting/wordmark';
import {
  colors,
  duration,
  easeInOutCupertino,
  snapBackSpring,
  spacing,
  SWIPE_CONFIRM_THRESHOLD,
  timing,
  type,
} from '@/theme';

/** Velocidad a partir de la cual un flick corto ya cuenta como confirmación. */
const FLICK_VELOCITY = 900;

/** La pista tiene que estar, pero no competir con el trazo. */
const HINT_COLOR = 'rgba(0, 0, 0, 0.34)';

/** El eslogan se compone una vez, al cargar el módulo: no depende de nada. */
const TAGLINE = layoutHandwriting("Be happy about the things you don't know.", {
  maxWidth: 620,
  lineHeight: 140,
});

/**
 * Splash de Bihapia (§6).
 *
 * Fondo negro plano. El wordmark no es tipografía: es lettering de línea única
 * que se escribe trazo a trazo, por donde iría la punta del bolígrafo.
 *
 * El gesto de swipe hacia abajo tiene doble función (§6.3): revela el eslogan y
 * transiciona al feed. Por debajo del 40% vuelve a su sitio; por encima, se
 * completa.
 */
export function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();

  const written = useSharedValue(0);
  const swipe = useSharedValue(0);
  const [hintVisible, setHintVisible] = useState(false);

  // El eslogan se escribe con el dedo: su progreso ES el del gesto. Por eso
  // desdibujarlo no necesita código — es el mismo valor yendo hacia atrás.
  // El arranque va retrasado un poco para que el wordmark tenga tiempo de
  // apartarse antes de que caiga la primera letra.
  const tagline = useDerivedValue(() => interpolate(swipe.value, [0.08, 1], [0, 1], 'clamp'));

  const revealDistance = height * 0.3;

  useEffect(() => {
    written.value = withTiming(
      1,
      { duration: duration.wordmark, easing: easeInOutCupertino },
      (finished) => {
        if (finished) runOnJS(setHintVisible)(true);
      }
    );
  }, [written]);

  const goToFeed = useCallback(() => {
    router.replace('/feed');
  }, [router]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      swipe.value = Math.min(Math.max(event.translationY / revealDistance, 0), 1);
    })
    .onEnd((event) => {
      const confirmed = swipe.value > SWIPE_CONFIRM_THRESHOLD || event.velocityY > FLICK_VELOCITY;

      if (!confirmed) {
        // Al volver, el eslogan se desescribe solo: el trazo retrocede por donde
        // vino, como si se rebobinara la mano.
        swipe.value = withSpring(0, snapBackSpring);
        return;
      }

      // Confirmado: se termina de escribir lo que falte y se entra al feed.
      swipe.value = withTiming(1, timing.slow, (finished) => {
        if (finished) runOnJS(goToFeed)();
      });
    });

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: interpolate(swipe.value, [0, 0.75], [1, 0], 'clamp'),
    transform: [
      { translateY: interpolate(swipe.value, [0, 1], [0, -height * 0.14]) },
      { scale: interpolate(swipe.value, [0, 1], [1, 0.86]) },
    ],
  }));

  // El eslogan no se desvanece hacia dentro: el contenedor está a pleno desde
  // que arranca el gesto, y lo único que aparece es el propio trazo escribiéndose.
  const taglineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(swipe.value, [0.1, 0.4], [0, 1], 'clamp'),
  }));

  const hintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(swipe.value, [0, 0.2], [1, 0], 'clamp'),
  }));

  const wordmarkWidth = width * 0.74;
  const taglineWidth = width * 0.88;

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.root}>
        {/* Única pantalla clara de la app: la barra va en oscuro solo aquí. */}
        <StatusBar style="dark" />

        <Animated.View style={wordmarkStyle}>
          <Handwriting
            strokes={WORDMARK_STROKES}
            progress={written}
            viewBox={WORDMARK_VIEWBOX}
            color={colors.text.onLight}
            strokeWidth={7}
            width={wordmarkWidth}
            height={wordmarkWidth / WORDMARK_RATIO}
          />
        </Animated.View>

        {hintVisible && (
          <Animated.View
            style={[styles.hint, { bottom: insets.bottom + spacing.xxxl }, hintStyle]}
            pointerEvents="none">
            <View style={styles.hintChevron} />
            <Text style={styles.hintLabel}>Swipe down</Text>
          </Animated.View>
        )}

        <Animated.View style={[styles.taglineSlot, taglineStyle]} pointerEvents="none">
          <Handwriting
            strokes={TAGLINE.strokes}
            progress={tagline}
            viewBox={TAGLINE.viewBox}
            color={colors.text.onLight}
            // Más fino que el wordmark a propósito: el eslogan se dibuja mucho
            // más pequeño en pantalla, y con el grosor del wordmark los ojos de
            // las letras cerradas (s, e, o, a) se rellenan y dejan de leerse.
            strokeWidth={5}
            width={taglineWidth}
            height={taglineWidth / TAGLINE.ratio}
          />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // Blanco de cuaderno: tinta negra sobre papel. Es la única pantalla clara de
    // la app, y a propósito — el trazo negro es lo que se tiene que ver.
    backgroundColor: colors.sheet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing.sm,
  },
  hintChevron: {
    width: 12,
    height: 12,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: HINT_COLOR,
    transform: [{ rotate: '45deg' }],
  },
  hintLabel: {
    ...type.caption,
    color: HINT_COLOR,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  taglineSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
    bottom: 0,
  },
});
