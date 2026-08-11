import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Refresca la sesión en cada petición.
 *
 * Hace falta de verdad, no es un adorno: el token de acceso de Supabase dura una
 * hora. Un Server Component **no puede escribir cookies**, así que sin este
 * middleware nadie renovaría el token y la sesión se caería sola sin forma de
 * recuperarse salvo volviendo a entrar. `lib/supabase.ts` ya daba por hecho que
 * esto existía; ahora existe.
 *
 * `getUser()` parece una llamada de más y es justo lo contrario: es lo que
 * dispara la renovación y la escritura de la cookie nueva. Sin esa línea el
 * middleware no serviría para nada.
 */
export async function middleware(request: NextRequest) {
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
