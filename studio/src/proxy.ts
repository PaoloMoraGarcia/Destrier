import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Refresca la sesión en cada petición.
 *
 * Hace falta de verdad, no es un adorno: el token de acceso de Supabase dura una
 * hora. Un Server Component **no puede escribir cookies**, así que sin esto nadie
 * renovaría el token y la sesión se caería sola sin forma de recuperarse salvo
 * volviendo a entrar. `lib/supabase.ts` ya daba por hecho que existía.
 *
 * `getUser()` parece una llamada de más y es justo lo contrario: es lo que
 * dispara la renovación y la escritura de la cookie nueva. Sin esa línea esto no
 * serviría para nada.
 *
 * ## Se llamaba `middleware.ts`
 *
 * En Next 16 el nombre está deprecado: el archivo es `proxy.ts` y la función
 * `proxy`. Es el mismo mecanismo con otro nombre —lo cambiaron para dejar claro
 * que esto es la frontera de red, no un sitio donde meter lógica—, y con una
 * diferencia que sí importa: **`proxy` corre en Node y no admite el runtime
 * `edge`**. Aquí da igual, porque lo único que hace es hablar con Supabase por
 * HTTP; si algún día hiciera falta `edge`, habría que volver al nombre viejo.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sin configuración no hay sesión que refrescar. Se deja pasar en silencio:
  // es el camino de la muestra, que tiene que seguir funcionando.
  if (!url || !anonKey) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list) {
        // Las cookies se escriben en los dos sitios: en la petición para que lo
        // que se renderice a continuación ya vea la sesión nueva, y en la
        // respuesta para que el navegador se la quede.
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Todo menos los archivos que sirve Next por su cuenta. Pasar imágenes y
  // fuentes por aquí sería trabajo desperdiciado en cada petición.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)'],
};
