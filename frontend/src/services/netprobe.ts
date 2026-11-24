import type { ExperimentConfig, ExperimentResult } from '../types'

export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export async function runExperiment(
  config: ExperimentConfig,
  signal?: AbortSignal,
): Promise<ExperimentResult> {
  if (!API_BASE_URL) throw new Error('VITE_API_URL não está configurada')

  const response = await fetch(`${API_BASE_URL}/experiments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
    signal,
  })

  if (!response.ok) throw new Error(`A API respondeu com status ${response.status}`)
  return (await response.json()) as ExperimentResult
}
