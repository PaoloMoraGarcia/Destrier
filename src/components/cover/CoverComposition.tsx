import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, Path, Rect, Text as SvgText, TextPath } from 'react-native-svg';

import { colors } from '@/theme';

import { archetypeFor, COVER_VIEWBOX, CoverArchetype, fitTitle, ordinalFor } from './archetypes';

interface CoverCompositionProps {
  /** Determina qué composición toca. Misma publicación, misma portada. */
  id: string;
  title: string;
  /** Línea de metadatos: categoría, autor, lo que toque. */
  meta?: string;
  /** Blanco sobre negro, o negro sobre blanco. Nunca otra cosa. */
  polarity?: 'dark' | 'light';
  width: number;
  height: number;
  /** Forzar una composición concreta; si no, se deduce del id. */
  archetype?: CoverArchetype;
}

const { width: W, height: H } = COVER_VIEWBOX;

/**
 * Portada de una publicación.
 *
 * Blanco y negro fijos y trazo dibujado: sin color, sin degradados, sin relleno.
 * Todo son líneas de un punto y tipografía en versalitas muy espaciadas, que es
 * lo que hace que se lea como una lámina técnica y no como una miniatura de
 * vídeo.
 *
 * Se dibuja en SVG y no como imagen porque una portada tiene que existir para
 * cualquier publicación, y generarla en el cliente no cuesta ni una petición ni
 * un byte de almacenamiento.
 */
export function CoverComposition({
  id,
  title,
  meta,
  polarity = 'dark',
  width,
  height,
  archetype,
}: CoverCompositionProps) {
  const ink = polarity === 'dark' ? colors.sheet : colors.text.onLight;
  const paper = polarity === 'dark' ? colors.background : colors.sheet;
  const kind = archetype ?? archetypeFor(id);

  // El lienzo de diseño es 9:16, pero los móviles son más alargados. En vez de
  // deformar la composición o dejarla encajada con franjas muertas, se estira el
  // viewBox a la proporción real del hueco y se recentra el dibujo: las
  // proporciones de cada elemento se respetan y las esquinas caen donde deben.
  const canvasHeight = Math.round((W * height) / width);
  const shift = canvasHeight / 2 - H / 2;

  return (
    <View style={[styles.container, { width, height, backgroundColor: paper }]}>
      <Svg viewBox={`0 0 ${W} ${canvasHeight}`} width={width} height={height}>
        <Rect x={0} y={0} width={W} height={canvasHeight} fill={paper} />
        <CornerTicks ink={ink} canvasHeight={canvasHeight} />

        <G translateY={shift}>
          {kind === 'lockup' && <Lockup ink={ink} title={title} meta={meta} id={id} />}
          {kind === 'arc' && <Arc ink={ink} title={title} meta={meta} />}
          {kind === 'numbered' && <Numbered ink={ink} title={title} meta={meta} id={id} />}
          {kind === 'seal' && <Seal ink={ink} title={title} meta={meta} />}
        </G>
      </Svg>
    </View>
  );
}

/** Marcas de esquina. Encuadran la lámina y dan el aire de plano técnico. */
function CornerTicks({ ink, canvasHeight }: { ink: string; canvasHeight: number }) {
  const m = 26;
  const len = 16;
  const corners = [
    [m, m, 1, 1],
    [W - m, m, -1, 1],
    [m, canvasHeight - m, 1, -1],
    [W - m, canvasHeight - m, -1, -1],
  ];

  return (
    <G stroke={ink} strokeWidth={1} opacity={0.5}>
      {corners.map(([x, y, dx, dy], index) => (
        <G key={index}>
          <Line x1={x} y1={y} x2={x + len * dx} y2={y} />
          <Line x1={x} y1={y} x2={x} y2={y + len * dy} />
        </G>
      ))}
    </G>
  );
}

function MetaLine({ ink, text, y }: { ink: string; text: string; y: number }) {
  return (
    <SvgText
      x={W / 2}
      y={y}
      fill={ink}
      fontSize={9}
      letterSpacing={3.4}
      textAnchor="middle"
      opacity={0.65}>
      {text.toUpperCase()}
    </SvgText>
  );
}

function Lockup({
  ink,
  title,
  meta,
  id,
}: {
  ink: string;
  title: string;
  meta?: string;
  id: string;
}) {
  const { lines, fontSize } = fitTitle(title, { maxWidth: 272, maxFontSize: 30, maxLines: 3 });
  const step = fontSize * 1.28;
  const top = 300 - ((lines.length - 1) * step) / 2;

  return (
    <G>
      <Line x1={44} y1={232} x2={W - 44} y2={232} stroke={ink} strokeWidth={1} />
      <MetaLine ink={ink} text="Bihapia" y={216} />

      {lines.map((line, index) => (
        <SvgText
          key={index}
          x={W / 2}
          y={top + index * step}
          fill={ink}
          fontSize={fontSize}
          fontWeight="600"
          letterSpacing={-0.4}
          textAnchor="middle">
          {line}
        </SvgText>
      ))}

      <Line x1={44} y1={392} x2={W - 44} y2={392} stroke={ink} strokeWidth={1} />
      {meta && <MetaLine ink={ink} text={meta} y={414} />}
      <MetaLine ink={ink} text={`No. ${ordinalFor(id)}`} y={H - 60} />
    </G>
  );
}

function Arc({ ink, title, meta }: { ink: string; title: string; meta?: string }) {
  const { lines, fontSize } = fitTitle(title, { maxWidth: 208, maxFontSize: 22, maxLines: 3 });
  const step = fontSize * 1.3;
  const top = 300 - (lines.length - 1) * step;

  return (
    <G>
      {/* Semicircunferencia sobre su línea de base: la forma que más se repite
          en el pack, y la que mejor sostiene texto debajo. */}
      <Path
        d={`M60,340 A120,120 0 0 1 300,340`}
        stroke={ink}
        strokeWidth={1}
        fill="none"
      />
      <Line x1={60} y1={340} x2={300} y2={340} stroke={ink} strokeWidth={1} />

      {lines.map((line, index) => (
        <SvgText
          key={index}
          x={W / 2}
          y={top + index * step}
          fill={ink}
          fontSize={fontSize}
          fontWeight="600"
          letterSpacing={-0.2}
          textAnchor="middle">
          {line}
        </SvgText>
      ))}

      {[0, 1, 2].map((index) => (
        <Line
          key={index}
          x1={60}
          y1={366 + index * 10}
          x2={300}
          y2={366 + index * 10}
          stroke={ink}
          strokeWidth={1}
          opacity={0.28}
        />
      ))}

      {meta && <MetaLine ink={ink} text={meta} y={420} />}
    </G>
  );
}

function Numbered({
  ink,
  title,
  meta,
  id,
}: {
  ink: string;
  title: string;
  meta?: string;
  id: string;
}) {
  const { lines, fontSize } = fitTitle(title, { maxWidth: 272, maxFontSize: 18, maxLines: 3 });
  const step = fontSize * 1.4;

  return (
    <G>
      <SvgText
        x={W / 2}
        y={288}
        fill={ink}
        fontSize={118}
        fontWeight="700"
        letterSpacing={-4}
        textAnchor="middle">
        {ordinalFor(id)}
      </SvgText>

      <Line x1={90} y1={318} x2={W - 90} y2={318} stroke={ink} strokeWidth={1} />

      {lines.map((line, index) => (
        <SvgText
          key={index}
          x={W / 2}
          y={352 + index * step}
          fill={ink}
          fontSize={fontSize}
          fontWeight="500"
          textAnchor="middle">
          {line}
        </SvgText>
      ))}

      {meta && <MetaLine ink={ink} text={meta} y={H - 60} />}
    </G>
  );
}

function Seal({ ink, title, meta }: { ink: string; title: string; meta?: string }) {
  const { lines, fontSize } = fitTitle(title, { maxWidth: 150, maxFontSize: 19, maxLines: 4 });
  const step = fontSize * 1.35;
  const cx = W / 2;
  const cy = 300;

  return (
    <G>
      <Defs>
        {/* El texto del sello va sobre esta circunferencia. Empieza abajo para
            que la frase se lea de izquierda a derecha por la parte de arriba. */}
        <Path
          id="sealPath"
          d={`M${cx - 118},${cy} a118,118 0 1,1 236,0 a118,118 0 1,1 -236,0`}
        />
      </Defs>

      <Circle cx={cx} cy={cy} r={118} stroke={ink} strokeWidth={1} fill="none" />
      <Circle cx={cx} cy={cy} r={104} stroke={ink} strokeWidth={1} fill="none" opacity={0.45} />

      <SvgText fill={ink} fontSize={9} letterSpacing={4.6} opacity={0.75}>
        <TextPath href="#sealPath" startOffset="0%">
          {(meta ?? 'Bihapia').toUpperCase()}
        </TextPath>
      </SvgText>

      {/* Marcas en los cuatro puntos cardinales. */}
      {[0, 90, 180, 270].map((angle) => {
        const radians = (angle * Math.PI) / 180;
        return (
          <Circle
            key={angle}
            cx={cx + Math.cos(radians) * 118}
            cy={cy + Math.sin(radians) * 118}
            r={2.5}
            fill={ink}
          />
        );
      })}

      {lines.map((line, index) => (
        <SvgText
          key={index}
          x={cx}
          y={cy - ((lines.length - 1) * step) / 2 + index * step}
          fill={ink}
          fontSize={fontSize}
          fontWeight="600"
          textAnchor="middle">
          {line}
        </SvgText>
      ))}

      <Line x1={cx - 26} y1={cy + 44} x2={cx + 26} y2={cy + 44} stroke={ink} strokeWidth={1} />
    </G>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
