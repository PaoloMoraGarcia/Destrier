'use client';

/**
 * La navegación, en la franja de arriba de la portada.
 *
 * No va fija: es parte de la portada y se va al bajar, igual que el vídeo. Eso
 * deja limpio el scroll.
 *
 * Las burbujas no llevan sombra en reposo ni estado de `hover` aquí: el
 * material entero, incluido lo que pasa al pasar el cursor, vive en `.bubble`.
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
  { href: '#idea', label: 'The idea' },
  { href: '#path', label: 'A learning path' },
  { href: '#start', label: 'Start with an idea' },
];

export function Nav() {
  return (
    // `w-full`: dentro del marco es un ítem flex, y sin esto se encogería a su
    // contenido — las columnas dejarían de repartir el ancho de la pantalla y
    // el grupo del centro saldría desplazado a la izquierda.
    <nav className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 px-2 sm:px-3">
      <a
        href="#top"
        aria-label="Destrier, home"
        className="bubble grid size-10 shrink-0 place-items-center justify-self-start rounded-full">
        <span className="block size-3 rounded-[2px] bg-[#0a0a0a]" />
      </a>

      <div className="flex items-center gap-2">
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="bubble hidden rounded-full px-5 py-2.5 text-sm text-[#0a0a0a] sm:block">
            {link.label}
          </a>
        ))}
      </div>

      <a
        href="#contact"
        className="bubble flex items-center gap-3 justify-self-end rounded-full py-1.5 pl-5 pr-1.5 text-sm text-[#0a0a0a]">
        <span>Contact</span>
        <span className="grid size-7 place-items-center rounded-full bg-[#0a0a0a]" aria-hidden>
          <svg width="11" height="9" viewBox="0 0 13 11" fill="none">
            <path d="M7.5 1L12 5.5L7.5 10M12 5.5H0" stroke="#f0f0ec" strokeWidth="1.5" />
          </svg>
        </span>
      </a>
    </nav>
  );
}
