import { SupabaseClient } from '@supabase/supabase-js';

import { CategorySlug, CourseRef, Curiosity } from '@/types/domain';

/** Fila tal cual la devuelve la vista `feed_items`. */
export interface FeedRow {
  id: string;
  kind: 'video' | 'text';
  category_slug: CategorySlug;
  caption: string | null;
  text_body: string | null;
  background_color: string | null;
  foreground_color: string | null;
  created_at: string;

  author_id: string;
  author_handle: string;
  author_display_name: string;
  author_avatar_url: string | null;
  author_is_verified: boolean;

  media_path: string | null;
  media_playback_id: string | null;
  media_poster_url: string | null;

  likes: number;
  comments: number;
  saves: number;
  liked_by_me: boolean;
  saved_by_me: boolean;

  course_id: string | null;
  course_title: string | null;
  course_price_cents: number | null;
  course_currency: string | null;
  course_item_count: number | null;
  course_unlocked: boolean;
}

const MEDIA_BUCKET = 'media';

/**
 * Traduce una fila de la vista al tipo que consume la interfaz.
 *
 * Existe como archivo aparte porque es el único punto donde la forma de la base
 * de datos toca la forma de la app: si un día el feed deja de ser una vista y
 * pasa a ser un servicio de ranking, esto es lo único que hay que reescribir.
 */
export function rowToCuriosity(row: FeedRow, supabase: SupabaseClient): Curiosity {
  const author = {
    id: row.author_id,
    handle: row.author_handle,
    displayName: row.author_display_name,
    avatarUrl: row.author_avatar_url,
    isVerified: row.author_is_verified,
  };

  const engagement = {
    likes: row.likes,
    comments: row.comments,
    saves: row.saves,
    likedByMe: row.liked_by_me,
    savedByMe: row.saved_by_me,
  };

  const course: CourseRef | null = row.course_id
    ? {
        id: row.course_id,
        title: row.course_title ?? '',
        priceCents: row.course_price_cents,
        currency: row.course_currency ?? 'USD',
        itemCount: row.course_item_count ?? 0,
        unlocked: row.course_unlocked,
      }
    : null;

  const base = {
    id: row.id,
    author,
    categorySlug: row.category_slug,
    engagement,
    course,
    createdAt: row.created_at,
  };

  if (row.kind === 'video') {
    return {
      ...base,
      kind: 'video',
      videoUrl: resolveMediaUrl(row, supabase),
      posterUrl: row.media_poster_url,
      caption: row.caption,
    };
  }

  return {
    ...base,
    kind: 'text',
    body: row.text_body ?? '',
    backgroundColor: row.background_color ?? '#FFFFFF',
    // La vista lo trae de la base, pero una fila antigua podría no tenerlo.
    foregroundColor: row.foreground_color ?? '#0A0A0A',
  };
}

/**
 * De dónde sale el vídeo.
 *
 * Hoy es una URL pública de Supabase Storage. Cuando el vídeo se mueva a
 * Cloudflare Stream, `media_playback_id` ya está en la fila y el cambio se
 * resuelve aquí: la app no se entera.
 */
function resolveMediaUrl(row: FeedRow, supabase: SupabaseClient): string {
  if (row.media_playback_id) {
    return `https://videodelivery.net/${row.media_playback_id}/manifest/video.m3u8`;
  }

  if (row.media_path) {
    return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(row.media_path).data.publicUrl;
  }

  return '';
}
