'use server';

import { redirect } from 'next/navigation';

import { createClient } from './supabase';

/**
 * Entrar en el panel.
 *
 * Correo y código de seis cifras, el mismo flujo que la app móvil resuelve en
 * `src/lib/session.tsx`. Comparten proyecto de Supabase, así que compartir el
 * método no es solo coherencia: es literalmente la misma cuenta y el mismo
 * correo, y el creador reconoce lo que le llega.
 *
 * **Sin login social, y es deliberado.** `docs/app-store.md` deja escrito que en
 * cuanto exista Google o Facebook, Sign in with Apple pasa a ser obligatorio en
 * iOS. Mientras el acceso sea un código por correo, esa puerta sigue cerrada.
 *
 * Va en Server Actions y no en un cliente de navegador porque en una acción sí
 * se pueden escribir cookies, así que el `createClient()` que ya existe sirve
 * tal cual. Un segundo cliente de Supabase sería otra cosa que mantener en
 * sintonía sin ganar nada.
 */

export interface AuthResult {
  error?: string;
}

export async function requestCode(email: string): Promise<AuthResult> {
  const address = email.trim().toLowerCase();
  if (!address.includes('@')) return { error: 'Ese correo no parece un correo.' };

  const supabase = await createClient();
  if (!supabase) return { error: 'Falta configurar Supabase en studio/.env.local.' };

  const { error } = await supabase.auth.signInWithOtp({
    email: address,
    // Se registra al vuelo: no hay pantalla de "crear cuenta" aparte. El perfil
    // lo crea el trigger de 0004.
    options: { shouldCreateUser: true },
  });

  return error ? { error: error.message } : {};
}

export async function verifyCode(email: string, code: string): Promise<AuthResult> {
  const supabase = await createClient();
  if (!supabase) return { error: 'Falta configurar Supabase en studio/.env.local.' };

  const { error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: code.trim(),
    type: 'email',
  });

  if (error) return { error: error.message };

  redirect('/panel');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect('/entrar');
}
