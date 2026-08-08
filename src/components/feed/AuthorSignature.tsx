import { StyleSheet, Text } from 'react-native';
import Animated, { interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { spacing, type } from '@/theme';
import { Author } from '@/types/domain';

interface AuthorSignatureProps {
  author: Author;
  /** Color de texto de la tarjeta; la firma hereda su contraste. */
  color: string;
  revealed: SharedValue<number>;
}

/**
 * Firma que aparece al tocar una entradilla de texto.
 *
 * Aquí no hay hoja blanca que abrir: la tarjeta ya es una superficie plana con
 * su texto. Tocarla solo revela de quién es. Mantener el mismo gesto que en los
 * reels, con la respuesta que cada formato pide.
 */
export function AuthorSignature({ author, color, revealed }: AuthorSignatureProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(revealed.value, [0.35, 1], [0, 0.45], 'clamp'),
    transform: [{ translateY: interpolate(revealed.value, [0.35, 1], [8, 0], 'clamp') }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="none">
      <Text style={[styles.label, { color }]}>{author.displayName}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.xxxl,
    alignItems: 'center',
  },
  label: {
    ...type.footnote,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});
