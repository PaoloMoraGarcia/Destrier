import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';
import { VideoCuriosity } from '@/types/domain';

interface VideoCardProps {
  curiosity: VideoCuriosity;
  /** Es la tarjeta que ocupa la pantalla ahora mismo. */
  isActive: boolean;
  /** Está dentro de la ventana de precarga (activa ± 1). */
  shouldLoad: boolean;
}

/**
 * Reel de vídeo a sangre completa (§7).
 *
 * Sin overlay de ningún tipo: ni caption, ni nombre, ni contadores. La decisión
 * de eliminar el caption quemado se tomó a nivel de producto y no se sustituyó
 * por uno nativo — todo el texto vive en el panel que sube al tocar.
 */
export function VideoCard({ curiosity, isActive, shouldLoad }: VideoCardProps) {
  // El source es null fuera de la ventana de precarga: el reproductor existe pero
  // no descarga nada. Sin esto, un feed de 50 vídeos abre 50 conexiones.
  const player = useVideoPlayer(shouldLoad ? curiosity.videoUrl : null, (instance) => {
    instance.loop = true;
    instance.muted = false;
  });

  useEffect(() => {
    if (!shouldLoad) return;

    if (isActive) {
      player.play();
    } else {
      player.pause();
      // Volver a una tarjeta ya vista debe empezarla de nuevo, no retomarla.
      player.currentTime = 0;
    }
  }, [isActive, shouldLoad, player]);

  return (
    <View style={styles.container}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="cover"
        nativeControls={false}
        fullscreenOptions={{ enable: false }}
        allowsPictureInPicture={false}
        playsInline
      />
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
    backgroundColor: colors.background,
  },
});
