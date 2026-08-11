import { redirect } from 'next/navigation';

import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { createClient, isConfigured } from '@/lib/supabase';

/** El armazón del panel: cabecera blanca, navegación lateral y lienzo gris. */
export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  // Sin sesión no hay panel: no tiene nada que enseñar a quien no ha entrado.
  //
  // Pero solo si hay configuración. Sin `.env.local` no existe sesión posible ni
  // nada a lo que entrar, así que redirigir dejaría el panel inalcanzable y
  // mataría el camino de la muestra — que es justo lo que permite trabajar el
  // diseño sin backend, y lo que `CLAUDE.md` dice que no se puede romper.
  if (isConfigured && !user) redirect('/entrar');

  return (
    <>
      <Header email={user?.email} />

      {/* Cabecera fija arriba, y debajo la fila de navegación y contenido. */}
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 bg-canvas px-8 py-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </>
  );
}
