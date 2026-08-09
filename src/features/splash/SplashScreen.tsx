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

import { RevealText } from '@/components/type/RevealText';
import {
  colors,
  duration,
  easeInOutCupertino,
  fonts,
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

const WORDMARK = ['bi&hapia'];

/**
 * El corte de línea del eslogan va a mano.
 *
 * Dejarlo al ajuste automático repartiría las palabras por ancho disponible, sin
 * mirar dónde respira la frase. Estos tres cortes mantienen las unidades de
 * sentido: quién, qué, y el remate.
 */
const TAGLINE = ['Be happy about', 'the things', "you don't know."];

/**
 * Splash de Bihapia (§6).
 *
 * Tinta negra sobre blanco. El wordmark va en Special Gothic Expanded One, en
 * hueco, y se escribe letra a letra; el eslogan en IBM Plex Mono, y lo escribe
 * el dedo mientras arrastra.
 *
 * El gesto tiene doble función (§6.3): revela el eslogan y transiciona al feed.
 * Por debajo del 40 % vuelve a su sitio; por encima, se completa.
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
        swipe.value = withSpring(0, snapBackSpring);
        return;
      }

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

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(swipe.value, [0.06, 0.3], [0, 1], 'clamp'),
  }));

  const hintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(swipe.value, [0, 0.2], [1, 0], 'clamp'),
  }));

  // La grotesca es muy ancha: el cuerpo sale del ancho de pantalla, no de un
  // número fijo, o en un móvil pequeño el wordmark se sale por los lados.
  const wordmarkSize = Math.round(width * 0.135);
  const taglineSize = Math.round(width * 0.052);

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.root}>
        {/* Única pantalla clara de la app: la barra va en oscuro solo aquí. */}
        <StatusBar style="dark" />

        <Animated.View style={wordmarkStyle}>
          <RevealText
            lines={WORDMARK}
            fontFamily={fonts.wordmark}
            fontSize={wordmarkSize}
            color={colors.text.onLight}
            progress={written}
            outlined
            strokeWidth={Math.max(wordmarkSize * 0.028, 1.4)}
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
          <RevealText
            lines={TAGLINE}
            fontFamily={fonts.mono}
            fontSize={taglineSize}
            color={colors.text.onLight}
            progress={tagline}
            lineHeight={1.6}
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
