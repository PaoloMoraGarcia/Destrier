'use client';

import Link from 'next/link';

import { EASE } from './motion';

/**
 * La navegación en burbujas.
 *
 * Cinco piezas sueltas flotando sobre el contenido, pegadas al borde de arriba.
 * Cada una lleva su propio cristal, y por eso se leen igual encima de la banda
 * clara que encima del vídeo — el material es lo que las hace independientes del
 * fondo, sin tener que cambiar de tema al pasar por encima.
 *
 * El cristal vive entero en la clase `.bubble` de `globals.css`. Aquí no hay ni
 * un `backdrop-filter`: si cambia el material, no se toca este archivo.
 */

const LINKS = [
  { href: '#idea', label: 'La idea' },
  { href: '#como', label: 'Cómo es' },
  { href: '#cursos', label: 'Cursos' },
];

export function Nav() {
  return (
    // Sin `padding-top`: las burbujas tocan el borde superior. Abajo sí queda un
    // filo, que es lo que las separa del wordmark.
    <nav className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-start justify-between gap-2 px-2 pb-3 sm:px-3">
      <div className="flex items-center gap-2">
        <Link
          href="/"
          aria-label="Bihapia, inicio"
          className="bubble pointer-events-auto grid size-10 shrink-0 place-items-center rounded-full">
          <span className="block size-3 rounded-[2px] bg-[#0a0a0a]" />
        </Link>

        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="bubble pointer-events-auto hidden rounded-full px-5 py-2.5 text-sm text-[#0a0a0a] hover:brightness-[1.06] sm:block"
            style={{ transition: `filter 400ms ${EASE}` }}>
            {link.label}
          </a>
        ))}
      </div>

      <Link
        href="/entrar"
        className="bubble pointer-events-auto flex items-center gap-3 rounded-full py-1.5 pl-5 pr-1.5 text-sm text-[#0a0a0a] hover:brightness-[1.06]"
        style={{ transition: `filter 400ms ${EASE}` }}>
        <span>Publicar</span>
        <span className="grid size-7 place-items-center rounded-full bg-[#0a0a0a]" aria-hidden>
          <svg width="11" height="9" viewBox="0 0 13 11" fill="none">
            <path d="M7.5 1L12 5.5L7.5 10M12 5.5H0" stroke="#f0f0ec" strokeWidth="1.5" />
          </svg>
        </span>
      </Link>
    </nav>
  );
}
