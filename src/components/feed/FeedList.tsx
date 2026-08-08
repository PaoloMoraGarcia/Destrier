import { FlashList, ViewToken } from '@shopify/flash-list';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, isLightBackground } from '@/theme';
import { Curiosity } from '@/types/domain';

import { FeedItem, FeedSurface } from './FeedItem';

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
  const [surface, setSurface] = useState<FeedSurface>('content');

  // Contenido a sangre: la tarjeta ocupa la pantalla entera, incluidos los safe
  // areas. Los insets solo colocan el contenido de la ficha.
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
        onSurfaceChange={index === activeIndex ? setSurface : undefined}
      />
    ),
    [activeIndex, itemHeight, insets.bottom]
  );

  // La hora y la batería desaparecen si la barra no acompaña a la superficie que
  // hay debajo. Se puede acabar en claro de dos formas: una entradilla de fondo
  // claro, o la hoja del caption abierta sobre un reel. La ficha es negra, así
  // que en el nivel 2 siempre vuelve a claro.
  const activeItem = items[activeIndex];
  const onLightSurface =
    surface !== 'actions' &&
    ((activeItem?.kind === 'text' && isLightBackground(activeItem.backgroundColor)) ||
      (activeItem?.kind === 'video' && surface === 'caption'));
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
        // En cuanto se abre el caption, el eje vertical deja de ser del feed y
        // pasa a ser del gesto de profundidad. Sin esto, el swipe para abrir la
        // ficha y el swipe para pasar de publicación pelean por el mismo dedo.
        scrollEnabled={surface === 'content'}
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
