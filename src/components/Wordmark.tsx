import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors, duration, easeInOutCupertino, type } from '@/theme';

/**
 * Wordmark del splash (§6.1): "Bihapia" en cursiva, escribiéndose.
 *
 * La animación es un wipe progresivo de izquierda a derecha, no un fade — es la
 * diferencia entre que parezca que alguien lo escribe y que parezca que aparece.
 *
 * Cómo funciona: un `<Text>` invisible fija el tamaño del bloque, y encima se
 * superpone una capa recortada (`overflow: 'hidden'`) cuyo ancho crece de 0 al
 * ancho medido. El texto de dentro lleva ancho fijo, así que la máscara lo va
 * descubriendo en vez de re-maquetarlo letra a letra.
 */

const WORD = 'Bihapia';
/** Aire extra a la derecha: la cursiva se sale de su caja por el trazo final. */
const OVERHANG = 12;

interface WordmarkProps {
  /** Se dispara cuando termina el trazo — el splash lo usa para mostrar la pista. */
  onFinished?: () => void;
}

export function Wordmark({ onFinished }: WordmarkProps) {
  const [textWidth, setTextWidth] = useState(0);
  const reveal = useSharedValue(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    const measured = event.nativeEvent.layout.width;
    if (measured > 0) {
      setTextWidth((current) => (current === 0 ? measured : current));
    }
  };

  useEffect(() => {
    if (textWidth === 0) return;
    reveal.value = withTiming(
      1,
      { duration: duration.wordmark, easing: easeInOutCupertino },
      (finished) => {
        if (finished && onFinished) runOnJS(onFinished)();
      }
    );
  }, [textWidth, reveal, onFinished]);

  const clipStyle = useAnimatedStyle(() => ({
    width: reveal.value * (textWidth + OVERHANG),
  }));

  // La "plumilla": un filo ámbar que acompaña al trazo y se apaga al terminar.
  const nibStyle = useAnimatedStyle(() => ({
    left: reveal.value * (textWidth + OVERHANG) - 2,
    opacity: reveal.value === 0 || reveal.value === 1 ? 0 : 1,
  }));

  return (
    // El onLayout va en el contenedor y no en el <Text>: sobre Text no dispara de
    // forma fiable en todas las plataformas, y sin medida no hay trazo.
    <View style={styles.container} onLayout={handleLayout}>
      {/* Define el tamaño del bloque. Invisible pero maquetado. */}
      <Text style={[type.wordmark, styles.measurer]}>{WORD}</Text>

      {textWidth > 0 && (
        <>
          <Animated.View style={[styles.clip, clipStyle]}>
            <Text style={[type.wordmark, { width: textWidth + OVERHANG }]}>{WORD}</Text>
          </Animated.View>

          <Animated.View style={[styles.nib, nibStyle]} pointerEvents="none">
            <LinearGradient
              colors={['transparent', colors.amberSoft, 'transparent']}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
  measurer: {
    opacity: 0,
  },
  clip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  nib: {
    position: 'absolute',
    top: '18%',
    bottom: '18%',
    width: 3,
  },
});
