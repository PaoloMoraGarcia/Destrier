import type { Metadata } from 'next';
import { IBM_Plex_Mono, Special_Gothic_Expanded_One } from 'next/font/google';

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

/*
 * Dos voces y no tres.
 *
 * Hubo aquí una serif editorial para las frases grandes de la landing. Se quitó:
 * la marca funciona con la de display para lo grande y la monoespaciada para
 * etiquetas y datos, y una tercera no encajaba. Se retira también la carga de la
 * fuente — tenerla descargándose sin usarla es peso en cada visita.
 */

export const metadata: Metadata = {
  title: 'Bihapia Studio',
  description: 'Gestiona tus cursos, revisa tus datos y edita tu perfil.',
};

/**
 * Solo el documento y las fuentes.
 *
 * La cabecera y la navegación se mudaron a `(studio)/layout.tsx` porque hay dos
 * productos en este proyecto: el panel del creador, con su armazón, y la página
 * de venta pública, que no lleva ninguno —es la marca del creador, no la del
 * estudio, y una barra lateral de gestión encima sería absurda para quien llega
 * desde un enlace a comprar un curso.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Las variables de las fuentes van en <html> y no en <body>: los tokens de
    // `@theme` viven en `:root`, y desde ahí no se ve una variable declarada un
    // nivel más abajo. Puestas en el body, `var(--font-gothic)` resuelve a nada
    // y todo cae a la fuente del sistema sin avisar.
    <html
      lang="es"
      className={`${gothic.variable} ${plexMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
