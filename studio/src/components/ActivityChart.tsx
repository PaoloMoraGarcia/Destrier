'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { DailyPoint } from '@/lib/analytics';

/**
 * La curva de actividad de los últimos días.
 *
 * Dibuja todos los días del rango aunque estén a cero, porque la función que la
 * alimenta genera la rejilla completa: un gráfico con huecos sugiere una forma
 * de curva que no es la real.
 */
export function ActivityChart({ data }: { data: DailyPoint[] }) {
  const points = data.map((point) => ({
    day: point.day.slice(5),
    vistas: point.views,
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f5a623" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#f5a623" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#eeeeea" vertical={false} />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: '#8f8f88', fontFamily: 'monospace' }}
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={44}
            allowDecimals={false}
            tick={{ fontSize: 10, fill: '#8f8f88', fontFamily: 'monospace' }}
          />
          <Tooltip
            cursor={{ stroke: '#e3e3df' }}
            contentStyle={{
              borderRadius: 10,
              border: '1px solid #e3e3df',
              fontSize: 12,
              fontFamily: 'monospace',
            }}
          />
          <Area
            type="monotone"
            dataKey="vistas"
            stroke="#f5a623"
            strokeWidth={2}
            fill="url(#fill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
