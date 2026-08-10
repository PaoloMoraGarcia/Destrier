import type { Metadata } from 'next';
import { IBM_Plex_Mono, Special_Gothic_Expanded_One } from 'next/font/google';

import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { createClient } from '@/lib/supabase';

import './globals.css';

const gothic = Special_Gothic_Expanded_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-gothic',
});

const plexMono = IBM_Plex_Mono({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-plex-mono',
});

export const metadata: Metadata = {
  title: 'Bihapia Studio',
  description: 'Gestiona tus cursos, revisa tus datos y edita tu perfil.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  return (
    // Las variables de las fuentes van en <html> y no en <body>: los tokens de
    // `@theme` viven en `:root`, y desde ahí no se ve una variable declarada un
    // nivel más abajo. Puestas en el body, `var(--font-gothic)` resuelve a nada
    // y todo cae a la fuente del sistema sin avisar.
    <html lang="es" className={`${gothic.variable} ${plexMono.variable}`}>
      <body className="antialiased">
        <Header email={user?.email} />

        {/* Cabecera fija arriba, y debajo la fila de navegación y contenido. */}
        <div className="flex min-h-[calc(100vh-4rem)]">
          <Sidebar />
          <main className="flex-1 bg-canvas px-8 py-8">
            <div className="mx-auto max-w-5xl">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
