export function ScoreRing({ score, label, color = '#6C63FF', size = 80 }) {
  const r = (size / 2) - 8
  const circ = 2 * Math.PI * r
  const filled = circ * score
  const pct = Math.round(score * 100)

  return (
    <div className="flex flex-col items-center gap-1">
      <div style={{ width: size, height: size }} className="relative">
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#252535" strokeWidth={6} />
          <circle
            cx={size/2} cy={size/2} r={r}
            fill="none"
            stroke={color}
            strokeWidth={6}
            strokeDasharray={`${filled} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 4px ${color}60)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-700 text-scout-text" style={{ fontSize: size * 0.22 }}>
            {pct}%
          </span>
        </div>
      </div>
      <span className="text-xs text-scout-muted font-medium">{label}</span>
    </div>
  )
}

export function ScoreBar({ score, color = '#6C63FF', label }) {
  return (
    <div>
      {label && <div className="flex justify-between text-xs text-scout-muted mb-1">
        <span>{label}</span>
        <span className="font-mono" style={{ color }}>{Math.round(score * 100)}%</span>
      </div>}
      <div className="score-bar">
        <div
          className="score-bar-fill"
          style={{ width: `${score * 100}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }}
        />
      </div>
    </div>
  )
}

export function RankBadge({ rank }) {
  const colors = {
    1: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', text: '#F59E0B' },
    2: { bg: 'rgba(156,163,175,0.15)', border: 'rgba(156,163,175,0.4)', text: '#9CA3AF' },
    3: { bg: 'rgba(180,120,60,0.15)', border: 'rgba(180,120,60,0.4)', text: '#B47C3C' },
  }
  const style = colors[rank] || { bg: 'rgba(108,99,255,0.1)', border: 'rgba(108,99,255,0.3)', text: '#6C63FF' }
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-display font-700 border"
      style={{ background: style.bg, borderColor: style.border, color: style.text }}
    >
      #{rank}
    </div>
  )
}