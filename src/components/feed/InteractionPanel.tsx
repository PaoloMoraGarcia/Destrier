import { Ionicons } from '@expo/vector-icons';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { GlassSurface } from '@/components/GlassSurface';
import { colors, radius, spacing, type } from '@/theme';
import { CourseRef, Curiosity } from '@/types/domain';

interface InteractionPanelProps {
  curiosity: Curiosity;
  /** 0 = oculto, 1 = visible. Lo conduce el tap sobre la tarjeta. */
  revealed: SharedValue<number>;
  bottomInset: number;
}

/**
 * APARCADO — no está montado en ninguna pantalla ahora mismo.
 *
 * El tap del feed dejó de subir este panel: ahora abre una hoja blanca desde el
 * centro con el caption (ver `CaptionOverlay`). Queda pendiente decidir dónde
 * viven los likes, comentarios, guardar y el CTA "ver curso completo", que son
 * las piezas que este componente ya resuelve.
 *
 * No lo borres hasta que esa decisión esté tomada: aquí está el formato de
 * contadores, el badge de verificado y el CTA con precio ya resueltos.
 */
export function InteractionPanel({ curiosity, revealed, bottomInset }: InteractionPanelProps) {
  const panelHeight = useSharedValue(320);

  const handleLayout = (event: LayoutChangeEvent) => {
    panelHeight.value = event.nativeEvent.layout.height;
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: revealed.value,
    transform: [{ translateY: (1 - revealed.value) * panelHeight.value }],
  }));

  const { author, engagement, course } = curiosity;

  return (
    <Animated.View style={[styles.slot, animatedStyle]} onLayout={handleLayout}>
      <GlassSurface variant="panel" style={[styles.panel, { paddingBottom: bottomInset + spacing.lg }]}>
        <View style={styles.authorRow}>
          <Avatar name={author.displayName} />
          <View style={styles.authorText}>
            <View style={styles.nameLine}>
              <Text style={styles.displayName} numberOfLines={1}>
                {author.displayName}
              </Text>
              {author.isVerified && (
                <Ionicons name="checkmark-circle" size={15} color={colors.amber} />
              )}
            </View>
            <Text style={styles.handle} numberOfLines={1}>
              @{author.handle}
            </Text>
          </View>
          <Pressable style={styles.followButton} accessibilityRole="button">
            <Text style={styles.followLabel}>Follow</Text>
          </Pressable>
        </View>

        <View style={styles.actionsRow}>
          <ActionButton
            icon={engagement.likedByMe ? 'heart' : 'heart-outline'}
            active={engagement.likedByMe}
            count={engagement.likes}
            label="Like"
          />
          <ActionButton icon="chatbubble-outline" count={engagement.comments} label="Comments" />
          <ActionButton
            icon={engagement.savedByMe ? 'bookmark' : 'bookmark-outline'}
            active={engagement.savedByMe}
            count={engagement.saves}
            label="Save"
          />
        </View>

        {course && <CourseCta course={course} />}
      </GlassSurface>
    </Animated.View>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarInitials}>{initials}</Text>
    </View>
  );
}

function ActionButton({
  icon,
  count,
  label,
  active = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  count: number;
  label: string;
  active?: boolean;
}) {
  return (
    <Pressable
      style={styles.action}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${count}`}>
      <Ionicons name={icon} size={22} color={active ? colors.amber : colors.text.primary} />
      <Text style={[styles.actionCount, active && styles.actionCountActive]}>
        {formatCount(count)}
      </Text>
    </Pressable>
  );
}

function CourseCta({ course }: { course: CourseRef }) {
  const priceLabel = course.unlocked
    ? 'Yours'
    : course.priceCents === null
      ? 'Free'
      : formatPrice(course.priceCents, course.currency);

  return (
    <Pressable style={styles.cta} accessibilityRole="button">
      <View style={styles.ctaText}>
        <Text style={styles.ctaTitle} numberOfLines={1}>
          {course.unlocked ? 'Continue the course' : 'See the full course'}
        </Text>
        <Text style={styles.ctaMeta} numberOfLines={1}>
          {course.title} · {course.itemCount} lessons · {priceLabel}
        </Text>
      </View>
      <Ionicons name="arrow-forward" size={18} color={colors.background} />
    </Pressable>
  );
}

/** 1284 → "1.3K". Los contadores exactos no aportan nada a esta escala. */
function formatCount(value: number): string {
  if (value < 1000) return String(value);
  if (value < 1_000_000) {
    const thousands = value / 1000;
    return `${thousands < 10 ? thousands.toFixed(1) : Math.round(thousands)}K`;
  }
  return `${(value / 1_000_000).toFixed(1)}M`;
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  panel: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.glass.tintStrong,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glass.stroke,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    ...type.callout,
    color: colors.text.primary,
  },
  authorText: {
    flex: 1,
    gap: 2,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  displayName: {
    ...type.callout,
    color: colors.text.primary,
    flexShrink: 1,
  },
  handle: {
    ...type.footnote,
    color: colors.text.secondary,
  },
  followButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glass.stroke,
    backgroundColor: colors.glass.tintStrong,
  },
  followLabel: {
    ...type.footnote,
    fontWeight: '600',
    color: colors.text.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.xxl,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionCount: {
    ...type.footnote,
    color: colors.text.secondary,
  },
  actionCountActive: {
    color: colors.amber,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.amber,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  ctaText: {
    flex: 1,
    gap: 2,
  },
  ctaTitle: {
    ...type.callout,
    color: colors.background,
  },
  ctaMeta: {
    ...type.caption,
    color: 'rgba(0, 0, 0, 0.62)',
  },
});
