import { FlashList, ViewToken } from '@shopify/flash-list';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, isLightBackground } from '@/theme';
import { Curiosity } from '@/types/domain';

import { FeedItem } from './FeedItem';

interface FeedListProps {
  items: Curiosity[];
  onEndReached?: () => void;
}

/**
 * Feed vertical con snap (§7): una publicación ocupa exactamente una pantalla y
 * el scroll se detiene siempre en un borde.
 *
 * Solo la tarjeta activa y sus vecinas inmediatas cargan vídeo. Sin esa ventana,
 * un feed largo abre una conexión por publicación y se cae en cuanto el usuario
 * baja veinte veces.
 */
const PRELOAD_RADIUS = 1;

const viewabilityConfig = {
  itemVisiblePercentThreshold: 80,
  minimumViewTime: 60,
};

export function FeedList({ items, onEndReached }: FeedListProps) {
  const { height: windowHeight } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  // Contenido a sangre: la tarjeta ocupa la pantalla entera, incluidos los safe
  // areas.
  const itemHeight = windowHeight;

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<Curiosity>[] }) => {
      const first = viewableItems[0];
      if (first?.index != null) {
        setActiveIndex(first.index);
      }
    }
  ).current;

  const renderItem = useCallback(
    ({ item, index }: { item: Curiosity; index: number }) => (
      <FeedItem
        curiosity={item}
        height={itemHeight}
        isActive={index === activeIndex}
        shouldLoad={Math.abs(index - activeIndex) <= PRELOAD_RADIUS}
        onRevealChange={index === activeIndex ? setRevealed : undefined}
      />
    ),
    [activeIndex, itemHeight]
  );

  // La hora y la batería desaparecen si la barra sigue en blanco sobre una
  // superficie clara. Hay dos formas de acabar en blanco: una entradilla de
  // fondo claro, o la hoja del caption abierta sobre un reel.
  const activeItem = items[activeIndex];
  const onLightSurface =
    (activeItem?.kind === 'text' && isLightBackground(activeItem.backgroundColor)) ||
    (activeItem?.kind === 'video' && revealed);
  const statusBarStyle = onLightSurface ? 'dark' : 'light';

  return (
    <View style={styles.container}>
      <StatusBar style={statusBarStyle} animated />
      <FlashList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        snapToInterval={itemHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        // FlashList v2 lo trae activado por defecto porque está pensado para
        // interfaces de chat: cuando llega una página nueva, reajusta el scroll
        // para "mantener la posición" y en un feed paginado a pantalla completa
        // eso te teletransporta varias publicaciones. Aquí estorba.
        maintainVisibleContentPosition={{ disabled: true }}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.6}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
