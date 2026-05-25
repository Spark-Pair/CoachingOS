import { ChevronLeft, ChevronRight, Download, SlidersHorizontal } from 'lucide-react'

function TablePanel({
  title,
  subtitle,
  children,
  actionsLabel = 'Filters',
  className = '',
  panelContentHeight = '',
  toolbarContent,
  onFilterClick,
  actionIcon: ActionIcon = SlidersHorizontal,
  pagination,
}) {
  const currentPage = pagination?.page ?? 1
  const pageCount = pagination?.pages ?? 1

  return (
    <section className={`panel-shell${className ? ` ${className}` : ''}`}>
      <div className="panel-toolbar">
        <div className="pager-chip">
          <button
            type="button"
            className="pager-button"
            aria-label="Previous page"
            disabled={!pagination || currentPage <= 1}
            onClick={() => pagination?.onChange(currentPage - 1)}
          >
            <ChevronLeft size={14} />
          </button>
          <span>Page</span>
          <span className="pager-current">{currentPage}</span>
          <span>of {pageCount}</span>
          <button
            type="button"
            className="pager-button"
            aria-label="Next page"
            disabled={!pagination || currentPage >= pageCount}
            onClick={() => pagination?.onChange(currentPage + 1)}
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="panel-toolbar-actions">
          {toolbarContent}
          <button type="button" className="toolbar-button" onClick={onFilterClick}>
            <ActionIcon size={14} />
            {actionsLabel}
          </button>
          <button type="button" className="toolbar-button">
            <Download size={14} />
            Export
          </button>
        </div>
      </div>
      {title || subtitle ? (
        <div className="panel-heading">
          {title ? <h3>{title}</h3> : null}
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      ) : null}
      
      <div
        className="panel-content"
        style={panelContentHeight ? { height: panelContentHeight } : undefined}
      >
        {children}
      </div>
    </section>
  )
}

export default TablePanel
