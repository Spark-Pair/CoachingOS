function PageHeader({ title, subtitle, badge, action }) {
  return (
    <section className="page-header">
      <div className="page-header-copy">
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {badge ? <div className="status-badge">{badge}</div> : null}
      </div>
      {action ? <div className="page-header-action">{action}</div> : null}
    </section>
  )
}

export default PageHeader
