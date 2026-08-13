'use client';

import type { ReactNode } from 'react';

import { EASE, Reveal } from './motion';

/**
 * Las piezas que se repiten por toda la landing.
 *
 * La gramática viene de la referencia: bloques de color a sangre, cada uno con
 * una etiqueta pequeña en monoespaciada arriba y una frase enorme en versales
 * debajo, de medida estrecha y centrada. El ritmo lo dan el color y el aire, no
 * las cajas: en toda la página no hay una sola tarjeta con borde.
 */

/** Un bloque a sangre. El color decide dónde empieza y acaba cada idea. */
export function Band({
  tone = 'bone',
  children,
  className = '',
  id,
}: {
  tone?: 'bone' | 'ink' | 'amber';
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const tones = {
    bone: 'bg-[#f0f0ec] text-[#0a0a0a]',
    ink: 'bg-[#0a0a0a] text-[#f4f4ef]',
    amber: 'bg-[#f5a623] text-[#0a0a0a]',
  };

  return (
    <section id={id} className={`relative w-full ${tones[tone]} ${className}`}>
      {children}
    </section>
  );
}

/**
 * La frase grande.
 *
 * En la tipografía de display de la marca, la misma del wordmark y de
 * `Nothing to chase`. Hubo una serif editorial aquí durante un tiempo y se
 * quitó: la página funciona con **dos voces**, la de display para lo grande y la
 * monoespaciada para etiquetas y datos, que es el sistema que la marca ya tenía.
 *
 * Medida estrecha a propósito —doce o trece caracteres por línea— para que el
 * texto se rompa en bloque y se lea como un cartel, no como un párrafo.
 */
export function Statement({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Reveal
      className={`font-[family-name:var(--font-wordmark)] text-[clamp(2.2rem,6vw,4.5rem)] leading-[0.94] tracking-[-0.03em] ${className}`}
      rise={44}
      span={0.36}>
      {children}
    </Reveal>
  );
}

/** El botón de la referencia: cápsula con la flecha en su propio cuadro. */
export function Cta({
  href,
  children,
  tone = 'ink',
}: {
  href: string;
  children: ReactNode;
  tone?: 'ink' | 'bone' | 'amber';
}) {
  // El disco de la flecha va del color del texto y la flecha del color del
  // botón, así que hay que nombrar los dos: `currentColor` solo da uno.
  const tones = {
    ink: { pill: 'bg-[#0a0a0a] text-[#f4f4ef]', disc: 'bg-[#f4f4ef]', arrow: '#0a0a0a' },
    bone: { pill: 'bg-[#f0f0ec] text-[#0a0a0a]', disc: 'bg-[#0a0a0a]', arrow: '#f0f0ec' },
    amber: { pill: 'bg-[#f5a623] text-[#0a0a0a]', disc: 'bg-[#0a0a0a]', arrow: '#f5a623' },
  };
  const t = tones[tone];

  return (
    <a
      href={href}
      className={`group inline-flex items-center gap-4 rounded-full py-2 pl-7 pr-2 text-sm font-medium ${t.pill}`}
      style={{ transition: `opacity 400ms ${EASE}` }}>
      <span>{children}</span>
      <span className={`grid size-9 place-items-center rounded-full ${t.disc}`} aria-hidden>
        <svg width="13" height="11" viewBox="0 0 13 11" fill="none">
          <path
            d="M7.5 1L12 5.5L7.5 10M12 5.5H0"
            stroke={t.arrow}
            strokeWidth="1.4"
            className="transition-transform duration-500 group-hover:translate-x-[2px]"
          />
        </svg>
      </span>
    </a>
  );
}
