import { createClient, isConfigured } from './supabase';

import type { Block, CourseData, EditorState, Landing, LandingTheme, Lesson } from './landing';
import { DEFAULT_LANDING, DEMO_COURSE, DEMO_LANDING } from './landing';

/**
 * Lo que la página de venta lee de la base de datos.
 *
 * Separado de `landing.ts` porque esto solo puede correr en el servidor —usa
 * cookies— y el editor, que es cliente, necesita el modelo de allí.
 */

export interface PublicPage {
  landing: Landing;
  course: CourseData;
}

/**
 * La página pública, por `handle` y `slug`.
 *
 * Devuelve `null` si no existe o si el curso no está publicado — de eso último
 * se encarga la policy de `course_landings`, no este código: para un visitante
 * sin cuenta el escaparate de un borrador sencillamente no está en la tabla.
 *
 * Sin configuración de Supabase solo responde la del curso de muestra. Es lo que
 * permite mirar la página en desarrollo sin base de datos, y a la vez evita lo
 * que sí sería un problema: que una instalación mal configurada sirviera un
 * curso inventado en cualquier URL.
 */
export async function loadPublicLanding(
  handle: string,
  slug: string
): Promise<PublicPage | null> {
  const supabase = await createClient();

  if (!supabase || !isConfigured) {
    return handle === DEMO_COURSE.handle && slug === DEMO_COURSE.slug
      ? { landing: DEMO_LANDING, course: DEMO_COURSE }
      : null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, handle, display_name, bio, avatar_url, is_verified')
    .eq('handle', handle)
    .maybeSingle();

  if (!profile) return null;

  const { data: course } = await supabase
    .from('courses')
    .select('id, slug, title, summary, price_cents, currency')
    .eq('author_id', profile.id)
    .eq('slug', slug)
    .maybeSingle();

  if (!course) return null;

  const [{ data: landing }, { data: items }] = await Promise.all([
    supabase
      .from('course_landings')
      .select('theme, promise, cta_label, blocks')
      .eq('course_id', course.id)
      .maybeSingle(),
    supabase
      .from('course_items')
      .select('position, is_preview, curiosities (caption, text_body)')
      .eq('course_id', course.id)
      .order('position'),
  ]);

  // Sin escaparate compuesto no hay página que enseñar. Publicar por defecto una
  // plantilla vacía con el título dentro sería peor que un 404: el creador
  // repartiría un enlace creyendo que vende algo.
  if (!landing) return null;

  return {
    landing: {
      theme: landing.theme as LandingTheme,
      promise: landing.promise ?? '',
      ctaLabel: landing.cta_label ?? 'Empezar',
      blocks: (landing.blocks ?? []) as Block[],
    },
    course: {
      handle: profile.handle,
      slug: course.slug ?? slug,
      title: course.title,
      summary: course.summary,
      coverUrl: null,
      priceCents: course.price_cents,
      currency: course.currency ?? 'USD',
      authorName: profile.display_name,
      authorBio: profile.bio,
      authorAvatarUrl: profile.avatar_url,
      isVerified: profile.is_verified,
      lessons: (items ?? []).map(toLesson),
    },
  };
}

/**
 * El título de una lección es el caption de su curiosidad, o su texto si es una
 * entradilla. El caption nunca va quemado en el vídeo, así que siempre hay algo
 * que leer aquí.
 */
function toLesson(item: {
  is_preview: boolean;
  curiosities: unknown;
}): Lesson {
  const curiosity = item.curiosities as { caption: string | null; text_body: string | null } | null;
  return {
    title: curiosity?.caption ?? curiosity?.text_body ?? 'Lección sin título',
    isPreview: item.is_preview,
  };
}

/**
 * Lo que carga el editor.
 *
 * Mismo criterio que `loadOverview` en `analytics.ts`: sin configuración o sin
 * sesión no se inventa nada, se dice. Aquí "decirlo" es enseñar la muestra
 * etiquetada, porque un editor de diseño vacío no se puede ni evaluar.
 */
export async function loadEditorState(): Promise<EditorState> {
  const demo: EditorState = { saveable: false, landing: DEMO_LANDING, course: DEMO_COURSE };

  const supabase = await createClient();
  if (!supabase || !isConfigured) return demo;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return demo;

  // El curso más reciente del creador. Cuando exista la gestión de cursos, la
  // elección vendrá de ahí; mientras tanto no hay ninguna otra forma de elegir.
  const { data: course } = await supabase
    .from('courses')
    .select('id, slug, title, summary, price_cents, currency')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!course) return demo;

  const [{ data: profile }, { data: landing }, { data: items }] = await Promise.all([
    supabase.from('profiles').select('handle, display_name, bio, avatar_url, is_verified').eq('id', user.id).maybeSingle(),
    supabase.from('course_landings').select('theme, promise, cta_label, blocks').eq('course_id', course.id).maybeSingle(),
    supabase
      .from('course_items')
      .select('position, is_preview, curiosities (caption, text_body)')
      .eq('course_id', course.id)
      .order('position'),
  ]);

  return {
    saveable: true,
    landing: landing
      ? {
          theme: landing.theme as LandingTheme,
          promise: landing.promise ?? '',
          ctaLabel: landing.cta_label ?? 'Empezar',
          blocks: (landing.blocks ?? []) as Block[],
        }
      : DEFAULT_LANDING,
    course: {
      handle: profile?.handle ?? '',
      slug: course.slug ?? '',
      title: course.title,
      summary: course.summary,
      coverUrl: null,
      priceCents: course.price_cents,
      currency: course.currency ?? 'USD',
      authorName: profile?.display_name ?? '',
      authorBio: profile?.bio ?? null,
      authorAvatarUrl: profile?.avatar_url ?? null,
      isVerified: profile?.is_verified ?? false,
      lessons: (items ?? []).map(toLesson),
    },
  };
}
