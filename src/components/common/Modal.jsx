import { useEffect } from 'react'
import { X } from 'lucide-react'
import useDisclosureTransition from '../../hooks/useDisclosureTransition'

function Modal({ title, isOpen, onClose, children, footer, className = '' }) {
  const { shouldRender, isClosing } = useDisclosureTransition(isOpen, 180)

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
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, shouldRender])

  if (!shouldRender) {
    return null
  }

  return (
    <div className={`modal-layer${isClosing ? ' closing' : ''}`} role="presentation">
      <button type="button" className="modal-backdrop" onClick={onClose} aria-label="Close modal" />
      <section className={`modal-panel${className ? ` ${className}` : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">{children}</div>

        {footer ? <div className="modal-footer">{footer}</div> : null}
      </section>
    </div>
  )
}

export default Modal
