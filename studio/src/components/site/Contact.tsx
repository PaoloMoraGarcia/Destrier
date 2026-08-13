'use client';

import { useState } from 'react';

import { Reveal } from './motion';
import { EASE } from './motion';

/**
 * El formulario de contacto.
 *
 * **No hay backend, y no se simula uno.** La acción es un enlace `mailto` de
 * verdad con las respuestas ya redactadas: funciona hoy, sin servidor y sin
 * dependencias, y nadie se queda con la sensación de haber enviado algo que no
 * llegó a ninguna parte. Y al ser un enlace se puede copiar y abrir aparte, cosa
 * que un botón que asigna `location` no permite.
 *
 * El día que haya dónde recibirlo, lo único que cambia es a dónde apunta la
 * acción: los campos, el texto y la estética se quedan igual.
 */

const DESTINO = 'hello.destrier@outlook.com';

const CAMPOS = [
  { id: 'name', label: 'Name', tipo: 'text', lineas: 1 },
  { id: 'email', label: 'Email', tipo: 'email', lineas: 1 },
  { id: 'teach', label: 'What do you want to teach?', tipo: 'text', lineas: 3 },
  { id: 'who', label: 'Who is it for?', tipo: 'text', lineas: 2 },
  { id: 'outcome', label: 'What should someone be able to do afterwards?', tipo: 'text', lineas: 3 },
] as const;

type Campo = (typeof CAMPOS)[number]['id'];

export function Contact() {
  const [valores, setValores] = useState<Record<Campo, string>>({
    name: '',
    email: '',
    teach: '',
    who: '',
    outcome: '',
  });

  // El destino se calcula al vuelo y va en un enlace de verdad, no en un
  // manejador que asigne `location`. Así se puede copiar, abrir en otra
  // ventana y comprobar — y no hay un botón que parezca enviar algo.
  //
  // El cuerpo lleva las preguntas delante, para que el correo llegue legible y
  // no como una lista de valores sueltos.
  const cuerpo = CAMPOS.filter((campo) => campo.id !== 'name' && campo.id !== 'email')
    .map((campo) => `${campo.label}\n${valores[campo.id] || '—'}`)
    .join('\n\n');

  const firma = `\n\n—\n${valores.name || 'Someone'}${valores.email ? `\n${valores.email}` : ''}`;
  const asunto = `An idea to teach — ${valores.name || 'no name'}`;

  const mailto = `mailto:${DESTINO}?subject=${encodeURIComponent(
    asunto
  )}&body=${encodeURIComponent(cuerpo + firma)}`;

  return (
    <div className="mx-auto max-w-xl">
      <Reveal className="text-center" rise={28}>
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] opacity-45">Contact</p>
        <p className="mt-8 font-[family-name:var(--font-wordmark)] text-[clamp(1.8rem,5vw,3.2rem)] leading-[1.02] tracking-[-0.03em]">
          Tell us what you want to teach
        </p>
      </Reveal>

      <Reveal className="mt-16" rise={24}>
        <div className="space-y-8">
          {CAMPOS.map((campo) => (
            <label key={campo.id} className="block">
              <span className="mb-3 block font-mono text-[11px] uppercase tracking-[0.16em] opacity-50">
                {campo.label}
              </span>

              {campo.lineas === 1 ? (
                <input
                  type={campo.tipo}
                  value={valores[campo.id]}
                  onChange={(event) =>
                    setValores((v) => ({ ...v, [campo.id]: event.target.value }))
                  }
                  className="w-full border-b border-[#0a0a0a]/20 bg-transparent pb-3 text-[clamp(1rem,1.6vw,1.15rem)] outline-none focus:border-[#0a0a0a]"
                  style={{ transition: `border-color 400ms ${EASE}` }}
                />
              ) : (
                <textarea
                  rows={campo.lineas}
                  value={valores[campo.id]}
                  onChange={(event) =>
                    setValores((v) => ({ ...v, [campo.id]: event.target.value }))
                  }
                  className="w-full resize-none border-b border-[#0a0a0a]/20 bg-transparent pb-3 text-[clamp(1rem,1.6vw,1.15rem)] leading-relaxed outline-none focus:border-[#0a0a0a]"
                  style={{ transition: `border-color 400ms ${EASE}` }}
                />
              )}
            </label>
          ))}

          <div className="pt-6">
            <a
              href={mailto}
              data-mailto
              className="inline-flex items-center gap-4 rounded-full bg-[#0a0a0a] py-2 pl-7 pr-2 text-sm font-medium text-[#f4f4ef]"
              style={{ transition: `opacity 400ms ${EASE}` }}>
              <span>Start with an idea</span>
              <span className="grid size-9 place-items-center rounded-full bg-[#f4f4ef]" aria-hidden>
                <svg width="13" height="11" viewBox="0 0 13 11" fill="none">
                  <path d="M7.5 1L12 5.5L7.5 10M12 5.5H0" stroke="#0a0a0a" strokeWidth="1.4" />
                </svg>
              </span>
            </a>

            <p className="mt-6 text-xs leading-relaxed opacity-45">
              This opens your email app with the answers written. Nothing is sent from here.
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
