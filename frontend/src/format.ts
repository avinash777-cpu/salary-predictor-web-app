const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

/** ₹22,33,000 */
export function formatINR(value: number): string {
  return inr.format(Math.round(value))
}

/** 22.3 LPA / 8.5 LPA style short form */
export function formatLPA(value: number): string {
  const lpa = value / 100_000
  if (lpa >= 100) return `₹${(lpa / 100).toFixed(2)} Cr`
  return `₹${lpa.toFixed(1)} LPA`
}

/** Compact number for axis labels: 12.5L, 1.2Cr */
export function compactINR(value: number): string {
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(1)} Cr`
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(1)} L`
  return formatINR(value)
}

export const FEATURE_LABELS: Record<string, string> = {
  experience_years: 'Experience',
  education: 'Education',
  job_title: 'Job role',
  city: 'Location',
  company_size: 'Company size',
  industry: 'Industry',
}

export function labelFor(feature: string): string {
  return FEATURE_LABELS[feature] ?? feature
}
