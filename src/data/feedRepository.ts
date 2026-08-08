import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { Curiosity } from '@/types/domain';

import { MOCK_FEED } from './mock';
import { FeedRow, rowToCuriosity } from './rowToCuriosity';

/**
 * Única puerta de entrada del feed a los datos.
 *
 * Sin credenciales de Supabase sirve los datos de prueba, así que la app es
 * demostrable recién clonada y se puede trabajar en la interfaz sin backend. Con
 * credenciales lee de la vista `feed_items`, que es donde vive la consulta.
 */

export interface FeedPage {
  items: Curiosity[];
  /** Cursor para la siguiente página; `null` cuando no hay más. */
  nextCursor: string | null;
}

const PAGE_SIZE = 10;

export async function fetchFeedPage(cursor?: string | null): Promise<FeedPage> {
  const supabase = isSupabaseConfigured ? getSupabase() : null;
  if (!supabase) return fetchMockPage(cursor);

  // Paginación por cursor sobre `created_at`, no por offset: con un feed al que
  // se le añaden publicaciones constantemente, un offset repite y se salta
  // elementos en cuanto entra contenido nuevo entre dos páginas.
  let query = supabase
    .from('feed_items')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`No se pudo cargar el feed: ${error.message}`);
  }

  const rows = (data ?? []) as FeedRow[];
  const items = rows.map((row) => rowToCuriosity(row, supabase));

  return {
    items,
    // Solo hay más si la página vino llena. Con menos, se acabó.
    nextCursor: rows.length === PAGE_SIZE ? rows[rows.length - 1].created_at : null,
  };
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
