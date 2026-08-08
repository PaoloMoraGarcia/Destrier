import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSharedValue, withSpring } from 'react-native-reanimated';

import { colors, panelSpring } from '@/theme';
import { Curiosity } from '@/types/domain';

import { InteractionPanel } from './InteractionPanel';
import { TextCard } from './TextCard';
import { VideoCard } from './VideoCard';

interface FeedItemProps {
  curiosity: Curiosity;
  /** Alto exacto de una pantalla: una publicación = una pantalla. */
  height: number;
  isActive: boolean;
  shouldLoad: boolean;
  bottomInset: number;
}

/**
 * Una publicación del feed: la tarjeta a sangre y, encima, el panel que sube al
 * tocar.
 *
 * El gesto de revelar es un **tap** — decisión de producto tomada frente al
 * swipe lateral. Se implementa con `Pressable` y no con `Gesture.Tap()` de
 * gesture-handler porque convive mejor con el scroll de la lista: un tap simple
 * no compite nunca con el arrastre vertical, que es la acción principal.
 */
export function FeedItem({
  curiosity,
  height,
  isActive,
  shouldLoad,
  bottomInset,
}: FeedItemProps) {
  const revealed = useSharedValue(0);

  const toggle = useCallback(() => {
    revealed.value = withSpring(revealed.value > 0.5 ? 0 : 1, panelSpring);
  }, [revealed]);

  // Al salir de pantalla el panel se cierra: volver a una publicación debe
  // devolverla a su estado limpio, no a como la dejaste.
  useEffect(() => {
    if (!isActive && revealed.value !== 0) {
      revealed.value = withSpring(0, panelSpring);
    }
  }, [isActive, revealed]);

  // FlashList recicla las celdas entre publicaciones, y un shared value es una
  // ref: sobrevive al reciclado. Sin este reset, una tarjeta que nunca has
  // tocado aparece con el panel abierto porque lo heredó de la anterior.
  useEffect(() => {
    revealed.value = 0;
  }, [curiosity.id, revealed]);

  return (
    <View style={[styles.container, { height }]}>
      {curiosity.kind === 'video' ? (
        <VideoCard curiosity={curiosity} isActive={isActive} shouldLoad={shouldLoad} />
      ) : (
        <TextCard curiosity={curiosity} />
      )}

      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel="Show post details"
      />

      <InteractionPanel curiosity={curiosity} revealed={revealed} bottomInset={bottomInset} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
});
