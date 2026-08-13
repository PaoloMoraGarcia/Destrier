'use client';

import { Contact } from './Contact';
import { Curtain, Marquee, PinnedScene, Reveal, SmoothScroll } from './motion';
import { Nav } from './Nav';
import { Band, Cta } from './pieces';

/**
 * La landing de Destrier.
 *
 * No es una plataforma: es una marca y un punto de contacto para quien tiene
 * algo que enseñar y quiere darle forma. Todo el recorrido lleva a una sola
 * acción — contar qué quieres enseñar—, y el contacto es la consecuencia de
 * haber entendido la propuesta, no una venta.
 *
 * Por eso no hay precios, ni paquetes, ni lista de servicios, ni prueba social,
 * ni un CTA repetido en cada sección. Solo uno, al final.
 *
 * La estética viene de houseofhoney.com: portada tipográfica a sangre, bloques
 * de color alternando, escenas que se construyen con el scroll. Dos voces —la de
 * display para lo grande, la monoespaciada para etiquetas— y nada más.
 */

/** Los tres principios. Principios, no funcionalidades. */
const PRINCIPLES = [
  {
    numero: '01',
    titulo: 'Start with the outcome',
    cuerpo: 'What should someone be able to do when they finish?',
  },
  {
    numero: '02',
    titulo: 'One thing at a time',
    cuerpo: 'The best learning path is not the longest one.',
  },
  {
    numero: '03',
    titulo: 'Knowledge has a shape',
    cuerpo: 'What you know becomes more useful when someone else can follow it.',
  },
];

export function Landing() {
  return (
    <>
      <Curtain />

      <SmoothScroll>
        {/* ---------------------------------------------------------------
            Portada
            Franja arriba con la nav, el nombre a todo el ancho y el vídeo
            debajo. Nada más.

            La franja cierra al ras del asta de la "d" y del punto de la "i", y
            el vídeo abre al ras de la línea base. El nombre queda encajado
            entre los dos.
        --------------------------------------------------------------- */}
        <Band tone="bone" id="top" className="@container">
          {/* La franja es del color del lienzo, así que no se ve como banda: lo
              que hace es reservar el alto y dejar la nav centrada en él, con el
              mismo aire arriba y abajo. */}
          <div className="flex h-[5.5rem] items-center">
            <Nav />
          </div>

          {/*
            El wordmark sube `--ink-top`.

            La caja de la línea no es donde está la tinta: con `line-height`
            menor que 1, la "d" empieza por debajo del borde de la caja. Sin esta
            subida quedaría una franja clara entre la franja y el arranque del
            asta — invisible en el CSS y muy visible en pantalla.

            Sin margen lateral: la palabra toca los dos bordes.
          */}
          <h1 className="wordmark-hero mt-[calc(-1*var(--ink-top))]">destrier</h1>

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
            01 — The idea
            La filosofía, y de ahí a por qué el conocimiento necesita una forma.
        --------------------------------------------------------------- */}
        <Band tone="ink" id="idea" className="@container">
          <PinnedScene
            label="01 — The idea"
            words={['Nothing', 'to', 'chase']}
            className="text-center font-[family-name:var(--font-wordmark)] text-[clamp(2.6rem,9vw,7rem)] leading-[0.94] tracking-[-0.03em]"
            lead="Learning does not need more noise. It needs a reason, a shape and somewhere to go."
            itemsClassName="mx-auto grid max-w-5xl gap-10 sm:grid-cols-3"
            items={PRINCIPLES.map((p) => (
              <div key={p.titulo}>
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] opacity-40">
                  {p.numero}
                </p>
                <p className="mt-4 font-[family-name:var(--font-wordmark)] text-[clamp(1.2rem,2vw,1.6rem)] leading-[1.1] tracking-[-0.02em]">
                  {p.titulo}
                </p>
                <p className="mt-3 max-w-[32ch] text-sm leading-relaxed opacity-55">{p.cuerpo}</p>
              </div>
            ))}
          />

          {/* La cinta cierra la banda. Debajo de los principios quedaba un tramo
              oscuro sin nada. */}
          <Marquee
            text="destrier"
            className="pb-20 font-[family-name:var(--font-wordmark)] text-[clamp(2.5rem,7vw,5rem)] leading-none tracking-[-0.02em] opacity-[0.14] sm:pb-28"
          />
        </Band>

        {/* ---------------------------------------------------------------
            02 — A learning path
            Qué significa dar forma a lo que alguien sabe. Sin lista de
            servicios y sin "we build": es una forma de pensar, no una oferta.
        --------------------------------------------------------------- */}
        <Band tone="bone" id="path" className="@container">
          <PinnedScene
            label="02 — A learning path"
            words={['From', 'what', 'you', 'know', 'to', 'what', 'someone', 'can', 'do']}
            // Nueve palabras piden un cuerpo menor que en las otras dos, o el
            // titular se come la pantalla entera.
            className="text-center font-[family-name:var(--font-wordmark)] text-[clamp(1.8rem,5vw,3.6rem)] leading-[1.02] tracking-[-0.03em]"
            itemsClassName="mx-auto max-w-2xl"
            items={[
              <p
                key="path"
                className="text-center text-[clamp(1.05rem,1.9vw,1.35rem)] leading-relaxed">
                A course is not a folder full of videos. It is a path: a clear outcome, the
                right steps and enough room to make the knowledge your own.
              </p>,
            ]}
          />
        </Band>

        {/* ---------------------------------------------------------------
            03 — Start with an idea
            La invitación. Un único CTA en toda la página, y baja al formulario.
        --------------------------------------------------------------- */}
        <Band tone="amber" id="start" className="@container">
          <PinnedScene
            label="03 — Start with an idea"
            words={['Have', 'something', 'worth', 'teaching?']}
            className="text-center font-[family-name:var(--font-wordmark)] text-[clamp(2.2rem,7vw,5.5rem)] leading-[0.98] tracking-[-0.03em]"
            itemsClassName="mx-auto max-w-xl"
            items={[
              <div key="invite" className="text-center">
                <p className="text-[clamp(1.05rem,1.9vw,1.35rem)] leading-relaxed">
                  You do not need to know where to start. Tell us what is in your head. We
                  can begin there.
                </p>
                <div className="mt-12 flex justify-center">
                  <Cta href="#contact" tone="ink">
                    Tell us your idea
                  </Cta>
                </div>
              </div>,
            ]}
          />
        </Band>

        {/* ---------------------------------------------------------------
            Contacto
            Panel claro de esquinas redondeadas sobre el pie oscuro, que es el
            remate de la referencia.
        --------------------------------------------------------------- */}
        <Band tone="ink">
          <div
            id="contact"
            className="rounded-b-[2.5rem] bg-[#f0f0ec] px-6 py-28 text-[#0a0a0a] sm:rounded-b-[4rem] sm:py-40">
            <Contact />
          </div>

          <footer className="px-6 pb-12 pt-24 sm:px-10">
            <div className="mx-auto flex max-w-6xl flex-col gap-10 border-b border-[#f4f4ef]/12 pb-10 sm:flex-row sm:justify-between">
              {/* El contorno se pide en línea: `.wordmark` lo fija en tinta, y
                  sobre el pie oscuro eso es negro sobre negro. */}
              <span className="wordmark text-2xl" style={{ WebkitTextStroke: '1.2px #f4f4ef' }}>
                destrier
              </span>

              <div className="flex flex-wrap gap-x-12 gap-y-6 font-mono text-xs uppercase tracking-[0.16em]">
                <a href="#idea" className="opacity-55 hover:opacity-100">
                  The idea
                </a>
                <a href="#path" className="opacity-55 hover:opacity-100">
                  A learning path
                </a>
                <a href="#contact" className="opacity-55 hover:opacity-100">
                  Contact
                </a>
              </div>
            </div>

            <p className="mx-auto mt-8 max-w-6xl font-mono text-[11px] uppercase tracking-[0.16em] opacity-35">
              Destrier · Be happy about the things you don&apos;t know
            </p>
          </footer>
        </Band>
      </SmoothScroll>
    </>
  );
}
