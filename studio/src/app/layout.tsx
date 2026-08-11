import type { Metadata } from 'next';
import { IBM_Plex_Mono, Instrument_Serif, Special_Gothic_Expanded_One } from 'next/font/google';

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

/**
 * La tercera voz, solo para las frases grandes de la landing.
 *
 * La referencia vive de la tensión entre una sans neutra y una serif editorial;
 * sin esa segunda voz la maqueta se sostiene pero pierde el carácter. Un solo
 * peso, y no toca ni el wordmark ni las monoespaciadas.
 */
const instrument = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-instrument',
});

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
      className={`${gothic.variable} ${plexMono.variable} ${instrument.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
