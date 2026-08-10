import { createClient, isConfigured } from './supabase';

/**
 * Los datos del creador.
 *
 * Todo sale de las funciones agregadas de `0006_creator_analytics.sql`, que
 * devuelven cuántos y nunca quiénes: las policies de fila esconden las compras y
 * las interacciones incluso al autor del contenido, y abrirlas expondría el
 * rastro de cada persona.
 */

export interface Totals {
  followers: number;
  publishedCourses: number;
  revenueCents: number;
  views: number;
  likes: number;
}

export interface DailyPoint {
  day: string;
  revenueCents: number;
  views: number;
  likes: number;
}

export interface Overview {
  /** Sin sesión o sin configuración no hay nada que contar. */
  available: boolean;
  totals: Totals;
  daily: DailyPoint[];
}

const EMPTY: Totals = {
  followers: 0,
  publishedCourses: 0,
  revenueCents: 0,
  views: 0,
  likes: 0,
};

export async function loadOverview(days = 28): Promise<Overview> {
  const supabase = await createClient();
  if (!supabase || !isConfigured) {
    return { available: false, totals: EMPTY, daily: [] };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { available: false, totals: EMPTY, daily: [] };

  const until = new Date();
  const since = new Date(until);
  since.setDate(since.getDate() - (days - 1));

  const [totalsResult, dailyResult] = await Promise.all([
    supabase.rpc('creator_totals'),
    supabase.rpc('creator_daily', {
      since: since.toISOString().slice(0, 10),
      until: until.toISOString().slice(0, 10),
    }),
  ]);

  const row = totalsResult.data?.[0];

  return {
    available: true,
    totals: row
      ? {
          followers: Number(row.followers),
          publishedCourses: Number(row.published_courses),
          revenueCents: Number(row.revenue_cents),
          views: Number(row.views),
          likes: Number(row.likes),
        }
      : EMPTY,
    daily: (dailyResult.data ?? []).map(
      (point: { day: string; revenue_cents: number; views: number; likes: number }) => ({
        day: point.day,
        revenueCents: Number(point.revenue_cents),
        views: Number(point.views),
        likes: Number(point.likes),
      })
    ),
  };
}

/** Cifras grandes en formato corto: 1284 → 1,3 K. */
export function formatCount(value: number): string {
  if (value < 1000) return String(value);
  if (value < 1_000_000) {
    const thousands = value / 1000;
    return `${(thousands < 10 ? thousands.toFixed(1) : Math.round(thousands)).toString().replace('.', ',')} K`;
  }
  return `${(value / 1_000_000).toFixed(1).replace('.', ',')} M`;
}

/**
 * El importe se formatea como lo ve el comprador en la app (`$19`), no como lo
 * escribiría un español (`19 US$`). El creador tiene que reconocer sus cifras en
 * los dos sitios.
 */
export function formatMoney(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
