import { useEffect } from 'react'
import useDisclosureTransition from '../../hooks/useDisclosureTransition'

function ContextMenu({ isOpen, anchorRect, onClose, items = [] }) {
  const { shouldRender, isClosing } = useDisclosureTransition(isOpen, 120)

  useEffect(() => {
    if (!shouldRender) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', onClose, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', onClose, true)
    }
  }, [onClose, shouldRender])

  if (!shouldRender || !anchorRect) {
    return null
  }

  const menuStyle = {
    top: anchorRect.bottom + 6,
    left: Math.min(anchorRect.left, window.innerWidth - 190),
  }

  return (
    <div className="context-menu-layer" role="presentation">
      <button type="button" className="context-menu-backdrop" onClick={onClose} aria-label="Close menu" />
      <div className={`context-menu${isClosing ? ' closing' : ''}`} style={menuStyle} role="menu">
        {items.map((item) => {
          const Icon = item.icon

          return (
            <button
              type="button"
              key={item.label}
              className={`context-menu-item${item.tone ? ` ${item.tone}` : ''}`}
              onClick={() => {
                item.onClick()
                onClose()
              }}
              role="menuitem"
            >
              {Icon ? <Icon size={15} /> : null}
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ContextMenu
