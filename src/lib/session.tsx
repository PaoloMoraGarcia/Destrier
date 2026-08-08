import { Session } from '@supabase/supabase-js';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { getSupabase, isSupabaseConfigured } from './supabase';

/**
 * La sesión del usuario.
 *
 * Deliberadamente **opcional**: el §2 dice que la curiosidad es el motor de
 * descubrimiento y no lleva fricción, así que el feed se ve entero sin cuenta.
 * La sesión solo hace falta para lo que deja rastro — dar like, guardar, comprar
 * o publicar. Poner un muro de registro en la puerta sería romper el producto.
 */

interface SessionValue {
  session: Session | null;
  /** Todavía no se sabe si hay sesión guardada. */
  loading: boolean;
  signedIn: boolean;
  /** Envía el código de acceso al correo. */
  requestCode: (email: string) => Promise<void>;
  /** Verifica el código y abre sesión. */
  verifyCode: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = isSupabaseConfigured ? getSupabase() : null;

    if (!supabase) {
      // Sin credenciales la app funciona con datos de prueba y sin cuenta.
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      session,
      loading,
      signedIn: session !== null,

      async requestCode(email: string) {
        const supabase = requireSupabase();
        const { error } = await supabase.auth.signInWithOtp({
          email,
          // Se registra al vuelo: no hay pantalla de "crear cuenta" aparte.
          // El perfil lo crea el trigger de 0004.
          options: { shouldCreateUser: true },
        });
        if (error) throw new Error(error.message);
      },

      async verifyCode(email: string, code: string) {
        const supabase = requireSupabase();
        const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
        if (error) throw new Error(error.message);
      },

      async signOut() {
        const supabase = requireSupabase();
        await supabase.auth.signOut();
      },
    }),
    [session, loading]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession fuera de SessionProvider');
  }
  return value;
}

function requireSupabase() {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error(
      'No hay credenciales de Supabase. Copia .env.example a .env.local y rellénalas.'
    );
  }
  return supabase;
}
