import { FormEvent, lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, BarChart3, CircleStop, Clock3, Gauge, History, Play, RadioTower,
  Router, Send, Settings2, ShieldCheck, TimerReset, Wifi, WifiOff,
} from 'lucide-react'
import { MetricCard } from './components/MetricCard'
import { PacketTable } from './components/PacketTable'
import { calculateMetrics, formatMilliseconds } from './lib/metrics'
import { API_BASE_URL, runExperiment } from './services/netprobe'
import type { ExperimentConfig, ProbeResult, Scenario } from './types'

const RttChart = lazy(() =>
  import('./components/RttChart').then((module) => ({ default: module.RttChart })),
)

const initialConfig: ExperimentConfig = {
  host: '127.0.0.1', port: 5000, packetCount: 12, intervalMs: 500,
  timeoutMs: 1000, scenario: 'stable',
}

type RunState = 'idle' | 'running' | 'completed' | 'error'

const scenarioLabels: Record<Scenario, string> = {
  stable: 'Rede estável', variable: 'Atraso variável', loss: 'Perda de pacotes',
}

function createDemoProbe(sequence: number, scenario: Scenario): ProbeResult {
  const now = Date.now()
  const lossChance = scenario === 'loss' ? 0.28 : scenario === 'variable' ? 0.06 : 0.01
  const timedOut = Math.random() < lossChance
  const base = scenario === 'variable' ? 22 + Math.random() * 70 : 18 + Math.random() * 12
  const rtt = Math.round(base * 10) / 10

  return {
    sequence,
    sentAt: new Date(now).toISOString(),
    receivedAt: timedOut ? null : new Date(now + rtt).toISOString(),
    rttMs: timedOut ? null : rtt,
    status: timedOut ? 'timeout' : 'received',
  }
}

function App() {
  const [config, setConfig] = useState(initialConfig)
  const [probes, setProbes] = useState<ProbeResult[]>([])
  const [runState, setRunState] = useState<RunState>('idle')
  const [error, setError] = useState('')
  const intervalRef = useRef<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const metrics = useMemo(() => calculateMetrics(probes), [probes])
  const progress = config.packetCount ? Math.min((probes.length / config.packetCount) * 100, 100) : 0

  const stopExperiment = () => {
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current)
    intervalRef.current = null
    abortRef.current?.abort()
    abortRef.current = null
    setRunState((current) => (current === 'running' ? 'completed' : current))
  }

  useEffect(() => stopExperiment, [])

  const runDemo = () => {
    let sequence = 0
    const cadence = Math.max(220, Math.min(config.intervalMs, 1200))
    const addProbe = () => {
      setProbes((current) => [...current, createDemoProbe(sequence, config.scenario)])
      sequence += 1
      if (sequence >= config.packetCount) {
        if (intervalRef.current !== null) window.clearInterval(intervalRef.current)
        intervalRef.current = null
        setRunState('completed')
      }
    }
    addProbe()
    if (config.packetCount > 1) intervalRef.current = window.setInterval(addProbe, cadence)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    stopExperiment()
    setProbes([])
    setError('')
    setRunState('running')

    if (!API_BASE_URL) {
      runDemo()
      return
    }

    const controller = new AbortController()
    abortRef.current = controller
    try {
      const experiment = await runExperiment(config, controller.signal)
      setProbes(experiment.probes)
      setRunState('completed')
    } catch (reason) {
      if (controller.signal.aborted) return
      setError(reason instanceof Error ? reason.message : 'Falha ao executar o experimento')
      setRunState('error')
    } finally {
      abortRef.current = null
    }
  }

  const updateNumber = (field: keyof ExperimentConfig, value: string) => {
    setConfig((current) => ({ ...current, [field]: Number(value) }))
  }

  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(50,119,167,0.16),transparent_32%),radial-gradient(circle_at_10%_90%,rgba(57,230,176,0.08),transparent_28%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-[1680px]">
        <aside className="hidden w-64 shrink-0 border-r border-line/80 bg-[#091522]/90 px-5 py-7 lg:flex lg:flex-col">
          <div className="flex items-center gap-3 px-2">
            <div className="grid size-11 place-items-center rounded-2xl bg-signal text-ink shadow-signal"><RadioTower size={23} strokeWidth={2.4} /></div>
            <div><p className="text-lg font-semibold tracking-tight text-white">NetProbe</p><p className="text-xs uppercase tracking-[0.2em] text-slate-500">UDP Monitor</p></div>
          </div>
          <nav className="mt-10 space-y-2" aria-label="Navegação principal">
            <a className="flex items-center gap-3 rounded-xl bg-signal/10 px-3 py-3 text-sm font-medium text-signal ring-1 ring-signal/15" href="#experiment"><Activity size={18} /> Experimento</a>
            <a className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white" href="#packets"><History size={18} /> Pacotes recentes</a>
          </nav>
          <div className="mt-auto rounded-2xl border border-line bg-panel/70 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
              {API_BASE_URL ? <Wifi size={16} className="text-signal" /> : <WifiOff size={16} className="text-amber-300" />}
              {API_BASE_URL ? 'API configurada' : 'Modo demonstração'}
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">{API_BASE_URL ? API_BASE_URL : 'Defina VITE_API_URL para conectar ao backend HTTP.'}</p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
          <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 lg:hidden"><RadioTower className="text-signal" size={20} /><span className="font-semibold text-white">NetProbe</span></div>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Monitor de desempenho UDP</h1>
              <p className="mt-1 text-sm text-slate-400">Meça latência, jitter e perda de pacotes em tempo real.</p>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-line bg-panel/80 px-4 py-2 text-sm text-slate-300">
              <span className={`size-2 rounded-full ${runState === 'running' ? 'animate-pulse bg-signal' : 'bg-slate-600'}`} />
              {runState === 'running' ? 'Experimento em execução' : 'Pronto para testar'}
            </div>
          </header>

          <section id="experiment" className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <form onSubmit={handleSubmit} className="min-w-0 overflow-hidden rounded-2xl border border-line bg-panel/90 p-5 shadow-panel sm:p-6">
              <div className="mb-6 flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-sky-400/10 text-sky-300 ring-1 ring-sky-400/20"><Settings2 size={19} /></span>
                <div><h2 className="font-semibold text-white">Configurar experimento</h2><p className="text-sm text-slate-500">Parâmetros do cliente UDP</p></div>
              </div>
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Servidor</span>
                  <div className="flex overflow-hidden rounded-xl border border-line bg-ink/60 focus-within:border-signal/60">
                    <span className="grid w-11 place-items-center border-r border-line text-slate-500"><Router size={17} /></span>
                    <input className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base outline-none placeholder:text-slate-600" value={config.host} onChange={(event) => setConfig((current) => ({ ...current, host: event.target.value }))} required />
                    <input aria-label="Porta" className="w-20 shrink-0 border-l border-line bg-transparent px-3 py-3 text-base outline-none sm:w-24" type="number" min="1" max="65535" value={config.port} onChange={(event) => updateNumber('port', event.target.value)} required />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Cenário</span>
                  <select className="w-full appearance-none rounded-xl border border-line bg-ink/60 px-3 py-3 text-base outline-none focus:border-signal/60" value={config.scenario} onChange={(event) => setConfig((current) => ({ ...current, scenario: event.target.value as Scenario }))}>
                    {Object.entries(scenarioLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Pacotes</span><input className="w-full rounded-xl border border-line bg-ink/60 px-3 py-3 text-base outline-none focus:border-signal/60" type="number" min="1" max="100" value={config.packetCount} onChange={(event) => updateNumber('packetCount', event.target.value)} /></label>
                  <label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Intervalo (ms)</span><input className="w-full rounded-xl border border-line bg-ink/60 px-3 py-3 text-base outline-none focus:border-signal/60" type="number" min="100" value={config.intervalMs} onChange={(event) => updateNumber('intervalMs', event.target.value)} /></label>
                </div>
                <label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Timeout (ms)</span><input className="w-full rounded-xl border border-line bg-ink/60 px-3 py-3 text-base outline-none focus:border-signal/60" type="number" min="100" value={config.timeoutMs} onChange={(event) => updateNumber('timeoutMs', event.target.value)} /></label>
              </div>
              <div className="mt-6 grid grid-cols-[1fr_auto] gap-3">
                <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-signal px-4 py-3 text-sm font-semibold text-ink transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={runState === 'running'}><Play size={17} fill="currentColor" /> Iniciar teste</button>
                <button className="grid size-12 place-items-center rounded-xl border border-line bg-white/5 text-slate-300 transition hover:border-rose-400/40 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-40" type="button" onClick={stopExperiment} disabled={runState !== 'running'} aria-label="Interromper teste"><CircleStop size={19} /></button>
              </div>
              <div className="mt-5">
                <div className="mb-2 flex justify-between text-xs text-slate-500"><span>{probes.length} de {config.packetCount} pacotes</span><span>{Math.round(progress)}%</span></div>
                <div className="h-1.5 overflow-hidden rounded-full bg-ink"><div className="h-full rounded-full bg-signal transition-all duration-300" style={{ width: `${progress}%` }} /></div>
              </div>
              {error && <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
            </form>

            <div className="min-w-0 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={Gauge} label="RTT médio" value={formatMilliseconds(metrics.averageRtt)} detail={`Mín. ${formatMilliseconds(metrics.minRtt)}`} />
                <MetricCard icon={TimerReset} label="Jitter" value={formatMilliseconds(metrics.jitter)} detail="Variação entre respostas" tone="blue" />
                <MetricCard icon={Send} label="Recebidos" value={`${metrics.received}/${metrics.sent || 0}`} detail={`${metrics.timeouts} timeout(s)`} />
                <MetricCard icon={Clock3} label="Taxa de timeout" value={`${metrics.timeoutRate.toFixed(1)}%`} detail={`RTT máx. ${formatMilliseconds(metrics.maxRtt)}`} tone="amber" />
              </div>
              <article className="rounded-2xl border border-line bg-panel/90 p-5 shadow-panel sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div><h2 className="font-semibold text-white">RTT por pacote</h2><p className="mt-1 text-sm text-slate-500">Tempo entre o envio do PING e o recebimento do PONG</p></div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-signal/10 px-3 py-1.5 text-xs font-medium text-signal"><span className="size-1.5 rounded-full bg-signal" /> RTT (ms)</span>
                </div>
                {probes.length ? (
                  <Suspense fallback={<div className="h-72 animate-pulse rounded-xl bg-ink/40" />}>
                    <RttChart probes={probes} />
                  </Suspense>
                ) : (
                  <div className="grid h-72 place-items-center rounded-xl border border-dashed border-line bg-ink/30 text-center">
                    <div><BarChart3 className="mx-auto mb-3 text-slate-600" size={28} /><p className="text-sm font-medium text-slate-400">Aguardando dados do experimento</p><p className="mt-1 text-xs text-slate-600">Os pontos de RTT aparecerão aqui.</p></div>
                  </div>
                )}
              </article>
            </div>
          </section>

          <section id="packets" className="mt-6 overflow-hidden rounded-2xl border border-line bg-panel/90 shadow-panel">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
              <div><h2 className="font-semibold text-white">Pacotes recentes</h2><p className="mt-1 text-sm text-slate-500">Últimas mensagens processadas pelo cliente</p></div>
              <div className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={15} className="text-signal" /> PING/PONG JSON sobre UDP</div>
            </div>
            <PacketTable probes={probes} />
          </section>
        </main>
      </div>
    </div>
  )
}

export default App
