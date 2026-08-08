import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { Curiosity } from '@/types/domain';

import { MOCK_FEED } from './mock';

/**
 * Única puerta de entrada del feed a los datos.
 *
 * Mientras no haya credenciales de Supabase sirve los datos de prueba, así que
 * la app es demostrable el día uno. Cuando las haya, la pantalla no cambia una
 * línea: solo cambia lo que devuelve esta función.
 */

export interface FeedPage {
  items: Curiosity[];
  /** Cursor para la siguiente página; `null` cuando no hay más. */
  nextCursor: string | null;
}

const PAGE_SIZE = 10;

export async function fetchFeedPage(cursor?: string | null): Promise<FeedPage> {
  if (!isSupabaseConfigured) {
    return fetchMockPage(cursor);
  }

  const supabase = getSupabase();
  if (!supabase) return fetchMockPage(cursor);

  // TODO: sustituir por la consulta real contra `curiosities` una vez creado el
  // proyecto de Supabase y generados los tipos con `supabase gen types`.
  // El feed rankeado (promociones del §3, señales de interés) es trabajo aparte:
  // aquí solo debería quedar la llamada, no la lógica de ranking.
  throw new Error(
    'feedRepository: falta implementar la consulta de Supabase. Ver supabase/migrations/0001_init.sql.'
  );
}

function fetchMockPage(cursor?: string | null): FeedPage {
  const start = cursor ? Number(cursor) : 0;
  const items = MOCK_FEED.slice(start, start + PAGE_SIZE);
  const next = start + PAGE_SIZE;

  return {
    items,
    nextCursor: next < MOCK_FEED.length ? String(next) : null,
  };
}
