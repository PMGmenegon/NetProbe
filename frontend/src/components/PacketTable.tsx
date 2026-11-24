import { CheckCircle2, Clock3 } from 'lucide-react'
import type { ProbeResult } from '../types'

export function PacketTable({ probes }: { probes: ProbeResult[] }) {
  const recent = [...probes].reverse().slice(0, 7)

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left">
        <thead>
          <tr className="border-b border-line text-sm text-slate-500">
            <th className="px-5 py-3 font-medium">Sequência</th>
            <th className="px-5 py-3 font-medium">Envio</th>
            <th className="px-5 py-3 font-medium">RTT</th>
            <th className="px-5 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {recent.length === 0 ? (
            <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-500">Inicie um experimento para acompanhar os pacotes.</td></tr>
          ) : recent.map((probe) => (
            <tr key={probe.sequence} className="border-b border-line/60 text-sm last:border-0">
              <td className="px-5 py-3.5 font-mono text-slate-200">#{probe.sequence + 1}</td>
              <td className="px-5 py-3.5 text-slate-400">{new Date(probe.sentAt).toLocaleTimeString('pt-BR')}</td>
              <td className="px-5 py-3.5 font-medium text-slate-200">{probe.rttMs === null ? '—' : `${probe.rttMs.toFixed(1)} ms`}</td>
              <td className="px-5 py-3.5">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${probe.status === 'received' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-300'}`}>
                  {probe.status === 'received' ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}
                  {probe.status === 'received' ? 'Recebido' : 'Timeout'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
