/**
 * Tipos de dominio que consume la UI. Son la proyección de las tablas de
 * `supabase/migrations/0001_init.sql`, no un espejo literal: aquí solo está lo
 * que una pantalla necesita pintar.
 */

export type CategorySlug = 'tech-web' | 'business-sales' | 'general-curiosities';

export interface Author {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  /** Verificación KYC aprobada (§4). Solo estos autores pueden cobrar. */
  isVerified: boolean;
}

/** Contador agregado + si el usuario actual ya interactuó. */
export interface EngagementCounts {
  likes: number;
  comments: number;
  saves: number;
  likedByMe: boolean;
  savedByMe: boolean;
}

/** Referencia mínima al curso, para el CTA del panel. */
export interface CourseRef {
  id: string;
  title: string;
  /** null cuando el curso es gratuito. */
  priceCents: number | null;
  currency: string;
  itemCount: number;
  /** El usuario ya tiene acceso (comprado o gratuito). */
  unlocked: boolean;
}

interface CuriosityBase {
  id: string;
  author: Author;
  categorySlug: CategorySlug;
  engagement: EngagementCounts;
  /** Presente solo si la curiosidad pertenece a un curso. */
  course: CourseRef | null;
  createdAt: string;
}

/**
 * Reel de vídeo full-bleed.
 *
 * En reposo no se ve absolutamente nada encima del vídeo. El `caption` no va
 * quemado en el archivo: es un dato que la app pinta al tocar, sobre una hoja
 * blanca que se abre desde el centro.
 */
export interface VideoCuriosity extends CuriosityBase {
  kind: 'video';
  videoUrl: string;
  posterUrl: string | null;
  /** null cuando el creador no puso texto: entonces solo se muestra la firma. */
  caption: string | null;
}

/** Entradilla de solo texto sobre fondo sólido. */
export interface TextCuriosity extends CuriosityBase {
  kind: 'text';
  body: string;
  backgroundColor: string;
  /** Color del texto; se calcula según el contraste del fondo. */
  foregroundColor: string;
}

export type Curiosity = VideoCuriosity | TextCuriosity;
