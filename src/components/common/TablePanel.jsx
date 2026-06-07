import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import PanelLoader from './PanelLoader'

function TablePanel({
  title,
  subtitle,
  children,
  actionsLabel = 'Filters',
  className = '',
  toolbarContent,
  onFilterClick,
  actionIcon: ActionIcon = SlidersHorizontal,
  pagination,
  isLoading = false,
  loadingLabel,
  isLocked = false,
  showDefaultActions = true,
  showToolbar = true,
  footerContent,
  filterCount,
}) {
  const currentPage = pagination?.page ?? 1
  const pageCount = pagination?.pages ?? 1
  const isToolbarDisabled = isLocked || isLoading
  const isPagerDisabled = isLocked || isLoading

  return (
    <section className={`panel-shell${className ? ` ${className}` : ''}`}>
      {showToolbar ? (
        <div className="panel-toolbar">
          <div className="pager-chip">
            <button
              type="button"
              className="pager-button"
              aria-label="Previous page"
              disabled={!pagination || isPagerDisabled || currentPage <= 1}
              onClick={() => {
                if (isPagerDisabled) return
                pagination?.onChange(currentPage - 1)
              }}
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
              disabled={!pagination || isPagerDisabled || currentPage >= pageCount}
              onClick={() => {
                if (isPagerDisabled) return
                pagination?.onChange(currentPage + 1)
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="panel-toolbar-actions">
            {toolbarContent}
            {showDefaultActions ? (
              <button type="button" className="toolbar-button" onClick={onFilterClick} disabled={isToolbarDisabled}>
                <ActionIcon size={14} />
                {actionsLabel}
                {Number.isInteger(filterCount) ? <span className="filter-number">{filterCount}</span> : null}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      {title || subtitle ? (
        <div className="panel-heading">
          {title ? <h3>{title}</h3> : null}
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      ) : null}
      
      <div className="panel-content">
        {isLoading ? <PanelLoader label={loadingLabel || 'Loading...'} /> : children}
      </div>
      {footerContent ? (
        <div className="panel-footer">
          {footerContent}
        </div>
      ) : null}
    </section>
  )
}

export default TablePanel
