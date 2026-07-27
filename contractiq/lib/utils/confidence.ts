export type ConfidenceLevel = 'high' | 'mid' | 'low'

export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 80) return 'high'
  if (score >= 50) return 'mid'
  return 'low'
}

export function getConfidenceLabel(score: number): string {
  const level = getConfidenceLevel(score)
  if (level === 'high') return 'High confidence'
  if (level === 'mid') return 'Moderate confidence'
  return 'Low confidence — verify in document'
}
