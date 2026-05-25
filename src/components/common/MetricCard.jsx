function MetricCard({ icon: Icon, label, value, tone = 'default' }) {
  return (
    <article className={`metric-card metric-card-${tone}`}>
      <div className="metric-copy">
        <span className="metric-label">{label}</span>
        <span className="metric-value">{value}</span>
      </div>
      <div className="metric-icon-wrap" aria-hidden="true">
        <span className={`icon-chip icon-chip-${tone}`}>
          <Icon size={18} strokeWidth={2} />
        </span>
      </div>
    </article>
  )
}

export default MetricCard
