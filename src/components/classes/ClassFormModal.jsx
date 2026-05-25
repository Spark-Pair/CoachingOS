import { useEffect, useRef, useState } from 'react'
import Modal from '../common/Modal'
import Select from '../common/Select'

const statusOptions = [
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
]

function ClassFormModal({ mode = 'add', isOpen, onClose, classItem, onSubmit, isSaving = false, error = '' }) {
  const nameInputRef = useRef(null)
  const [name, setName] = useState(classItem?.name ?? '')
  const [sortOrder, setSortOrder] = useState(classItem?.sortOrder ?? '')
  const [status, setStatus] = useState(classItem?.status ?? 'Active')

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
      setSortOrder(classItem?.sortOrder ?? '')
      setStatus(classItem?.status ?? 'Active')
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
          onSubmit({ name: name.trim(), sortOrder: Number(sortOrder), status })
        }}
      >
        {error ? <div className="inline-alert danger">{error}</div> : null}
        <div className="form-grid two-columns">
          <label className="drawer-field">
            <span>Class Name</span>
            <input ref={nameInputRef} type="text" required placeholder="Class name" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="drawer-field">
            <span>Sort Order</span>
            <input type="number" min="1" required placeholder="Sort order" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} />
          </label>
          <Select label="Status" options={statusOptions} value={status} onChange={setStatus} />
        </div>
      </form>
    </Modal>
  )
}

export default ClassFormModal
