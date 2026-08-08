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
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);

  // Contenido a sangre: la tarjeta ocupa la pantalla entera, incluidos los safe
  // areas. Los insets solo sirven para colocar el panel, no para recortar.
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
        bottomInset={insets.bottom}
      />
    ),
    [activeIndex, itemHeight, insets.bottom]
  );

  // Una entradilla de fondo claro deja la hora y la batería invisibles si la
  // barra sigue en blanco. El vídeo siempre va en claro: no se puede saber qué
  // hay debajo del notch en cada frame.
  const activeItem = items[activeIndex];
  const statusBarStyle =
    activeItem?.kind === 'text' && isLightBackground(activeItem.backgroundColor)
      ? 'dark'
      : 'light';

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
