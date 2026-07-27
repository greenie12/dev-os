'use client'

import { useId } from 'react'

type ConfidenceBadgeProps = {
  score: number
}

export default function ConfidenceBadge({ score }: ConfidenceBadgeProps) {
  const tooltipId = useId()
  const isHigh = score >= 80
  const isMid = score >= 50 && score < 80
  const isLow = score < 50

  const className = isHigh ? 'confidence-high' : isMid ? 'confidence-mid' : 'confidence-low'

  if (!isLow) {
    return <span className={`badge ${className}`}>{score.toFixed(0)}%</span>
  }

  return (
    <span className="confidence-badge-wrap">
      <span className={`badge ${className}`} tabIndex={0} aria-describedby={tooltipId}>
        <span aria-hidden="true">⚠️</span>
        {score.toFixed(0)}%
      </span>
      <span role="tooltip" id={tooltipId} className="confidence-tooltip">
        Low confidence — we recommend verifying this in the document directly.
      </span>
    </span>
  )
}
