'use client';

import { useState } from 'react';

import { Landing } from './Landing';
import type { Block, BlockType, EditorState, Landing as LandingData, LandingTheme } from '@/lib/landing';
import { BLOCK_INFO, BLOCK_ORDER, THEMES, emptyBlock } from '@/lib/landing';

/**
 * El editor de la página de venta.
 *
 * A la izquierda los controles, a la derecha la página. La derecha **es** el
 * componente `<Landing>`, el mismo que sirve la ruta pública: no es una
 * representación de cómo quedará, es cómo queda.
 */
export function Editor({ initial }: { initial: EditorState }) {
  const [landing, setLanding] = useState<LandingData>(initial.landing);
  const { course, saveable } = initial;

  const active = new Set(landing.blocks.map((block) => block.type));

  function update(patch: Partial<LandingData>) {
    setLanding((current) => ({ ...current, ...patch }));
  }

  function setBlock(index: number, block: Block) {
    setLanding((current) => ({
      ...current,
      blocks: current.blocks.map((item, i) => (i === index ? block : item)),
    }));
  }

  function toggle(type: BlockType) {
    setLanding((current) =>
      active.has(type)
        ? { ...current, blocks: current.blocks.filter((block) => block.type !== type) }
        : { ...current, blocks: [...current.blocks, emptyBlock(type)] }
    );
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= landing.blocks.length) return;

    setLanding((current) => {
      const blocks = [...current.blocks];
      [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
      return { ...current, blocks };
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
      <div className="space-y-4">
        {!saveable && (
          <p className="rounded-xl border border-dashed border-line bg-amber-soft px-4 py-3 text-xs leading-relaxed text-ink-soft">
            <strong className="font-medium text-ink">Estás viendo un curso de muestra.</strong>{' '}
            Puedes componer y mirar cómo queda, pero no se guarda: falta conectar
            Supabase o iniciar sesión.
          </p>
        )}

        <Panel title="Tema">
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(THEMES) as LandingTheme[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => update({ theme: key })}
                className={`rounded-lg border px-2 py-2.5 text-xs transition-colors ${
                  landing.theme === key
                    ? 'border-ink font-medium text-ink'
                    : 'border-line text-ink-soft hover:border-ink-faint'
                }`}>
                <span
                  className="mb-2 block h-6 w-full rounded"
                  style={{
                    background: THEMES[key].vars['--l-canvas'],
                    boxShadow: `inset 0 0 0 1px ${THEMES[key].vars['--l-line']}, inset 0 -6px 0 -2px ${THEMES[key].vars['--l-accent']}`,
                  }}
                />
                {THEMES[key].label}
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Portada">
          <Field
            label="La promesa"
            hint="Una línea. Qué sabrá hacer quien termine."
            value={landing.promise}
            maxLength={140}
            onChange={(promise) => update({ promise })}
          />
          <Field
            label="Texto del botón"
            value={landing.ctaLabel}
            maxLength={30}
            onChange={(ctaLabel) => update({ ctaLabel })}
          />
        </Panel>

        <Panel title="Bloques" hint={`${landing.blocks.length} activos`}>
          <ul className="space-y-2">
            {landing.blocks.map((block, index) => (
              <li key={`${block.type}-${index}`} className="rounded-lg border border-line px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-xs font-medium text-ink">
                    {BLOCK_INFO[block.type].label}
                  </span>
                  <Arrow direction="up" onClick={() => move(index, -1)} disabled={index === 0} />
                  <Arrow
                    direction="down"
                    onClick={() => move(index, 1)}
                    disabled={index === landing.blocks.length - 1}
                  />
                  <button
                    type="button"
                    onClick={() => toggle(block.type)}
                    className="rounded px-1.5 text-xs text-ink-faint hover:text-ink"
                    aria-label={`Quitar ${BLOCK_INFO[block.type].label}`}>
                    ×
                  </button>
                </div>

                <BlockFields block={block} onChange={(next) => setBlock(index, next)} />
              </li>
            ))}
          </ul>

          {BLOCK_ORDER.filter((type) => !active.has(type)).length > 0 && (
            <div className="mt-4 border-t border-line-soft pt-3">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                Añadir
              </p>
              <div className="flex flex-wrap gap-1.5">
                {BLOCK_ORDER.filter((type) => !active.has(type)).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggle(type)}
                    title={BLOCK_INFO[type].hint}
                    className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-ink hover:text-ink">
                    + {BLOCK_INFO[type].label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Panel>
      </div>

      <Preview>
        <Landing landing={landing} course={course} />
      </Preview>
    </div>
  );
}

/**
 * La ventana de la vista previa.
 *
 * Encoge con `zoom` y no con `transform: scale`. Con `transform` el elemento
 * conserva su tamaño original para el resto de la maquetación, así que hay que
 * compensar a mano con un margen negativo —un número inventado que unas veces
 * corta la página y otras deja un hueco—. `zoom` recalcula la caja de verdad y
 * el scroll acaba justo donde acaba el contenido.
 *
 * Escalar con la tipografía tampoco valdría: los espaciados de Tailwind van en
 * `rem`, que se mide contra la raíz del documento, así que el texto encogería y
 * los márgenes no.
 */
function Preview({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:sticky lg:top-6 lg:self-start">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
        Así se publica
      </p>
      <div
        className="overflow-y-auto overscroll-contain rounded-xl border border-line"
        style={{ height: 'calc(100vh - 11rem)' }}>
        <div style={{ zoom: 0.72 }}>{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Controles
// ---------------------------------------------------------------------------

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-surface p-4">
      <header className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xs font-semibold text-ink">{title}</h2>
        {hint && (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            {hint}
          </span>
        )}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  maxLength,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-ink-soft">{label}</span>
      <input
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-ink"
      />
      {hint && <span className="mt-1 block text-[11px] text-ink-faint">{hint}</span>}
    </label>
  );
}

function Arrow({
  direction,
  onClick,
  disabled,
}: {
  direction: 'up' | 'down';
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'up' ? 'Subir' : 'Bajar'}
      className="rounded px-1 text-xs text-ink-faint transition-colors hover:text-ink disabled:opacity-25 disabled:hover:text-ink-faint">
      {direction === 'up' ? '↑' : '↓'}
    </button>
  );
}

/** Los campos propios de cada bloque. Los que se generan solos no tienen. */
function BlockFields({ block, onChange }: { block: Block; onChange: (block: Block) => void }) {
  if (block.type === 'outcomes') {
    return (
      <div className="mt-2.5 space-y-1.5">
        {block.items.map((item, index) => (
          <input
            key={index}
            value={item}
            placeholder={`Punto ${index + 1}`}
            onChange={(event) =>
              onChange({
                ...block,
                items: block.items.map((value, i) => (i === index ? event.target.value : value)),
              })
            }
            className="w-full rounded border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink outline-none placeholder:text-ink-faint focus:border-ink"
          />
        ))}
        <button
          type="button"
          onClick={() => onChange({ ...block, items: [...block.items, ''] })}
          className="text-[11px] text-ink-faint hover:text-ink">
          + otro punto
        </button>
      </div>
    );
  }

  if (block.type === 'faq') {
    return (
      <div className="mt-2.5 space-y-2.5">
        {block.items.map((item, index) => (
          <div key={index} className="space-y-1.5">
            <input
              value={item.q}
              placeholder="Pregunta"
              onChange={(event) =>
                onChange({
                  ...block,
                  items: block.items.map((value, i) =>
                    i === index ? { ...value, q: event.target.value } : value
                  ),
                })
              }
              className="w-full rounded border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink outline-none placeholder:text-ink-faint focus:border-ink"
            />
            <textarea
              value={item.a}
              placeholder="Respuesta"
              rows={2}
              onChange={(event) =>
                onChange({
                  ...block,
                  items: block.items.map((value, i) =>
                    i === index ? { ...value, a: event.target.value } : value
                  ),
                })
              }
              className="w-full resize-none rounded border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink outline-none placeholder:text-ink-faint focus:border-ink"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange({ ...block, items: [...block.items, { q: '', a: '' }] })}
          className="text-[11px] text-ink-faint hover:text-ink">
          + otra pregunta
        </button>
      </div>
    );
  }

  if (block.type === 'quote') {
    return (
      <div className="mt-2.5 space-y-1.5">
        <textarea
          value={block.text}
          placeholder="Lo que dijo"
          rows={2}
          onChange={(event) => onChange({ ...block, text: event.target.value })}
          className="w-full resize-none rounded border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink outline-none placeholder:text-ink-faint focus:border-ink"
        />
        <input
          value={block.author}
          placeholder="Quién lo dijo"
          onChange={(event) => onChange({ ...block, author: event.target.value })}
          className="w-full rounded border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink outline-none placeholder:text-ink-faint focus:border-ink"
        />
      </div>
    );
  }

  return (
    <p className="mt-1.5 text-[11px] leading-relaxed text-ink-faint">
      {BLOCK_INFO[block.type].hint}
    </p>
  );
}
