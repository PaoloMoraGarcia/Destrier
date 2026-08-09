import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
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
        // En web el enlace del correo devuelve al usuario con el token en la
        // URL, y hay que recogerlo de ahí o la sesión se pierde. En móvil no
        // hay barra de direcciones y el token llega por el propio flujo, así
        // que buscarlo en la URL no tiene sentido.
        detectSessionInUrl: Platform.OS === 'web',
      },
    });
  }

  return client;
}
