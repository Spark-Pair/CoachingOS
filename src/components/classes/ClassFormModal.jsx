import { useEffect, useRef, useState } from 'react'
import Modal from '../common/Modal'

function ClassFormModal({ mode = 'add', isOpen, onClose, classItem, onSubmit, isSaving = false, error = '' }) {
  const nameInputRef = useRef(null)
  const [name, setName] = useState(classItem?.name ?? '')

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const timer = window.setTimeout(() => nameInputRef.current?.focus(), 80)
    return () => window.clearTimeout(timer)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setName(classItem?.name ?? '')
    }, 0)
    return () => window.clearTimeout(timer)
  }, [classItem, isOpen])

  const title = mode === 'edit' ? 'Edit Class' : 'Add Class'
  const saveLabel = mode === 'edit' ? 'Save Changes' : 'Save Class'
  const formId = mode === 'edit' ? 'edit-class-form' : 'add-class-form'

  return (
    <Modal
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      className="class-modal"
      disableClose={isSaving}
      footer={(
        <>
          <button type="button" className="secondary-button modal-action" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button type="submit" form={formId} className="primary-button modal-action" disabled={isSaving}>
            {isSaving ? 'Saving...' : saveLabel}
          </button>
        </>
      )}
    >
      <form
        id={formId}
        className="student-form"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit({ name: name.trim() })
        }}
      >
        {error ? <div className="inline-alert danger">{error}</div> : null}
        <div className="form-grid">
          <label className="drawer-field">
            <span>Class Name</span>
            <input ref={nameInputRef} type="text" required placeholder="Class name" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
        </div>
      </form>
    </Modal>
  )
}

export default ClassFormModal
