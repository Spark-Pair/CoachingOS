import { useEffect, useRef, useState } from 'react'
import Modal from '../common/Modal'

function ResetPinModal({ isOpen, onClose, auth }) {
  const currentPinRef = useRef(null)
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return undefined

    const timer = window.setTimeout(() => currentPinRef.current?.focus(), 80)
    return () => window.clearTimeout(timer)
  }, [isOpen])

  const normalizePin = (value) => value.replace(/\D/g, '').slice(0, 4)

  const handleReset = async () => {
    setError('')

    if (!/^\d{4}$/.test(currentPin) || !/^\d{4}$/.test(newPin)) {
      setError('Use 4-digit PIN values.')
      return
    }

    if (newPin !== confirmPin) {
      setError('New PIN confirmation does not match.')
      return
    }

    try {
      setIsSubmitting(true)
      await auth.resetPin(currentPin, newPin)
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
      onClose()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      title="Reset Admin PIN"
      isOpen={isOpen}
      onClose={onClose}
      className="reset-pin-modal"
      footer={(
        <>
          <button type="button" className="secondary-button modal-action" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="primary-button modal-action" onClick={handleReset} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Reset PIN'}
          </button>
        </>
      )}
    >
      <form className="student-form" onSubmit={(event) => event.preventDefault()}>
        <label className="drawer-field">
          <span>Current PIN</span>
          <input
            ref={currentPinRef}
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={currentPin}
            onChange={(event) => setCurrentPin(normalizePin(event.target.value))}
            placeholder="0000"
          />
        </label>
        <label className="drawer-field">
          <span>New PIN</span>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={newPin}
            onChange={(event) => setNewPin(normalizePin(event.target.value))}
            placeholder="0000"
          />
        </label>
        <label className="drawer-field">
          <span>Confirm New PIN</span>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={confirmPin}
            onChange={(event) => setConfirmPin(normalizePin(event.target.value))}
            placeholder="0000"
          />
        </label>
        {error ? <div className="inline-alert danger">{error}</div> : null}
      </form>
    </Modal>
  )
}

export default ResetPinModal
