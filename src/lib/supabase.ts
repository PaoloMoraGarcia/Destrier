import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

/**
 * Cliente de Supabase. Devuelve `null` cuando no hay credenciales configuradas,
 * que es el estado del scaffold recién clonado: el feed cae entonces a los datos
 * de prueba en vez de reventar.
 */

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;

  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        // React Native no tiene URL bar: no hay sesión que detectar en la URL.
        detectSessionInUrl: false,
      },
    });
  }

  return client;
}
