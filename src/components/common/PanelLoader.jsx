function PanelLoader({ label = 'Loading...' }) {
  return (
    <div className="panel-loader" role="status" aria-live="polite">
      <div className="panel-loader-card">
        <div className="spinner" aria-hidden="true" />
        <div className="panel-loader-copy">
          <span className="panel-loader-title">{label}</span>
          <span className="panel-loader-subtitle">Please wait.</span>
        </div>
      </div>
    </div>
  )
}

export default PanelLoader

