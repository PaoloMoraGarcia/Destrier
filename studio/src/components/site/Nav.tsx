'use client';

import Link from 'next/link';

import { EASE } from './motion';

/**
 * La navegación en cápsula.
 *
 * Flota sobre el contenido y va segmentada: cada enlace en su celda, separados
 * por un filo. Es lo que hace la referencia, y funciona porque la cápsula tiene
 * su propio fondo — así se lee igual encima de una foto que encima de un bloque
 * de color, sin necesidad de cambiar de tema al pasar por encima.
 */

const LINKS = [
  { href: '#idea', label: 'La idea' },
  { href: '#como', label: 'Cómo es' },
  { href: '#cursos', label: 'Cursos' },
];

export function Nav() {
  return (
    <nav className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-3 p-3 sm:p-4">
      <div className="pointer-events-auto flex items-center overflow-hidden rounded-full bg-[#f0f0ec]">
        <Link
          href="/"
          aria-label="Bihapia, inicio"
          className="grid size-10 shrink-0 place-items-center bg-[#0a0a0a]">
          <span className="block size-3 rounded-[2px] bg-[#f0f0ec]" />
        </Link>

        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="hidden border-l border-[#0a0a0a]/12 px-5 py-2.5 text-sm text-[#0a0a0a] hover:bg-[#0a0a0a]/5 sm:block"
            style={{ transition: `background-color 400ms ${EASE}` }}>
            {link.label}
          </a>
        ))}
      </div>

      <Link
        href="/entrar"
        className="pointer-events-auto flex items-center gap-3 rounded-full bg-[#f0f0ec] py-1.5 pl-5 pr-1.5 text-sm text-[#0a0a0a]"
        style={{ transition: `opacity 400ms ${EASE}` }}>
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
