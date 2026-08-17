import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Cliente de Supabase para el panel.
 *
 * No sirve el de la app móvil: allí la sesión vive en el almacenamiento del
 * dispositivo, y aquí tiene que viajar en cookies para que el servidor de Next
 * pueda renderizar ya sabiendo quién eres. De ahí `@supabase/ssr`.
 */

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * `false` mientras no haya proyecto de Supabase configurado.
 *
 * La app móvil, cuando le faltan credenciales, cae a datos de prueba. El panel
 * no puede hacer eso: existe para enseñar datos reales, y unos inventados serían
 * peor que ninguno. Así que lo dice y ya está.
 */
export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export async function createClient() {
  if (!isConfigured) return null;

  const store = await cookies();

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(list) {
        // En un Server Component las cookies son de solo lectura. El refresco de
        // sesión lo hace `proxy.ts`, que sí puede escribirlas; aquí se ignora
        // en silencio a propósito.
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* Server Component: lo resuelve `proxy.ts`. */
        }
      },
    },
  });
}
