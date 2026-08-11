'use client';

import Image from 'next/image';

import { Curtain, Drift, Marquee, Reveal, SmoothScroll } from './motion';
import { Nav } from './Nav';
import { Band, Cta, Label, Statement } from './pieces';

/**
 * La landing de Bihapia.
 *
 * Adaptada de houseofhoney.com: se toma su recorrido —portada con el nombre a
 * sangre, bloques de color alternando, etiqueta pequeña y frase enorme,
 * marquesina, rejilla de tres y cierre— y su movimiento, no su paleta ni su
 * contenido.
 *
 * **Las fotos son provisionales.** Son de archivo, de una reunión de equipo, y
 * sirven para juzgar la maqueta pero no dicen nada de la tesis del producto: no
 * hay un móvil, ni vídeo vertical, ni nadie mirando nada. Están en la sección de
 * creadores, que es donde menos desentonan.
 */

const RASGOS = [
  {
    src: '/fotos/estudio-01.jpg',
    alt: 'Un grupo de personas alrededor de una mesa de trabajo',
    titulo: 'Una cosa cada vez',
    dato: 'Sin contadores',
  },
  {
    src: '/fotos/estudio-02.jpg',
    alt: 'Dos personas revisando unos planos sobre una mesa',
    titulo: 'Se acaba cuando quieres',
    dato: 'Sin rachas',
  },
  {
    src: '/fotos/estudio-03.jpg',
    alt: 'Un equipo reunido en un espacio diáfano de doble altura',
    titulo: 'Nadie va por delante',
    dato: 'Sin ranking',
  },
];

export function Landing() {
  return (
    <>
      <Curtain />
      <Nav />

      <SmoothScroll>
        {/* ---------------------------------------------------------------
            Portada
            El nombre ocupa el ancho entero y debajo va el vídeo. Nada más: sin
            eslogan ni entradilla, que es lo más minimalista que puede ser sin
            dejar de decir cómo se llama.
        --------------------------------------------------------------- */}
        <Band tone="bone" className="@container pt-24 sm:pt-28">
          {/* Sin margen lateral: la palabra toca los dos bordes, que es de
              donde sale toda la fuerza de la portada de la referencia. */}
          <h1 className="wordmark-hero">bi&amp;hapia</h1>

          {/*
            El vídeo va en 4K y pesa lo que pesa, así que el `poster` no es un
            adorno: es lo que se ve mientras llega, y sin él la portada arranca
            con un rectángulo negro.

            Silenciado por obligación, no por gusto: los navegadores prohíben
            autoreproducir con sonido sin interacción previa.
          */}
          <div className="mt-10 h-[46svh] w-full sm:h-[62svh]">
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
        <Band tone="ink" id="idea" className="py-32 sm:py-48">
          <Label className="mb-24 px-6 text-center">01 — La idea</Label>

          {/*
            Maciza y no en hueco: la regla del contorno es del wordmark
            `bi&hapia`, no de todo el texto de la marca.
          */}
          <Drift className="font-[family-name:var(--font-wordmark)] text-[clamp(3.2rem,11vw,9rem)] leading-[0.9] tracking-[-0.02em]">
            Nothing to catch up on
          </Drift>

          <Marquee
            text="bihapia"
            className="mt-28 font-mono text-[11px] uppercase tracking-[0.3em] opacity-40"
          />
        </Band>

        {/* ---------------------------------------------------------------
            Cómo es
            La rejilla de tres de la referencia: foto, título, y un dato en
            monoespaciada donde ellos ponen coordenadas.
        --------------------------------------------------------------- */}
        <Band tone="bone" id="como" className="px-6 py-32 sm:py-48">
          <Label className="mb-16 text-center">02 — Cómo es</Label>

          <Statement className="mx-auto mb-24 max-w-[12ch] text-center">
            Una cosa cada vez, y ya está
          </Statement>

          <ul className="mx-auto grid max-w-6xl gap-12 sm:grid-cols-3 sm:gap-6">
            {RASGOS.map((rasgo, index) => (
              <Reveal key={rasgo.titulo} as="li" offset={index} rise={36}>
                <div className="relative aspect-[4/5] w-full overflow-hidden">
                  <Image
                    src={rasgo.src}
                    alt={rasgo.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
                {/* Dos líneas reservadas aunque el título ocupe una: si no, el
                    dato de abajo baila de columna a columna y la rejilla deja
                    de leerse como una rejilla. */}
                <p className="mt-5 min-h-[2lh] text-lg uppercase leading-tight tracking-tight">
                  {rasgo.titulo}
                </p>
                <p className="mt-1 font-mono text-xs uppercase tracking-[0.16em] opacity-45">
                  {rasgo.dato}
                </p>
              </Reveal>
            ))}
          </ul>
        </Band>

        {/* ---------------------------------------------------------------
            Cursos
            La tarjeta editorial de su columna, reaprovechada.
        --------------------------------------------------------------- */}
        <Band tone="amber" id="cursos" className="px-6 py-32 text-center sm:py-48">
          <Label className="mb-16">03 — Cursos</Label>

          <Statement className="mx-auto max-w-[11ch]">Aprende sin prisa</Statement>

          <Reveal className="mx-auto mt-20 max-w-md" rise={32}>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] opacity-55">
              N.001 · Gratis la primera lección
            </p>
            <p className="mt-6 font-serif text-[clamp(1.6rem,4vw,2.4rem)] uppercase leading-[1.05]">
              Lo que no sabes de los mapas
            </p>
            <div className="mt-10">
              <Cta href="/noraverse/lo-que-no-sabes-de-los-mapas" tone="ink">
                Verlo
              </Cta>
            </div>
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
