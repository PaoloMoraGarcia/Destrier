import { StyleSheet, Text, View } from 'react-native';

import { spacing, type } from '@/theme';
import { TextCuriosity } from '@/types/domain';

interface TextCardProps {
  curiosity: TextCuriosity;
}

/**
 * Entradilla de solo texto (§7): fondo plano a sangre, texto centrado y nada
 * más. Ni marco, ni comillas decorativas, ni firma — la referencia es el cartel
 * minimalista, no la tarjeta de red social.
 */
export function TextCard({ curiosity }: TextCardProps) {
  return (
    <View style={[styles.container, { backgroundColor: curiosity.backgroundColor }]}>
      <Text style={[styles.body, { color: curiosity.foregroundColor }]}>{curiosity.body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  body: {
    ...type.headline,
    textAlign: 'center',
  },
});
