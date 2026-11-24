export type Scenario = 'stable' | 'variable' | 'loss'

export interface ExperimentConfig {
  host: string
  port: number
  packetCount: number
  intervalMs: number
  timeoutMs: number
  scenario: Scenario
}

export interface ProbeResult {
  sequence: number
  sentAt: string
  receivedAt: string | null
  rttMs: number | null
  status: 'received' | 'timeout'
}

export interface ExperimentResult {
  id: string
  startedAt: string
  config: ExperimentConfig
  probes: ProbeResult[]
}

export interface ProbeMetrics {
  sent: number
  received: number
  timeouts: number
  timeoutRate: number
  minRtt: number | null
  maxRtt: number | null
  averageRtt: number | null
  jitter: number | null
}
