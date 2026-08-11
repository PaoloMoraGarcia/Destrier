/**
 * La cabecera del panel.
 *
 * Blanca y separada del cuerpo por un filo de un píxel. Lo que de verdad la
 * despega es que el lienzo de debajo es gris: sobre un fondo blanco, una
 * cabecera blanca no se separa de nada por muchos bordes que se le pongan.
 */
import { signOut } from '@/lib/auth.actions';

export function Header({ email }: { email?: string }) {
  const initials = email ? email.slice(0, 2).toUpperCase() : '—';

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-line bg-surface px-6">
      <div className="flex items-baseline gap-3">
        <span className="wordmark text-[26px] leading-none">bi&amp;hapia</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
          Studio
        </span>
      </div>

      <div className="flex items-center gap-3">
        {email && <span className="font-mono text-xs text-ink-soft">{email}</span>}

        {/* Un formulario y no un enlace: salir cambia estado del servidor, y eso
            no se pide con una navegación que el navegador puede precargar. */}
        {email && (
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg px-2 py-1 text-xs text-ink-faint transition-colors hover:text-ink">
              Salir
            </button>
          </form>
        )}

        <div className="grid size-8 place-items-center rounded-full border border-line bg-canvas font-mono text-[11px] text-ink-soft">
          {initials}
        </div>
      </div>
    </header>
  );
}
