import type { Metadata } from 'next';
import { IBM_Plex_Mono, Inter_Tight, Special_Gothic_Expanded_One } from 'next/font/google';

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
 * La grotesca de los titulares.
 *
 * La referencia que se está replicando escribe todo —titular, párrafos, nav— en
 * una grotesca neutra y estrecha, del corte de Helvetica Now. Inter Tight es la
 * que más se le acerca de las que se pueden servir sin licencia, y es la
 * variante estrecha: la Inter normal es visiblemente más ancha y el titular
 * partido a los dos lados deja de cuadrar.
 *
 * No sustituye a la gothic expandida: esa sigue siendo el wordmark de la marca y
 * solo se usa ahí.
 */
const interTight = Inter_Tight({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-grotesk',
});

/*
 * Tres voces, y cada una tiene un solo trabajo.
 *
 * Hubo aquí una serif editorial para las frases grandes de la landing. Se quitó:
 * no encajaba y se retiró también su carga — tenerla descargándose sin usarla es
 * peso en cada visita. Lo que hay ahora es la grotesca para leer, la
 * monoespaciada para etiquetas y datos, la gothic expandida solo para el nombre
 *.
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
      className={`${gothic.variable} ${plexMono.variable} ${interTight.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
