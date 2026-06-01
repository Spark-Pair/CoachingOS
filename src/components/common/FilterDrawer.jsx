import { useEffect, useRef } from 'react'
import { RotateCcw, X } from 'lucide-react'
import useDisclosureTransition from '../../hooks/useDisclosureTransition'

function FilterDrawer({
  title = 'Filters',
  isOpen,
  onClose,
  onReset,
  onApply,
  children,
  applyLabel = 'Apply',
  resetLabel = 'Reset',
  isLocked = false,
}) {
  const drawerRef = useRef(null)
  const { shouldRender, isClosing } = useDisclosureTransition(isOpen, 220)

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      drawerRef.current
        ?.querySelector('.filter-drawer-body input, .filter-drawer-body button, .filter-drawer-body [tabindex]:not([tabindex="-1"])')
        ?.focus()
    }, 80)

    return () => window.clearTimeout(timer)
  }, [isOpen])

  if (!shouldRender) {
    return null
  }

  return (
    <div className={`filter-drawer-layer${isClosing ? ' closing' : ''}`} role="presentation">
      <button
        type="button"
        className="filter-drawer-backdrop"
        onClick={() => {
          if (!isLocked) onClose()
        }}
        aria-label="Close filters"
      />
      <aside ref={drawerRef} className="filter-drawer" role="dialog" aria-modal="true" aria-labelledby="filter-drawer-title">
        <div className="filter-drawer-header">
          <h2 id="filter-drawer-title">{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close filters" disabled={isLocked}>
            <X size={18} />
          </button>
        </div>

        <div className="filter-drawer-body">
          {children}
        </div>

        <div className="filter-drawer-footer">
          <button type="button" className="secondary-button drawer-action" onClick={onReset} disabled={isLocked}>
            <RotateCcw size={16} />
            {resetLabel}
          </button>
          <button type="button" className="primary-button drawer-action" onClick={onApply} disabled={isLocked}>
            {applyLabel}
          </button>
        </div>
      </aside>
    </div>
  )
}

export default FilterDrawer
