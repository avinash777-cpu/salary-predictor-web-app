import type { Meta, Profile, PredictError, PredictionResult } from './types'

export async function fetchMeta(): Promise<Meta> {
  const res = await fetch('/api/meta')
  if (!res.ok) throw new Error('Failed to load app metadata')
  return res.json()
}

export async function predictSalary(
  profile: Profile,
): Promise<{ data: PredictionResult; errors?: undefined } | { data?: undefined; errors: Record<string, string> }> {
  const res = await fetch('/api/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  })
  const body = (await res.json()) as PredictionResult | PredictError
  if (!res.ok) {
    return { errors: ('errors' in body && body.errors) || { general: 'Prediction failed.' } }
  }
  return { data: body as PredictionResult }
}
