import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  icon: LucideIcon
  label: string
  value: string
  detail: string
  tone?: 'green' | 'blue' | 'amber'
}

const tones = {
  green: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20',
  blue: 'bg-sky-400/10 text-sky-300 ring-sky-400/20',
  amber: 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
}

export function MetricCard({ icon: Icon, label, value, detail, tone = 'green' }: MetricCardProps) {
  return (
    <article className="rounded-2xl border border-line bg-panel/90 p-5 shadow-panel">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-400">{label}</span>
        <span className={`grid size-9 place-items-center rounded-xl ring-1 ${tones[tone]}`}>
          <Icon aria-hidden="true" size={18} />
        </span>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>
    </article>
  )
}
