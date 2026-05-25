import { CircleCheck, CircleX, Power } from 'lucide-react'
import Modal from './Modal'

function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  tone = 'default',
  onCancel,
  onConfirm,
}) {
  const Icon = tone === 'danger' ? CircleX : CircleCheck

  return (
    <Modal
      title={title}
      isOpen={isOpen}
      onClose={onCancel}
      className="confirm-modal"
      footer={(
        <>
          <button type="button" className="secondary-button modal-action" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={`${tone === 'danger' ? 'danger-outline-button' : 'primary-button'} modal-action`} onClick={onConfirm}>
            {tone === 'danger' ? <Power size={16} /> : null}
            {confirmLabel}
          </button>
        </>
      )}
    >
      <div className={`confirm-content ${tone}`}>
        <div className="confirm-icon">
          <Icon size={22} />
        </div>
        <h3>{title}</h3>
        <p className="confirm-copy">{message}</p>
      </div>
    </Modal>
  )
}

export default ConfirmModal
