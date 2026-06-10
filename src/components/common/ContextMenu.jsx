import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import useDisclosureTransition from '../../hooks/useDisclosureTransition'

function ContextMenu({ isOpen, anchorRect, onClose, items = [], isLocked = false }) {
  const { shouldRender, isClosing } = useDisclosureTransition(isOpen, 120)
  const menuRef = useRef(null)
  const [menuStyle, setMenuStyle] = useState(null)

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

  useLayoutEffect(() => {
    if (!shouldRender || !anchorRect || !menuRef.current) {
      setMenuStyle(null)
      return
    }

    const viewportMargin = 10
    const menuRect = menuRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - anchorRect.bottom
    const openUpward = spaceBelow < menuRect.height + viewportMargin

    setMenuStyle({
      top: openUpward
        ? Math.max(viewportMargin, anchorRect.top - menuRect.height - 6)
        : Math.min(anchorRect.bottom + 6, window.innerHeight - menuRect.height - viewportMargin),
      left: Math.max(
        viewportMargin,
        Math.min(anchorRect.left, window.innerWidth - menuRect.width - viewportMargin),
      ),
      transformOrigin: openUpward ? 'bottom right' : 'top right',
    })
  }, [anchorRect, items.length, shouldRender])

  if (isLocked || !shouldRender || !anchorRect) {
    return null
  }

  return (
    <div className="context-menu-layer" role="presentation">
      <button type="button" className="context-menu-backdrop" onClick={onClose} aria-label="Close menu" />
      <div
        ref={menuRef}
        className={`context-menu${isClosing ? ' closing' : ''}`}
        style={menuStyle || { top: anchorRect.bottom + 6, left: anchorRect.left, visibility: 'hidden' }}
        role="menu"
      >
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
