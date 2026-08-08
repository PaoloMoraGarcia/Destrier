import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  runOnJS,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors, panelSpring, SWIPE_CONFIRM_THRESHOLD, timing } from '@/theme';
import { Curiosity } from '@/types/domain';

import { ActionSheet } from './ActionSheet';
import { AuthorSignature } from './AuthorSignature';
import { CaptionOverlay } from './CaptionOverlay';
import { TextCard } from './TextCard';
import { VideoCard } from './VideoCard';

/**
 * Profundidad a la que está la publicación. El feed necesita saberlo para dos
 * cosas: de qué color va la barra de estado, y si el scroll debe estar activo.
 */
export type FeedSurface = 'content' | 'caption' | 'actions';

interface FeedItemProps {
  curiosity: Curiosity;
  /** Alto exacto de una pantalla: una publicación = una pantalla. */
  height: number;
  isActive: boolean;
  shouldLoad: boolean;
  bottomInset: number;
  onSurfaceChange?: (surface: FeedSurface) => void;
}

/** Recorrido del dedo que equivale a subir un nivel entero. */
const LEVEL_DISTANCE = 220;
const FLICK_VELOCITY = 900;

const SURFACES: FeedSurface[] = ['content', 'caption', 'actions'];

/**
 * Una publicación del feed y sus dos niveles de profundidad.
 *
 * Todo se gobierna con un único valor, `depth`:
 *
 *   0 — contenido a sangre, sin un solo elemento de interfaz
 *   1 — el caption: hoja blanca desde el centro (reel) o la firma (texto)
 *   2 — la ficha completa, que sube desde abajo
 *
 * Un **tap** alterna entre 0 y 1. Un **arrastre vertical** mueve entre niveles,
 * pero solo está activo a partir del nivel 1: en el nivel 0 el arrastre vertical
 * pertenece al feed, que es donde pasas de una publicación a la siguiente, y dos
 * gestos compitiendo por el mismo eje no se pueden desambiguar.
 *
 * Por eso el arrastre hacia abajo desde el nivel 1 cierra el caption: es la
 * salida natural del modo lectura, sin obligar a un segundo tap.
 */
export function FeedItem({
  curiosity,
  height,
  isActive,
  shouldLoad,
  bottomInset,
  onSurfaceChange,
}: FeedItemProps) {
  const depth = useSharedValue(0);
  const gestureStart = useSharedValue(0);
  const [level, setLevel] = useState(0);

  const captionProgress = useDerivedValue(() => Math.min(depth.value, 1));
  const actionsProgress = useDerivedValue(() => Math.max(depth.value - 1, 0));

  const settle = useCallback(
    (target: number) => {
      setLevel(target);
      onSurfaceChange?.(SURFACES[target]);
    },
    [onSurfaceChange]
  );

  const toggle = useCallback(() => {
    const target = depth.value >= 0.5 ? 0 : 1;
    // Abrir con muelle da cuerpo al gesto; cerrar con muelle hace que la hoja
    // rebote al desaparecer, que se lee como un fallo. Se cierra con curva.
    depth.value = target === 1 ? withSpring(1, panelSpring) : withTiming(0, timing.medium);
    settle(target);
  }, [depth, settle]);

  const pan = Gesture.Pan()
    // Solo desde el nivel 1: en el nivel 0 este eje es del scroll del feed.
    .enabled(level >= 1)
    // Un tap con un temblor de dedo no debe activar el arrastre.
    .activeOffsetY([-14, 14])
    .onBegin(() => {
      gestureStart.value = Math.round(depth.value);
    })
    .onUpdate((event) => {
      const raw = gestureStart.value - event.translationY / LEVEL_DISTANCE;
      depth.value = Math.min(Math.max(raw, 0), 2);
    })
    .onEnd((event) => {
      const base = gestureStart.value;
      const travelled = depth.value - base;
      const flickUp = event.velocityY < -FLICK_VELOCITY;
      const flickDown = event.velocityY > FLICK_VELOCITY;

      let target = base;
      if (travelled > SWIPE_CONFIRM_THRESHOLD || flickUp) target = base + 1;
      else if (travelled < -SWIPE_CONFIRM_THRESHOLD || flickDown) target = base - 1;

      target = Math.min(Math.max(target, 0), 2);
      depth.value = withSpring(target, panelSpring);
      runOnJS(settle)(target);
    });

  // Al salir de pantalla vuelve al nivel 0: recuperar una publicación debe
  // devolverla a su estado limpio, no a como la dejaste.
  useEffect(() => {
    if (!isActive && depth.value !== 0) {
      depth.value = withTiming(0, timing.fast);
      setLevel(0);
    }
  }, [isActive, depth]);

  // FlashList recicla las celdas entre publicaciones, y un shared value es una
  // ref: sobrevive al reciclado. Sin este reset, una tarjeta que nunca has
  // tocado aparece ya abierta porque heredó el estado de la anterior.
  useEffect(() => {
    depth.value = 0;
    setLevel(0);
    onSurfaceChange?.('content');
  }, [curiosity.id, depth, onSurfaceChange]);

  return (
    <GestureDetector gesture={pan}>
      <View style={[styles.container, { height }]}>
        {curiosity.kind === 'video' ? (
          <>
            <VideoCard curiosity={curiosity} isActive={isActive} shouldLoad={shouldLoad} />
            <CaptionOverlay
              caption={curiosity.caption}
              author={curiosity.author}
              revealed={captionProgress}
            />
          </>
        ) : (
          <>
            <TextCard curiosity={curiosity} />
            <AuthorSignature
              author={curiosity.author}
              color={curiosity.foregroundColor}
              revealed={captionProgress}
            />
          </>
        )}

        {/*
          Va sobre el contenido pero bajo la ficha: nada del nivel 1 es
          interactivo, así que el tap tiene que llegar aquí sin competencia; la
          ficha del nivel 2 sí tiene botones y debe ganarle.
        */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={toggle}
          accessibilityRole="button"
          accessibilityLabel="Show post details"
        />

        <ActionSheet
          curiosity={curiosity}
          progress={actionsProgress}
          open={level === 2}
          bottomInset={bottomInset}
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
});
