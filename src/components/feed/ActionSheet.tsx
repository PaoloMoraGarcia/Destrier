import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { colors, radius, spacing, type } from '@/theme';
import { CourseRef, Curiosity } from '@/types/domain';

interface ActionSheetProps {
  curiosity: Curiosity;
  /** 0 = fuera de pantalla, 1 = subida del todo. */
  progress: SharedValue<number>;
  open: boolean;
  bottomInset: number;
}

/**
 * Ficha completa de una publicación. Sube desde abajo con un segundo gesto,
 * cuando el caption ya está abierto.
 *
 * Sin contadores. Ni likes, ni comentarios, ni guardados: solo botones grandes
 * que cambian de color al pulsarlos. Es una decisión de producto, no un atajo —
 * enseñar cuánta gente ha dado a "me gusta" es exactamente la comparación social
 * que el anti-FOMO quiere evitar. Tú sabes lo que has hecho; no cuántos van
 * ganando.
 */
export function ActionSheet({ curiosity, progress, open, bottomInset }: ActionSheetProps) {
  const [liked, setLiked] = useState(curiosity.engagement.likedByMe);
  const [saved, setSaved] = useState(curiosity.engagement.savedByMe);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.value, [0, 1], [1000, 0], 'clamp') }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.3, 1], [0, 1], 'clamp'),
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.sheet, sheetStyle]}
      pointerEvents={open ? 'auto' : 'none'}>
      <Animated.View style={[styles.content, { paddingBottom: bottomInset + spacing.xl }, contentStyle]}>
        <View style={styles.header}>
          <Text style={styles.author}>{curiosity.author.displayName}</Text>
          <Text style={styles.handle}>@{curiosity.author.handle}</Text>
        </View>

        <View style={styles.actions}>
          <BigButton
            icon={liked ? 'heart' : 'heart-outline'}
            label="Like"
            active={liked}
            onPress={() => setLiked((value) => !value)}
          />
          <BigButton
            icon={saved ? 'bookmark' : 'bookmark-outline'}
            label="Save"
            active={saved}
            onPress={() => setSaved((value) => !value)}
          />
          <BigButton icon="chatbubble-outline" label="Comments" active={false} onPress={() => {}} />
        </View>

        {curiosity.course && <CourseCta course={curiosity.course} />}
      </Animated.View>
    </Animated.View>
  );
}

function BigButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.button, active && styles.buttonActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}>
      <Ionicons
        name={icon}
        size={26}
        color={active ? colors.background : colors.text.primary}
      />
      <Text style={[styles.buttonLabel, active && styles.buttonLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function CourseCta({ course }: { course: CourseRef }) {
  const price = course.unlocked
    ? 'Yours'
    : course.priceCents === null
      ? 'Free'
      : formatPrice(course.priceCents, course.currency);

  return (
    <Pressable style={styles.cta} accessibilityRole="button">
      <Text style={styles.ctaTitle}>
        {course.unlocked ? 'Continue the course' : 'See the full course'}
      </Text>
      <Text style={styles.ctaMeta}>
        {course.title} · {price}
      </Text>
    </Pressable>
  );
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

const styles = StyleSheet.create({
  sheet: {
    // Color plano, no glass: la ficha es una pantalla aparte, no una capa que
    // flota sobre el contenido.
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  header: {
    gap: spacing.xs,
  },
  author: {
    ...type.title,
    color: colors.text.primary,
  },
  handle: {
    ...type.body,
    color: colors.text.secondary,
  },
  actions: {
    gap: spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    height: 68,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glass.stroke,
    backgroundColor: colors.glass.tint,
  },
  buttonActive: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  buttonLabel: {
    ...type.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  buttonLabelActive: {
    color: colors.background,
  },
  cta: {
    height: 68,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.sheet,
    gap: 2,
  },
  ctaTitle: {
    ...type.body,
    fontWeight: '700',
    color: colors.text.onLight,
  },
  ctaMeta: {
    ...type.footnote,
    color: 'rgba(0, 0, 0, 0.55)',
  },
});
