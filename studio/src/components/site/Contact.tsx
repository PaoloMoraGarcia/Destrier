'use client';

import { useState, useTransition } from 'react';

import { enviarSolicitud } from '@/lib/requests.actions';
import type { Textos } from '@/lib/textos';

import { Cta } from './Cta';
import { medir } from './medir';
import { EASE, Reveal } from './motion';

/**
 * El formulario de contacto.
 *
 * **Ahora sí hay backend.** Durante mucho tiempo esto fue un enlace `mailto`
 * porque no había dónde recibir nada, y la regla era no fingir un envío. Hay
 * tabla —`landing_requests`, con RLS que deja insertar y no deja leer—, así que
 * el formulario envía de verdad y lo dice.
 *
 * **El `mailto` no se ha ido: es el recambio.** Si falta la configuración de
 * Supabase, el botón vuelve a ser el enlace de correo. Sin `.env.local` la página
 * tiene que seguir en pie, y esa es una regla del proyecto, no una cortesía.
 *
 * ## "What do you want to teach?" no es un campo más
 *
 * Es **el mismo valor que el hueco del titular** de la portada, y por eso no vive
 * aquí sino en `Landing.tsx`: quien escribe arriba se encuentra el formulario ya
 * empezado, y quien lo cambia aquí lo ve cambiar arriba. Los otros cuatro campos
 * sí son de esta pieza y de nadie más.
 */

const DESTINO = 'hello.destrier@outlook.com';

/*
 * La forma de los campos vive aquí y su nombre en `lib/textos.ts`.
 *
 * Lo que no cambia con el idioma —el `id`, el tipo de campo, cuántas líneas
 * ocupa— es estructura y se queda; lo que se lee sale del diccionario. Meter el
 * `label` aquí traducido sería tener media traducción en un componente.
 */
/*
 * `obligatorio` refleja lo que **la acción de servidor ya exige**: nombre, correo
 * y tema (`requests.actions.ts`). No es una regla nueva, es la misma dicha en el
 * navegador.
 *
 * Sin esto el campo vacío no se descubría hasta después de pulsar y esperar el
 * viaje de ida y vuelta, y el mensaje salía abajo, lejos del campo que falla.
 * Marcado, el navegador lo bloquea antes de salir y **lleva el foco al campo**.
 * Los otros dos se quedan opcionales a propósito: cuantos menos campos
 * obligatorios, más formularios enviados.
 */
const CAMPOS = [
  { id: 'name', tipo: 'text', lineas: 1, obligatorio: true },
  { id: 'email', tipo: 'email', lineas: 1, obligatorio: true },
  { id: 'teach', tipo: 'text', lineas: 3, obligatorio: true },
  { id: 'who', tipo: 'text', lineas: 2, obligatorio: false },
  { id: 'outcome', tipo: 'text', lineas: 3, obligatorio: false },
] as const;

type Campo = (typeof CAMPOS)[number]['id'];

export function Contact({
  textos,
  teach,
  alEscribir,
  hayBackend,
}: {
  textos: Textos['contacto'];
  teach: string;
  alEscribir: (valor: string) => void;
  /** Si no lo hay, el botón es el enlace de correo desde el primer pintado. */
  hayBackend: boolean;
}) {
  // Los cuatro campos propios. El quinto llega de fuera.
  const [propios, setPropios] = useState<Record<Exclude<Campo, 'teach'>, string>>({
    name: '',
    email: '',
    who: '',
    outcome: '',
  });

  const valores: Record<Campo, string> = { ...propios, teach };

  // `useTransition` y no un `useState` de "cargando": la acción es de servidor y
  // esto es exactamente para lo que existe — deja el formulario usable mientras
  // va y no hay que apagar y encender un estado a mano.
  const [enviando, empezar] = useTransition();
  const [enviado, setEnviado] = useState(false);
  // El fallo se guarda como clave y se traduce al pintar: la acción de servidor
  // no sabe en qué idioma se está sirviendo la página.
  const [fallo, setFallo] = useState<keyof typeof textos.errores | null>(null);
  const [sinBackend, setSinBackend] = useState(!hayBackend);

  const escribir = (campo: Campo, valor: string) => {
    if (campo === 'teach') alEscribir(valor);
    else setPropios((v) => ({ ...v, [campo]: valor }));
  };

  // El destino se calcula al vuelo y va en un enlace de verdad, no en un
  // manejador que asigne `location`. Así se puede copiar, abrir en otra
  // ventana y comprobar — y no hay un botón que parezca enviar algo.
  //
  // El cuerpo lleva las preguntas delante, para que el correo llegue legible y
  // no como una lista de valores sueltos.
  const cuerpo = CAMPOS.filter((campo) => campo.id !== 'name' && campo.id !== 'email')
    .map((campo) => `${textos.campos[campo.id]}\n${valores[campo.id] || '—'}`)
    .join('\n\n');

  const firma = `\n\n--\n${valores.name || textos.alguien}${
    valores.email ? `\n${valores.email}` : ''
  }`;
  // Sin raya larga ni caracteres raros: es de lo poco que un filtro de
  // correo entrante mira, y este mensaje ya llega de un remitente
  // desconocido a un buzón sin historial.
  const asunto = textos.asunto.replace('{nombre}', valores.name || textos.sinNombre);

  const mailto = `mailto:${DESTINO}?subject=${encodeURIComponent(
    asunto
  )}&body=${encodeURIComponent(cuerpo + firma)}`;

  return (
    <div className="mx-auto max-w-3xl">
      <Reveal className="text-center" rise={28}>
        <p className="font-mono text-[13px] uppercase tracking-[0.28em] opacity-65">
          {textos.eyebrow}
        </p>
        <p className="mt-6 font-[family-name:var(--font-wordmark)] text-[clamp(2.1rem,5.2vw,4.6rem)] leading-[1.02] tracking-[-0.03em]">
          {textos.titular}
        </p>
      </Reveal>

      <Reveal className="mt-8" rise={24}>
        {/*
          Un `<form>` de verdad, y el botón manda.
          Estuvo suelto, con un `onClick`: entonces `required` no sirve de nada
          —solo bloquea al enviar un formulario— y un campo vacío no se descubría
          hasta después del viaje al servidor, con el aviso abajo del todo, lejos
          del campo. Así el navegador para el envío, enfoca el campo que falta y
          lo dice al lado. Y de paso, Intro envía, que es lo que espera cualquiera.
        */}
        <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
          {CAMPOS.map((campo) => (
            <label key={campo.id} className="block">
              <span className="mb-2 flex items-baseline gap-3 font-mono text-[13px] uppercase tracking-[0.16em] opacity-65">
                {textos.campos[campo.id]}
                {/* Se marca lo **opcional**, no lo obligatorio: tres asteriscos
                    rojos dicen «esto es un trámite», y una sola palabra en dos
                    campos dice «puedes saltarte esto». */}
                {!campo.obligatorio && (
                  <span className="tracking-[0.12em] opacity-70">{textos.opcional}</span>
                )}
              </span>

              {campo.lineas === 1 ? (
                <input
                  type={campo.tipo}
                  required={campo.obligatorio}
                  value={valores[campo.id]}
                  onChange={(event) => escribir(campo.id, event.target.value)}
                  className="w-full border-b border-[#0a0a0a]/20 bg-transparent pb-4 text-[clamp(1.15rem,1.9vw,1.55rem)] outline-none focus:border-[#0a0a0a]"
                  style={{ transition: `border-color 400ms ${EASE}` }}
                />
              ) : (
                <textarea
                  rows={campo.lineas}
                  required={campo.obligatorio}
                  value={valores[campo.id]}
                  onChange={(event) => escribir(campo.id, event.target.value)}
                  className="w-full resize-none border-b border-[#0a0a0a]/20 bg-transparent pb-4 text-[clamp(1.15rem,1.9vw,1.55rem)] leading-relaxed outline-none focus:border-[#0a0a0a]"
                  style={{ transition: `border-color 400ms ${EASE}` }}
                />
              )}
            </label>
          ))}

          <div className="pt-4">
            {enviado ? (
              /* Y se queda dicho. Un formulario que se vacía y no dice nada es la
                 forma más rápida de que alguien lo mande tres veces. */
              <div>
                <p className="text-[clamp(1.15rem,1.9vw,1.55rem)] leading-relaxed">
                  {textos.gracias.replace('{correo}', valores.email)}
                </p>
                <p className="mt-3 text-sm leading-relaxed opacity-65">{textos.graciasNota}</p>
              </div>
            ) : sinBackend ? (
              /* El recambio: sin configuración, el enlace de correo de siempre. */
              <>
                <Cta href={mailto} tone="ink" data-mailto>
                  {textos.enviar}
                </Cta>
                <p className="mt-5 text-xs leading-relaxed opacity-65">{textos.mailtoNota}</p>
              </>
            ) : (
              <>
                <button
                  type="submit"
                  disabled={enviando}
                  onClick={() =>
                    empezar(async () => {
                      setFallo(null);
                      const resultado = await enviarSolicitud({
                        name: valores.name,
                        email: valores.email,
                        teach: valores.teach,
                        who: valores.who,
                        outcome: valores.outcome,
                      });

                      if (resultado.ok) {
                        // La otra conversión de la página. Se cuenta **cuando el
                        // servidor dice que sí**, no al pulsar: un envío que falla
                        // no es una solicitud, y contarlo inflaría la única cifra
                        // que de verdad importa aquí.
                        medir('solicitud');
                        return setEnviado(true);
                      }
                      if (resultado.error === 'sin-configuracion') return setSinBackend(true);
                      setFallo(resultado.error ?? 'fallo');
                    })
                  }
                  className="inline-flex whitespace-nowrap rounded-full bg-[#0a0a0a] px-10 py-5 text-[clamp(1.05rem,1.5vw,1.35rem)] font-medium tracking-[-0.01em] text-[#f4f4ef] disabled:opacity-45"
                  style={{ transition: `opacity 400ms ${EASE}` }}>
                  {enviando ? textos.enviando : textos.enviar}
                </button>

                {fallo && (
                  <p className="mt-5 text-sm leading-relaxed text-[#0a0a0a]/70">
                    {textos.errores[fallo]}
                  </p>
                )}
              </>
            )}
          </div>
        </form>
      </Reveal>
    </div>
  );
}
