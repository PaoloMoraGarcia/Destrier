'use client';

import Link from 'next/link';

import { EASE } from './motion';

/**
 * La navegación, dentro del marco negro de la portada.
 *
 * No va fija: es parte de la portada y se va al bajar, igual que el vídeo. Eso
 * es lo que hace simétrico el gesto —negro al ras del asta arriba, vídeo al ras
 * del rabo abajo— y deja limpio el scroll.
 *
 * **Tres columnas y no `justify-between`.** Con `justify-between` los enlaces
 * quedarían centrados *entre* el logo y el botón, y como esos dos no miden lo
 * mismo, el grupo saldría desplazado. Con `1fr auto 1fr` el centro es el centro
 * de la pantalla.
 *
 * El cristal vive entero en la clase `.bubble` de `globals.css`. Aquí no hay ni
 * un `backdrop-filter`.
 */

const LINKS = [
  { href: '#idea', label: 'La idea' },
  { href: '#como', label: 'Cómo es' },
  { href: '#cursos', label: 'Cursos' },
];

export function Nav() {
  return (
    // `w-full`: dentro del marco es un ítem flex, y sin esto se encogería a su
    // contenido — las columnas dejarían de repartir el ancho de la pantalla y
    // el grupo del centro saldría desplazado a la izquierda.
    <nav className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 px-2 sm:px-3">
      <Link
        href="/"
        aria-label="Bihapia, inicio"
        className="bubble grid size-10 shrink-0 place-items-center justify-self-start rounded-full">
        <span className="block size-3 rounded-[2px] bg-[#0a0a0a]" />
      </Link>

      <div className="flex items-center gap-2">
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="bubble hidden rounded-full px-5 py-2.5 text-sm text-[#0a0a0a] hover:brightness-[1.06] sm:block"
            style={{ transition: `filter 400ms ${EASE}` }}>
            {link.label}
          </a>
        ))}
      </div>

      <Link
        href="/entrar"
        className="bubble flex items-center gap-3 justify-self-end rounded-full py-1.5 pl-5 pr-1.5 text-sm text-[#0a0a0a] hover:brightness-[1.06]"
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
