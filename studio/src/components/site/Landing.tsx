'use client';

import { Curtain, Marquee, PinnedWords, Reveal, SmoothScroll } from './motion';
import { Nav } from './Nav';
import { Band, Cta, Statement } from './pieces';

/**
 * La landing de Bihapia.
 *
 * Adaptada de houseofhoney.com: se toma su recorrido —portada con el nombre a
 * sangre, bloques de color alternando, etiqueta pequeña y frase enorme,
 * marquesina, rejilla de tres y cierre— y su movimiento, no su paleta ni su
 * contenido.
 *
 * **Solo una sección clava la pantalla**, la 01. Las demás usan la misma
 * aparición palabra a palabra pero sin detener la página: tres pausas seguidas
 * en una misma bajada dejan de leerse como efecto y empiezan a leerse como que
 * la web no responde.
 */

/** Los tres objetivos de la marca, en la banda oscura. */
const OBJETIVOS = [
  {
    numero: '01',
    titulo: 'No scores to beat',
    cuerpo:
      'No counters, no leaderboard, no streaks. Nothing that turns what you were curious about into a race against someone else.',
  },
  {
    numero: '02',
    titulo: 'It ends when you want',
    cuerpo:
      'One thing, and then you are done. The feed is not designed to keep you there, and leaving costs you nothing.',
  },
  {
    numero: '03',
    titulo: 'Makers get paid',
    cuerpo:
      'Creators publish short courses and sell them here. The money goes to whoever made the thing, not to whatever ranked it.',
  },
];

/** Los tres huecos de curso. Vacíos a propósito hasta que haya cursos reales. */
const HUECOS = ['01', '02', '03'];

export function Landing() {
  return (
    <>
      <Curtain />

      <SmoothScroll>
        {/* ---------------------------------------------------------------
            Portada
            Marco negro arriba, el nombre a todo el ancho y el vídeo debajo.
            Nada más: sin eslogan ni entradilla, que es lo más minimalista que
            puede ser sin dejar de decir cómo se llama.

            El marco cierra al ras del asta de la "h" y del punto de la "i", y
            el vídeo abre al ras del rabo de la "p". El nombre queda encajado
            entre los dos.
        --------------------------------------------------------------- */}
        <Band tone="bone" className="@container">
          {/* La franja es del color del lienzo, así que no se ve como banda: lo
              que hace es reservar el alto y dejar la nav centrada en él, con el
              mismo aire arriba y abajo. El filo sigue cayendo al ras del asta,
              aunque ahora no haya cambio de color que lo señale. */}
          <div className="flex h-[5.5rem] items-center">
            <Nav />
          </div>

          {/*
            El wordmark sube `--ink-top`.

            La caja de la línea no es donde está la tinta: con `line-height`
            menor que 1, la "b" empieza 0.0622em por debajo del borde de la
            caja. Sin esta subida quedaría una franja clara entre el negro y el
            arranque del asta — invisible en el CSS y muy visible en pantalla.

            Sin margen lateral: la palabra toca los dos bordes.
          */}
          <h1 className="wordmark-hero mt-[calc(-1*var(--ink-top))]">bi&amp;hapia</h1>

          {/*
            El vídeo va en 4K y pesa lo que pesa, así que el `poster` no es un
            adorno: es lo que se ve mientras llega, y sin él la portada arranca
            con un rectángulo negro.

            Silenciado por obligación, no por gusto: los navegadores prohíben
            autoreproducir con sonido sin interacción previa.
          */}
          <div className="h-[46svh] w-full sm:h-[62svh]">
            <video
              src="/video/portada.mp4"
              poster="/video/portada-poster.jpg"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden
              className="h-full w-full object-cover"
            />
          </div>
        </Band>

        {/* ---------------------------------------------------------------
            La idea
        --------------------------------------------------------------- */}
        {/* Sin relleno arriba: la frase arranca justo detrás del vídeo. Todo lo
            que se pusiera aquí sería negro vacío antes de que apareciera nada. */}
        <Band tone="ink" id="idea" className="@container">
          {/*
            Maciza y no en hueco: la regla del contorno es del wordmark
            `bi&hapia`, no de todo el texto de la marca.

            Centrada y con la pantalla clavada: cada palabra entra cuando el
            scroll llega a su punto. La etiqueta y la entradilla van dentro y
            sin animación, para que el tramo previo no sea negro vacío.
          */}
          <PinnedWords
            label="01 — La idea"
            words={['Nothing', 'to', 'chase']}
            className="text-center font-[family-name:var(--font-wordmark)] text-[clamp(3rem,11vw,9rem)] leading-[0.92] tracking-[-0.03em]"
          />

          {/* La cinta, grande. A 11 px pasaba desapercibida; a este tamaño el
              nombre cruzando es un elemento de la página, no un adorno. */}
          <Marquee
            text="bihapia"
            className="font-[family-name:var(--font-wordmark)] text-[clamp(2.5rem,7vw,5rem)] leading-none tracking-[-0.02em] opacity-[0.14]"
          />

          {/* Los tres objetivos de la marca. Van en la tipografía de la página y
              en inglés, como el resto de lo grande. */}
          <ul className="mx-auto grid max-w-6xl gap-12 px-6 pb-24 pt-24 sm:grid-cols-3 sm:gap-10 sm:pb-32 sm:pt-32">
            {OBJETIVOS.map((objetivo, index) => (
              <Reveal key={objetivo.titulo} as="li" offset={index} rise={32}>
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] opacity-40">
                  {objetivo.numero}
                </p>
                <p className="mt-5 font-[family-name:var(--font-wordmark)] text-[clamp(1.5rem,2.6vw,2.1rem)] leading-[1.05] tracking-[-0.02em]">
                  {objetivo.titulo}
                </p>
                <p className="mt-4 max-w-[30ch] text-sm leading-relaxed opacity-55">
                  {objetivo.cuerpo}
                </p>
              </Reveal>
            ))}
          </ul>
        </Band>

        {/* ---------------------------------------------------------------
            Cómo es
            La etiqueta arranca casi al ras de la banda de arriba, y la frase se
            construye palabra a palabra **sin clavar la pantalla**: la pausa se
            queda como cosa de la 01.

            Aquí había tres fotos de archivo. Nunca dijeron nada de la tesis
            —era una reunión de trabajo en un loft— y estaban marcadas como
            provisionales desde el primer día. En su sitio va el texto que
            explica qué es esto.
        --------------------------------------------------------------- */}
        <Band tone="bone" id="como" className="px-6 pb-32 pt-10 sm:pb-48 sm:pt-14">
          <PinnedWords
            pin={false}
            label="02 — Cómo es"
            words={['One', 'thing', 'at', 'a', 'time']}
            className="text-center font-[family-name:var(--font-wordmark)] text-[clamp(2.4rem,8vw,6rem)] leading-[0.95] tracking-[-0.03em]"
          />

          <Reveal className="mx-auto mt-20 max-w-2xl space-y-6 text-center sm:mt-28" rise={32}>
            <p className="text-[clamp(1.05rem,1.9vw,1.35rem)] leading-relaxed">
              Bihapia is a feed built the other way round. No counters, no streaks, no
              leaderboard — nothing that turns curiosity into a race. You watch one thing,
              you learn something you didn&apos;t know, and you leave when you want.
            </p>
            <p className="text-[clamp(1.05rem,1.9vw,1.35rem)] leading-relaxed opacity-60">
              Creators publish short courses and sell them here, keeping what they earn.
              We are building the calm end of the internet.
            </p>
          </Reveal>
        </Band>

        {/* ---------------------------------------------------------------
            Cursos
            Tres huecos vacíos y etiquetados. Sin cursos inventados: contenido
            falso en una página pública es lo que luego nadie se acuerda de
            quitar. Se llenarán cuando exista la gestión de cursos.
        --------------------------------------------------------------- */}
        <Band tone="amber" id="cursos" className="px-6 pb-32 pt-10 sm:pb-48 sm:pt-14">
          <PinnedWords
            pin={false}
            label="03 — Cursos"
            words={['Take', 'your', 'time']}
            className="text-center font-[family-name:var(--font-wordmark)] text-[clamp(2.4rem,8vw,6rem)] leading-[0.95] tracking-[-0.03em]"
          />

          <ul className="mx-auto mt-20 grid max-w-6xl gap-6 sm:mt-28 sm:grid-cols-3">
            {HUECOS.map((numero, index) => (
              <Reveal key={numero} as="li" offset={index} rise={32}>
                <div className="flex aspect-[4/5] w-full flex-col justify-between rounded-lg border border-dashed border-[#0a0a0a]/25 p-6">
                  <span className="font-mono text-[11px] uppercase tracking-[0.28em] opacity-55">
                    N.0{numero}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.28em] opacity-40">
                    Próximamente
                  </span>
                </div>
              </Reveal>
            ))}
          </ul>

          <Reveal className="mt-16 text-center" rise={24}>
            <Cta href="/entrar" tone="ink">
              Publicar un curso
            </Cta>
          </Reveal>
        </Band>

        {/* ---------------------------------------------------------------
            Cierre
            Panel claro con las esquinas de abajo redondeadas, montado sobre el
            pie oscuro. Es el remate de la referencia.
        --------------------------------------------------------------- */}
        <Band tone="ink">
          <div className="rounded-b-[2.5rem] bg-[#f0f0ec] px-6 py-32 text-center text-[#0a0a0a] sm:rounded-b-[4rem] sm:py-48">
            <Statement className="mx-auto max-w-[14ch]">
              Sería un placer que no supieras por dónde empezar
            </Statement>

            <Reveal className="mt-14" rise={24}>
              <Cta href="/entrar" tone="ink">
                Descargar
              </Cta>
            </Reveal>
          </div>

          <footer className="px-6 pb-12 pt-24 sm:px-10">
            <div className="mx-auto flex max-w-6xl flex-col gap-10 border-b border-[#f4f4ef]/12 pb-10 sm:flex-row sm:justify-between">
              {/* El contorno se pide en línea: `.wordmark` lo fija en tinta, y
                  sobre el pie oscuro eso es negro sobre negro. */}
              <span
                className="wordmark text-2xl"
                style={{ WebkitTextStroke: '1.2px #f4f4ef' }}>
                bi&amp;hapia
              </span>

              <div className="flex flex-wrap gap-x-12 gap-y-6 font-mono text-xs uppercase tracking-[0.16em]">
                <a href="#idea" className="opacity-55 hover:opacity-100">
                  La idea
                </a>
                <a href="#como" className="opacity-55 hover:opacity-100">
                  Cómo es
                </a>
                <a href="/entrar" className="opacity-55 hover:opacity-100">
                  Publicar
                </a>
              </div>
            </div>

            <p className="mx-auto mt-8 max-w-6xl font-mono text-[11px] uppercase tracking-[0.16em] opacity-35">
              Bihapia · Disfruta de lo que no sabes
            </p>
          </footer>
        </Band>
      </SmoothScroll>
    </>
  );
}
