'use server';

import { revalidatePath } from 'next/cache';

import type { Landing } from './landing';
import { createClient } from './supabase';

/**
 * Guardar la página de venta.
 *
 * **No comprueba quién eres.** De eso se encargan las policies de `0007`: la
 * escritura solo pasa si el curso es tuyo, y esa decisión la toma la base de
 * datos con la sesión que viaja en la cookie. Repetir aquí la comprobación
 * daría dos sitios donde equivocarse, y el que manda no sería este.
 *
 * Las validaciones de abajo no son la garantía —esa son los `check` del
 * esquema—: están para devolver un mensaje que se entienda en vez del error
 * crudo de Postgres.
 */

export interface SaveResult {
  error?: string;
  savedAt?: number;
}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export async function saveLanding(
  courseId: string,
  landing: Landing,
  slug: string
): Promise<SaveResult> {
  const promise = landing.promise.trim();
  const ctaLabel = landing.ctaLabel.trim();
  const clean = slug.trim().toLowerCase();

  if (promise.length > 140) return { error: 'La promesa no puede pasar de 140 caracteres.' };
  if (ctaLabel.length < 2 || ctaLabel.length > 30) {
    return { error: 'El texto del botón tiene que medir entre 2 y 30 caracteres.' };
  }
  if (clean && (!SLUG.test(clean) || clean.length < 3 || clean.length > 60)) {
    return {
      error: 'La dirección solo admite minúsculas, números y guiones, entre 3 y 60 caracteres.',
    };
  }

  const supabase = await createClient();
  if (!supabase) return { error: 'Falta configurar Supabase en studio/.env.local.' };

  const { error: landingError } = await supabase.from('course_landings').upsert(
    {
      course_id: courseId,
      theme: landing.theme,
      promise: promise || null,
      cta_label: ctaLabel,
      blocks: landing.blocks,
    },
    { onConflict: 'course_id' }
  );

  if (landingError) return { error: landingError.message };

  // La dirección vive en `courses`, no en el escaparate: es identidad del curso,
  // no presentación, y se comparte con todo lo demás que apunte a él.
  if (clean) {
    const { error: slugError } = await supabase
      .from('courses')
      .update({ slug: clean })
      .eq('id', courseId);

    if (slugError) {
      return slugError.code === '23505'
        ? { error: 'Ya tienes otro curso con esa dirección.' }
        : { error: slugError.message };
    }
  }

  // Sin esto la página pública seguiría sirviendo lo anterior desde caché, y el
  // creador vería su cambio en el editor pero no al abrir su propio enlace.
  const { data: profile } = await supabase.auth.getUser().then(async ({ data }) =>
    data.user
      ? supabase.from('profiles').select('handle').eq('id', data.user.id).maybeSingle()
      : { data: null }
  );

  if (profile?.handle && clean) revalidatePath(`/${profile.handle}/${clean}`);

  return { savedAt: Date.now() };
}
