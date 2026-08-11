import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { createClient } from '@/lib/supabase';

/** El armazón del panel: cabecera blanca, navegación lateral y lienzo gris. */
export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

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
