import { StyleSheet, Text, View } from 'react-native';
import Animated, { interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { colors, spacing, type } from '@/theme';
import { Author } from '@/types/domain';

interface CaptionOverlayProps {
  caption: string | null;
  author: Author;
  /** 0 = oculto, 1 = visible. Lo conduce el tap sobre la tarjeta. */
  revealed: SharedValue<number>;
}

/**
 * Lo que aparece al tocar un reel.
 *
 * No sube nada desde abajo: una hoja blanca opaca se abre **desde el centro**
 * hacia arriba y hacia abajo hasta cubrir la pantalla, y sobre ella entra el
 * caption con la firma del autor. Tocar otra vez la cierra por donde vino.
 *
 * El vídeo queda tapado a propósito. Mientras se lee, no compite.
 */
export function CaptionOverlay({ caption, author, revealed }: CaptionOverlayProps) {
  // La hoja escala en vertical desde su centro, que es el origen por defecto de
  // `transform` en React Native: de ahí sale el efecto de "pintarse desde el
  // medio" sin necesidad de máscaras.
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: revealed.value }],
  }));

  // El texto va en una capa aparte para que la escala de la hoja no lo deforme,
  // y entra cuando la hoja ya está casi abierta.
  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(revealed.value, [0.55, 1], [0, 1], 'clamp'),
    transform: [{ translateY: interpolate(revealed.value, [0.55, 1], [10, 0], 'clamp') }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, styles.sheet, sheetStyle]} />

      <Animated.View style={[StyleSheet.absoluteFill, styles.content, contentStyle]}>
        {caption && <Text style={styles.caption}>{caption}</Text>}
        <Text style={styles.author}>{author.displayName}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.sheet,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.xl,
  },
  caption: {
    ...type.headline,
    color: colors.text.onLight,
    textAlign: 'center',
  },
  author: {
    ...type.footnote,
    color: colors.text.onLight,
    opacity: 0.45,
    textAlign: 'center',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});
