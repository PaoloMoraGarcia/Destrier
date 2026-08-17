import { ImageResponse } from 'next/og';

import { textosActuales } from '@/lib/idioma.server';

/**
 * La tarjeta que sale al pegar el enlace en un chat.
 *
 * **Hoy el único canal de Destrier es mandar el enlace a gente**, así que esto no
 * es un adorno: sin `og:image`, cada envío por WhatsApp, LinkedIn o Slack sale
 * como un enlace pelado, sin decir de qué va. Es la conversión que se pierde
 * antes de que nadie llegue a la página.
 *
 * Se genera aquí y no como archivo estático para que **diga lo mismo que la
 * página**: lee el mismo diccionario, así que si cambia lo que Destrier vende,
 * cambia la tarjeta. Un PNG a mano se quedaría viejo en la primera reescritura.
 *
 * Va en tinta y hueso, sin más elementos: es la paleta entera de la marca, y a
 * tamaño de miniatura en una lista de chats lo único que se lee es el nombre y
 * una línea.
 */

export const alt = 'Destrier';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Imagen() {
  const { textos } = await textosActuales();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0a0a0a',
          color: '#f4f4ef',
          padding: '84px 92px',
        }}>
        {/*
          El nombre, en el peso más gordo que hay disponible aquí.
          `ImageResponse` no ve las fuentes de `next/font` —las sirve el navegador,
          no este renderizador—, así que la gothic expandida de la marca no entra
          sin cargar el archivo a mano. Se usa la de sistema, se acepta que la
          tarjeta no lleve la letra exacta, y a cambio no hay una fuente más que
          descargar en cada visita.
        */}
        <div style={{ display: 'flex', fontSize: 60, fontWeight: 700, letterSpacing: '-0.02em' }}>
          destrier
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 68,
              lineHeight: 1.12,
              letterSpacing: '-0.03em',
              maxWidth: 960,
            }}>
            {/*
              El titular de `#about` y no el de servicios: *«Dos tipos de trabajo,
              y los dos se construyen y después se mantienen»* solo se entiende si
              ya sabes de qué van los dos tipos. En una lista de chats, quien lo ve
              no sabe nada — hace falta la frase que dice el trato entero.
            */}
            {textos.about.titular}
          </div>

          <div style={{ display: 'flex', fontSize: 30, opacity: 0.7, maxWidth: 900 }}>
            {textos.servicios.lista.map((s) => s.titulo).join('  ·  ')}
          </div>
        </div>
      </div>
    ),
    size
  );
}
