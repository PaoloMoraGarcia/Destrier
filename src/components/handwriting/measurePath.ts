/**
 * Longitud de un trazado SVG, medida por muestreo.
 *
 * Hace falta porque la animación de escritura se hace con `strokeDasharray` +
 * `strokeDashoffset`, y para eso hay que saber cuánto mide el trazo. En web
 * existe `getTotalLength()`; en react-native-svg no hay equivalente, así que se
 * calcula aquí, una sola vez, al cargar el módulo.
 *
 * Solo entiende `M` y `C` en coordenadas absolutas, que es el subconjunto en el
 * que están escritos nuestros trazados. Si alguien añade otro comando, esta
 * función lo ignora y la longitud sale corta — y un trazo que nunca termina de
 * dibujarse es un síntoma fácil de reconocer.
 */

const SAMPLES_PER_CURVE = 24;

interface Point {
  x: number;
  y: number;
}

function cubicAt(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;

  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function measurePath(d: string): number {
  // Separa por comandos y quédate con los números de cada uno.
  const commands = d.match(/[MC][^MC]*/g) ?? [];

  let length = 0;
  let cursor: Point = { x: 0, y: 0 };

  for (const command of commands) {
    const type = command[0];
    const numbers = (command.slice(1).match(/-?\d*\.?\d+/g) ?? []).map(Number);

    if (type === 'M') {
      cursor = { x: numbers[0], y: numbers[1] };
      continue;
    }

    // Una `C` puede encadenar varias curvas seguidas: 6 números cada una.
    for (let offset = 0; offset + 5 < numbers.length; offset += 6) {
      const p1 = { x: numbers[offset], y: numbers[offset + 1] };
      const p2 = { x: numbers[offset + 2], y: numbers[offset + 3] };
      const p3 = { x: numbers[offset + 4], y: numbers[offset + 5] };

      let previous = cursor;
      for (let step = 1; step <= SAMPLES_PER_CURVE; step++) {
        const point = cubicAt(cursor, p1, p2, p3, step / SAMPLES_PER_CURVE);
        length += distance(previous, point);
        previous = point;
      }

      cursor = p3;
    }
  }

  return length;
}
