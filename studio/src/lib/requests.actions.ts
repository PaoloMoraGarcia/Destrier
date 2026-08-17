'use server';

import { createClient, isConfigured } from './supabase';
import type { ClaveError } from './textos';

/**
 * Recibir una solicitud del formulario de la landing.
 *
 * Es la primera cosa de esta página que **escribe de verdad**. Hasta ahora el
 * formulario era un enlace `mailto`, porque no había dónde recibir nada y la
 * regla era no fingir un envío. Ya hay tabla, así que ya hay envío.
 *
 * **No comprueba quién eres, y no puede.** Quien rellena esto no tiene cuenta:
 * es una persona que entra en la web. Lo que decide qué se puede hacer es la RLS
 * de `0009` — insertar sí, leer no —, y eso lo impone la base de datos, no este
 * archivo.
 *
 * Las comprobaciones de abajo no son la garantía: están para devolver un mensaje
 * que se entienda en vez del error crudo de Postgres, igual que en `saveLanding`.
 */

export interface Solicitud {
  name: string;
  email: string;
  teach: string;
  who: string;
  outcome: string;
}

/**
 * El fallo se devuelve como **clave, no como frase**.
 *
 * La página se sirve en inglés o en español según quien entre, y el idioma se
 * decide al renderizar. Una acción de servidor no sabe nada de eso: devolvía
 * `'Falta tu nombre.'` en español a una página en inglés. Ahora devuelve
 * `'sin-nombre'` y la frase la pone el diccionario del lado que sí conoce el
 * idioma. `sin-configuracion` no está en la lista porque no es un mensaje: es la
 * señal de que hay que caer al enlace de correo.
 */
export interface Enviado {
  ok?: true;
  error?: ClaveError | 'sin-configuracion';
}

/** Lo justo para que un correo sea un correo. La validación de verdad es que
 *  alguien conteste: aquí solo se atajan los dedazos evidentes. */
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Un tope por campo. Sin él, un formulario público es una invitación a que
 *  alguien pegue un megabyte de basura en cada fila. */
const LARGO = 4000;

export async function enviarSolicitud(solicitud: Solicitud): Promise<Enviado> {
  const nombre = solicitud.name.trim();
  const correo = solicitud.email.trim();
  const ensena = solicitud.teach.trim();

  if (!nombre) return { error: 'sin-nombre' };
  if (!CORREO.test(correo)) return { error: 'correo-invalido' };
  if (!ensena) return { error: 'sin-tema' };

  if ([nombre, correo, ensena, solicitud.who, solicitud.outcome].some((c) => c.length > LARGO)) {
    return { error: 'demasiado-largo' };
  }

  // Sin configuración no hay a dónde escribir. Se devuelve el aviso y la
  // interfaz cae al `mailto`, que es el camino que funcionaba antes y que no se
  // puede romper: sin `.env.local` la página tiene que seguir en pie.
  if (!isConfigured) return { error: 'sin-configuracion' };

  const supabase = await createClient();
  if (!supabase) return { error: 'sin-configuracion' };

  const { error } = await supabase.from('landing_requests').insert({
    name: nombre,
    email: correo,
    teach: ensena,
    who: solicitud.who.trim() || null,
    outcome: solicitud.outcome.trim() || null,
  });

  if (error) {
    // El detalle va al servidor; a quien escribe se le dice algo que pueda usar.
    console.error('landing_requests insert', error);
    return { error: 'fallo' };
  }

  return { ok: true };
}
