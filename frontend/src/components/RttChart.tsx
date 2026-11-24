import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ProbeResult } from '../types'

export function RttChart({ probes }: { probes: ProbeResult[] }) {
  const data = probes.map((probe) => ({ sequence: probe.sequence + 1, rtt: probe.rttMs }))

  return (
    <div className="h-72 w-full" aria-label="Gráfico de RTT por pacote">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 10, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="#1d3047" strokeDasharray="4 6" vertical={false} />
          <XAxis dataKey="sequence" stroke="#6f8198" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
          <YAxis unit=" ms" stroke="#6f8198" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
          <Tooltip
            cursor={{ stroke: '#39e6b0', strokeDasharray: '4 4' }}
            contentStyle={{ background: '#0d1a2b', border: '1px solid #2a405b', borderRadius: 12, color: '#e8eef6' }}
            formatter={(value) => [value === null ? 'Timeout' : `${Number(value).toFixed(1)} ms`, 'RTT']}
            labelFormatter={(label) => `Pacote #${label}`}
          />
          <Line
            type="monotone"
            dataKey="rtt"
            stroke="#39e6b0"
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: '#07111f', stroke: '#39e6b0', strokeWidth: 2 }}
            activeDot={{ r: 5, fill: '#39e6b0', stroke: '#07111f', strokeWidth: 2 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
