import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors } from '@/theme';

/**
 * El único punto del código que sabe qué es "Liquid Glass".
 *
 * En iOS 26 usa el material del sistema (`UIGlassEffect` vía expo-glass-effect),
 * que es el de verdad: refracta y reacciona al contenido de debajo. En cualquier
 * otro sitio — Android, iOS anterior, web — cae a un blur con tinte y un borde
 * especular de 1px, que es lo más cerca que se puede estar sin API nativa.
 *
 * Ninguna pantalla debería importar `BlurView` ni `GlassView` directamente: si
 * un día cambia la implementación del material, tiene que cambiar aquí y en
 * ningún otro archivo.
 */

export type GlassVariant = 'panel' | 'card';

interface GlassSurfaceProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * `panel` va anclado al borde inferior de la pantalla (el panel de interacción
   * del feed) y solo lleva filo en el lado que mira al contenido.
   * `card` flota y lleva filo completo.
   */
  variant?: GlassVariant;
  /** Intensidad del fallback de blur. Ignorada cuando hay Liquid Glass nativo. */
  intensity?: number;
}

export const hasNativeLiquidGlass = isLiquidGlassAvailable();

export function GlassSurface({
  children,
  style,
  variant = 'card',
  intensity = 42,
}: GlassSurfaceProps) {
  // El velo es lo que hace legible el panel, y no es opcional: el material del
  // sistema toma su claridad de lo que tiene detrás, así que sobre una entradilla
  // de fondo blanco el cristal se vuelve blanco y el texto blanco desaparece. El
  // velo garantiza el contraste sin renunciar a la refracción ni al especular.
  const scrim = <View style={[StyleSheet.absoluteFill, styles.scrim]} pointerEvents="none" />;

  if (hasNativeLiquidGlass) {
    return (
      <GlassView
        style={[styles.base, style]}
        glassEffectStyle="regular"
        colorScheme="dark"
        isInteractive={false}>
        {scrim}
        {children}
      </GlassView>
    );
  }

  // El filo va en el propio contenedor y no en una capa absoluta, para que herede
  // el borderRadius que llegue por `style` sin tener que duplicarlo.
  return (
    <View
      style={[styles.base, variant === 'panel' ? styles.panelStroke : styles.cardStroke, style]}>
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      {scrim}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  scrim: {
    backgroundColor: colors.glass.scrim,
  },
  cardStroke: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glass.stroke,
  },
  panelStroke: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.glass.stroke,
  },
});
