function PanelLoader({ label = 'Loading...' }) {
  return (
    <div className="panel-loader" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export default PanelLoader

