import { ReactNode } from 'react';

/** Tarjeta blanca sobre el lienzo gris. La unidad de composición del panel. */
export function Card({
  title,
  hint,
  children,
  className = '',
}: {
  title?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-line bg-surface p-5 ${className}`}>
      {title && (
        <header className="mb-4 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {hint && (
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              {hint}
            </span>
          )}
        </header>
      )}
      {children}
    </section>
  );
}

/**
 * Una cifra con su etiqueta.
 *
 * La cifra va en monoespaciada a propósito: es la voz que el resto de la marca
 * usa para los datos, y además evita que los números bailen de ancho al
 * actualizarse.
 */
export function Stat({
  label,
  value,
  foot,
}: {
  label: string;
  value: string;
  foot?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">{label}</p>
      <p className="mt-3 font-mono text-3xl leading-none tracking-tight text-ink">{value}</p>
      {foot && <p className="mt-2 text-xs text-ink-soft">{foot}</p>}
    </div>
  );
}

/**
 * El hueco cuando todavía no hay nada.
 *
 * Se eligió enseñar vacíos honestos en vez de datos inventados: con cifras de
 * mentira el panel se ve bonito y no sirve para nada, porque no puedes fiarte de
 * lo que lees.
 */
export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-canvas/60 px-5 py-10 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}
