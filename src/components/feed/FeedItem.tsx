import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { colors, panelSpring, timing } from '@/theme';
import { Curiosity } from '@/types/domain';

import { AuthorSignature } from './AuthorSignature';
import { CaptionOverlay } from './CaptionOverlay';
import { TextCard } from './TextCard';
import { VideoCard } from './VideoCard';

interface FeedItemProps {
  curiosity: Curiosity;
  /** Alto exacto de una pantalla: una publicación = una pantalla. */
  height: number;
  isActive: boolean;
  shouldLoad: boolean;
  /**
   * Avisa al feed de si lo revelado está abierto. Hace falta arriba porque la
   * hoja del caption es blanca y la barra de estado tiene que cambiar de color
   * con ella.
   */
  onRevealChange?: (revealed: boolean) => void;
}

/**
 * Una publicación del feed: la tarjeta a sangre y lo que aparece al tocarla.
 *
 * El gesto de revelar es un **tap** — decisión de producto tomada frente al
 * swipe lateral. Se implementa con `Pressable` y no con `Gesture.Tap()` de
 * gesture-handler porque convive mejor con el scroll de la lista: un tap simple
 * no compite nunca con el arrastre vertical, que es la acción principal.
 *
 * Del tap no sale nada desde abajo. En un reel, una hoja blanca se abre desde el
 * centro con el caption; en una entradilla de texto, que ya es una superficie
 * plana con su texto, solo aparece la firma del autor.
 */
export function FeedItem({
  curiosity,
  height,
  isActive,
  shouldLoad,
  onRevealChange,
}: FeedItemProps) {
  const revealed = useSharedValue(0);

  const toggle = useCallback(() => {
    const opening = revealed.value <= 0.5;
    // Abrir con muelle da cuerpo al gesto; cerrar con muelle hace que la hoja
    // rebote al desaparecer, que se lee como un fallo. Se cierra con curva.
    revealed.value = opening ? withSpring(1, panelSpring) : withTiming(0, timing.medium);
    onRevealChange?.(opening);
  }, [revealed, onRevealChange]);

  // Al salir de pantalla se cierra: volver a una publicación debe devolverla a
  // su estado limpio, no a como la dejaste.
  useEffect(() => {
    if (!isActive && revealed.value !== 0) {
      revealed.value = withTiming(0, timing.fast);
      onRevealChange?.(false);
    }
  }, [isActive, revealed, onRevealChange]);

  // FlashList recicla las celdas entre publicaciones, y un shared value es una
  // ref: sobrevive al reciclado. Sin este reset, una tarjeta que nunca has
  // tocado aparece ya abierta porque heredó el estado de la anterior.
  useEffect(() => {
    revealed.value = 0;
    onRevealChange?.(false);
  }, [curiosity.id, revealed, onRevealChange]);

  return (
    <View style={[styles.container, { height }]}>
      {curiosity.kind === 'video' ? (
        <>
          <VideoCard curiosity={curiosity} isActive={isActive} shouldLoad={shouldLoad} />
          <CaptionOverlay
            caption={curiosity.caption}
            author={curiosity.author}
            revealed={revealed}
          />
        </>
      ) : (
        <>
          <TextCard curiosity={curiosity} />
          <AuthorSignature
            author={curiosity.author}
            color={curiosity.foregroundColor}
            revealed={revealed}
          />
        </>
      )}

      {/*
        Va encima de todo: nada de lo que se revela es interactivo, así que el
        segundo tap tiene que llegar aquí sin competencia.
      */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel="Show post details"
      />
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
