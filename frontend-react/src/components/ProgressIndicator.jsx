export default function ProgressIndicator({ percentage = 0, size = 116 }) {
  const radius = 48
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference
  return (
    <div className="progress-ring" style={{ width: size, height: size }} aria-label={`${percentage}% profile complete`}>
      <svg viewBox="0 0 116 116" aria-hidden="true">
        <circle className="ring-track" cx="58" cy="58" r={radius} />
        <circle
          className="ring-value"
          cx="58"
          cy="58"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <strong>{percentage}%</strong>
    </div>
  )
}
