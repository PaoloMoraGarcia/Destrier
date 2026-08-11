'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Navegación del panel.
 *
 * Lo que todavía no existe se enseña igual, marcado como pendiente: esconderlo
 * deja al creador sin saber qué va a poder hacer aquí.
 *
 * "Página de venta" tiene sección propia y no cuelga de un curso porque hoy
 * `Cursos` no existe; colgarla de ahí obligaría a construir antes toda la
 * gestión de cursos para poder llegar a ella.
 */
const SECTIONS = [
  { href: '/', label: 'Resumen', ready: true },
  { href: '/pagina', label: 'Página de venta', ready: true },
  { href: '/cursos', label: 'Cursos', ready: false },
  { href: '/perfil', label: 'Perfil', ready: false },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-56 shrink-0 border-r border-line bg-surface px-3 py-6">
      <ul className="space-y-1">
        {SECTIONS.map((section) => {
          const active = pathname === section.href;

          return (
            <li key={section.href}>
              <Link
                href={section.href}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-canvas font-medium text-ink'
                    : 'text-ink-soft hover:bg-canvas hover:text-ink'
                }`}>
                <span>{section.label}</span>
                {!section.ready && (
                  <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
                    pronto
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
