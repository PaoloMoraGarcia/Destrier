'use client';

import { useState } from 'react';

import type { Idioma, Textos } from '@/lib/textos';

import { BloqueLlamada } from './BloqueLlamada';
import { BotonFlecha } from './BotonFlecha';
import { Contact } from './Contact';
import { Cta } from './Cta';
import { Dispositivos } from './Dispositivos';
import { Header } from './Header';
import { Hero } from './Hero';
import { Revelado } from './Revelado';
import { SelectorIdioma } from './SelectorIdioma';
import { Curtain, SmoothScroll } from './motion';
import { WordScroll } from './WordScroll';

/**
 * La landing de Destrier.
 *
 * **Destrier es un servicio.** Alguien sabe algo —un submarinista, un
 * entrenador— y quiere enseñárselo a su público; aquí se le construye el sitio
 * desde el que enseñarlo, y después se le mantiene. Eso último es la mitad del
 * servicio y es lo que casi nadie ofrece.
 *
 * Durante un tiempo la página contó a ratos una cosa de formación y a ratos una
 * de hacer webs, y no se entendía a qué se dedicaba. Son las dos, y en este
 * orden: **se hacen webs para quien enseña**.
 *
 * Todo el recorrido lleva a **una sola acción** —contar qué quieres enseñar—, y
 * por eso no hay precios, ni paquetes, ni lista de servicios, ni prueba social,
 * ni contadores.
 *
 * Esa acción sí aparece **tres veces**, y no es lo mismo que un CTA por sección:
 * al llegar, al terminar la filosofía y al terminar de leer qué se vende. Estaba
 * una sola vez, a 2,1 pantallas del principio, con cuatro pantallas y media
 * seguidas sin ninguna salida. Medido, no supuesto.
 *
 * ## La poda, y por qué
 *
 * La página llegó a medir 8,9 pantallas contando tres negocios a la vez: la
 * portada decía `Destrier FX made with care` —un estudio de efectos—, las
 * secciones hablaban de enseñar, y una galería y un muro de valoraciones decían
 * que hacíamos webs. El 53 % del recorrido era enseñar trabajo ajeno y decir que
 * había gustado; el mensaje de la marca ocupaba el 16 %.
 *
 * Se fueron la galería —3,2 pantallas de capturas de webs de otros estudios—, el
 * muro de valoraciones —caras de desconocidos avalando un trabajo que no es
 * este— y el dock, que era una metáfora de sistema operativo sobre una página que
 * ahora tiene tres anclas. En una landing la navegación es el scroll.
 *
 * Queda en unas cuatro pantallas, que es lo que mide un punto de contacto.
 *
 * ## La pregunta vive arriba y abajo
 *
 * `teach` es lo que quien entra dice que quiere enseñar. Se escribe en el hueco
 * del titular de la portada y se lee en el formulario del final, que baja ya
 * empezado. Vive aquí porque lo comparten dos piezas que están en extremos
 * opuestos de la página, y no hay nada entre ellas que deba saber de esto.
 *
 * ## Las tres frases, y por qué ya no clavan la pantalla
 *
 * `#idea`, `#about` y `#path` revelan su frase con el scroll, cada una de una
 * manera distinta: la primera enciende un texto que ya está, la segunda lo
 * descubre tras una cortina y la tercera lo construye desde cero.
 *
 * **Pero no paran la página.** Lo hicieron, y el precio era geometría: una escena
 * clavada necesita una pista de más de dos pantallas, el texto va centrado en
 * ella, y al salir se desplaza hacia arriba. Entre una cosa y otra cada sección
 * dejaba media pantalla de negro por arriba y otra media por abajo — y con tres
 * seguidas, la página era un pasillo vacío. Se veía en cuanto se miraba una
 * captura a media escena: la frase cortada arriba y un desierto debajo.
 *
 * Sin clavar, la revelación sigue atada al scroll —si paras a media frase se
 * queda a medias— y las secciones miden lo que mide su contenido.
 *
 * **Las tres son la misma pieza.** `About.tsx` existió como componente aparte y
 * era una segunda implementación del mismo efecto sobre los mismos datos.
 *
 * ## El idioma baja de arriba
 *
 * Ni contexto ni proveedor: los textos llegan desde el servidor como una
 * propiedad y se reparten. Con una sola página, un contexto sería una capa para
 * ahorrar cinco `props` en un archivo.
 */

/**
 * La cita de treinta minutos, sacada de la cuenta de Calendly conectada.
 *
 * Es el único evento activo, con Google Meet, y su correo es el mismo al que va el
 * formulario. Si algún día se cambia el `slug` del evento en Calendly, este enlace
 * deja de funcionar sin que nada avise: Calendly no redirige.
 */
const AGENDA = 'https://calendly.com/hello-destrier/30min';

/**
 * El aire entre el bloque de la llamada y la frase de los aparatos.
 *
 * Es el mismo salto que `AIRE.lejos` en `WordScroll.tsx` —128 px—, y va aquí en vez
 * de importarse porque esa escala describe el ritmo *dentro* de una frase revelada
 * y esto es la costura entre dos bloques distintos de la misma sección. Si algún
 * día las dos escalas se separan, esta no debe seguir a la otra por accidente.
 */
const AIRE_APARATOS = 'mt-[128px]';

export function Landing({
  idioma,
  textos,
  hayBackend,
}: {
  idioma: Idioma;
  textos: Textos;
  hayBackend: boolean;
}) {
  const [teach, setTeach] = useState('');

  return (
    /*
     * El `lang` va aquí y no en `<html>`.
     *
     * El documento lo pone `app/layout.tsx`, que es el mismo para el panel del
     * creador —que está en español y no se traduce— y para esta página. `lang` es
     * un atributo global y lo que vale es el más cercano, así que declarándolo en
     * el bloque que envuelve la landing, un lector de pantalla pronuncia esta
     * página en su idioma sin que el panel deje de ser español.
     */
    <div lang={idioma}>
      <Curtain />

      {/* La cabecera va fuera del contenedor que scrollea: es `fixed`, y dentro
          de un contenedor con `overflow` propio un `fixed` se queda anclado a él
          y no a la ventana. */}
      <Header />

      <SmoothScroll>
        {/* ---------------------------------------------------------------
            00 — La portada
            Titular con el hueco, y el portátil. Entra escalonada al cargar y no
            toca el scroll: hubo una versión que lo cerraba hasta que escribieras
            algo y dejaba la página inservible.
        --------------------------------------------------------------- */}
        <Hero
          titular={textos.hero.titular}
          ejemplos={textos.hero.ejemplos}
          etiquetaCampo={textos.contacto.campos.teach}
          teach={teach}
          alEscribir={setTeach}
          agendarHref={AGENDA}
          agendarEtiqueta={textos.idea.agendar}
        />

        {/* ---------------------------------------------------------------
            01 — The idea
            La filosofía, y la primera escena que para la página: la frase se
            **enciende** palabra a palabra sobre un texto que ya está ahí,
            apagado. Va en negro porque el corte de color es lo que separa una
            idea de la siguiente en toda la página.
        --------------------------------------------------------------- */}
        <section id="idea" data-tono="ink">
          <WordScroll
            eyebrow={textos.idea.eyebrow}
            text={textos.idea.texto}
            tone="ink"
            revelado="brillo">
            {/* El bloque de la llamada, y debajo los aparatos con su frase.
                Aquí hubo un enlace suelto de «Agendar una llamada», y antes de eso
                un botón manuscrito que se fue con su tipografía. */}
            <div className="text-center">
              <BloqueLlamada textos={textos.llamada} agenda={AGENDA} />

              {/*
                La frase de los aparatos, en dos líneas y con el peso en la de
                abajo. En una sola, «con tu idea» se leía con el mismo peso que el
                resto y no era eso lo que había que destacar.
              */}
              <div className={AIRE_APARATOS}>
                <p className="mx-auto max-w-[24ch] text-[clamp(1.6rem,2.8vw,2.4rem)] font-medium leading-[1.15] tracking-[-0.02em] opacity-70">
                  {textos.idea.aparatosFrase}
                </p>

                <Revelado
                  como="p"
                  className="mx-auto mt-3 max-w-[20ch] text-[clamp(2.8rem,5.4vw,4.4rem)] font-medium leading-[1.08] tracking-[-0.03em]"
                  /*
                   * El subrayado, en `style` y a **1 px**.
                   *
                   * Estaba en `decoration-[0.05em]`, que a este cuerpo son más de
                   * 2 px y a 4,4 rem pasan de 3: una raya gruesa debajo de una
                   * letra fina. Un grosor fijo se queda fino a cualquier tamaño, y
                   * la separación mayor lo despega de los rabos de las letras.
                   */
                  estiloPalabra={{
                    textDecorationLine: 'underline',
                    textDecorationThickness: '1px',
                    textDecorationColor: 'rgba(244,244,239,0.35)',
                    textUnderlineOffset: '0.24em',
                  }}>
                  {textos.idea.aparatosEnfasis}
                </Revelado>
              </div>

              <div className="mt-12">
                <Dispositivos etiqueta={textos.idea.aparatos} />
              </div>
            </div>
          </WordScroll>
        </section>

        {/* ---------------------------------------------------------------
            02 — Qué es Destrier
            La que dice a qué se dedica esto, con dos ejemplos concretos. Va en
            blanco para que el recorrido siga alternando color, y su frase se
            **descubre** tras una cortina — ni se enciende como la 01 ni llega
            como la 03. Los aparatos se mudaron de aquí a la sección negra.
        --------------------------------------------------------------- */}
        <section id="about" data-tono="bone">
          <WordScroll
            eyebrow={textos.about.eyebrow}
            text={textos.about.titular}
            lead={textos.about.lead}
            principios={textos.about.pasos}
            tone="bone"
            revelado="cortina"
          />
        </section>

        {/* ---------------------------------------------------------------
            03 — Qué se vende
            Aquí estaba el método —cómo se trabaja—, que es interesante para quien
            ya ha decidido y no para quien acaba de llegar. Ahora están los dos
            servicios con su nombre: **el cliente tiene que saber qué compra**.
            Se revela distinto que las dos de antes: cada palabra llega desde
            abajo.
        --------------------------------------------------------------- */}
        <section id="path" data-tono="ink">
          <WordScroll
            eyebrow={textos.servicios.eyebrow}
            text={textos.servicios.texto}
            principios={textos.servicios.lista}
            tone="ink"
            // Los dos servicios, grandes y uno a cada lado: es lo que se vende.
            destacado
            revelado="llegada">
            {/*
              La segunda salida, y la que faltaba.
              Entre el enlace de `#idea` y el formulario del final había **cuatro
              pantallas y media sin una sola forma de actuar**, medidas. Y el hueco
              caía justo aquí: quien se convence, se convence leyendo qué se vende,
              y hasta ahora al terminar de leerlo no tenía dónde pulsar.
            */}
            <div className="text-center">
              <BotonFlecha href={AGENDA} externo>
                {textos.idea.agendar}
              </BotonFlecha>
            </div>
          </WordScroll>
        </section>

        {/* ---------------------------------------------------------------
            Contacto
            Panel claro de esquinas redondeadas sobre el pie oscuro.
        --------------------------------------------------------------- */}
        <section className="bg-[#0a0a0a] text-[#f4f4ef]">
          <div
            id="contact"
            data-tono="bone"
            className="rounded-b-[2.5rem] bg-[#ffffff] px-6 py-[13svh] text-[#0a0a0a] sm:rounded-b-[4rem]">
            <Contact
              textos={textos.contacto}
              teach={teach}
              alEscribir={setTeach}
              hayBackend={hayBackend}
            />
          </div>

          <footer data-tono="ink" className="px-6 pb-12 pt-12 sm:px-10">
            <div className="mx-auto flex max-w-6xl flex-col gap-8 border-b border-[#f4f4ef]/12 pb-8 sm:flex-row sm:justify-between">
              {/* El contorno se pide en línea: `.wordmark` lo fija en tinta, y
                  sobre el pie oscuro eso es negro sobre negro. */}
              <span className="wordmark text-2xl" style={{ WebkitTextStroke: '1.2px #f4f4ef' }}>
                destrier
              </span>

              {/* `gap-x` menor y `py-3` en cada enlace: la pauta de accesibilidad
                  pide **44 px de objetivo**, y estos medían 16 de alto. El relleno
                  vertical los sube a 44 sin mover el texto ni un píxel. */}
              <div className="-my-3 flex flex-wrap items-center gap-x-10 gap-y-1 font-mono text-xs uppercase tracking-[0.16em]">
                {textos.pie.enlaces.map((enlace) => (
                  <a
                    key={enlace.href}
                    href={enlace.href}
                    className="flex min-h-[44px] items-center opacity-70 hover:opacity-100">
                    {enlace.label}
                  </a>
                ))}

                {/* El cambio de idioma vive en el pie y no en la cabecera: la
                    cabecera solo lleva el nombre, y quien quiere cambiar de
                    idioma lo hace una vez, no a media lectura. */}
                <SelectorIdioma idioma={idioma} etiqueta={textos.idioma.etiqueta} />
              </div>
            </div>

            <p className="mx-auto mt-8 max-w-6xl font-mono text-[13px] uppercase tracking-[0.16em] opacity-60">
              {/* El wordmark no se traduce —es el nombre—; el lema sí, porque es
                  una frase y en una página en español se lee en español. */}
              Destrier &middot; {textos.meta.lema}
            </p>
          </footer>
        </section>
      </SmoothScroll>
    </div>
  );
}
