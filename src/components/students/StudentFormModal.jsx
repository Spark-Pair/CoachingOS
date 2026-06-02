import { useEffect, useRef, useState } from 'react'
import Modal from '../common/Modal'
import Select from '../common/Select'

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function StudentFormModal({
  mode = 'add',
  isOpen,
  onClose,
  classOptions,
  student,
  onSubmit,
  isSaving = false,
  error = '',
}) {
  const nameInputRef = useRef(null)
  const [name, setName] = useState(student?.name ?? '')
  const [parentName, setParentName] = useState(student?.parentName ?? '')
  const [rollNo, setRollNo] = useState(student?.rollNo ?? '')
  const [monthlyFee, setMonthlyFee] = useState(student?.monthlyFee ?? '')
  const [classId, setClassId] = useState(student?.classId ?? classOptions[0]?.value ?? '')
  const [joiningDate, setJoiningDate] = useState(() => getTodayInputValue())

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
      setName(student?.name ?? '')
      setParentName(student?.parentName ?? '')
      setRollNo(student?.rollNo ?? '')
      setMonthlyFee(student?.monthlyFee ?? '')
      setClassId(student?.classId ?? classOptions[0]?.value ?? '')
      setJoiningDate(student?.joiningDate ? String(student.joiningDate).slice(0, 10) : getTodayInputValue())
    }, 0)
    return () => window.clearTimeout(timer)
  }, [classOptions, isOpen, student])

  const title = mode === 'edit' ? 'Edit Student' : 'Add Student'
  const saveLabel = mode === 'edit' ? 'Save Changes' : 'Save Student'
  const formId = mode === 'edit' ? 'edit-student-form' : 'add-student-form'

  return (
    <Modal
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      className="student-modal"
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

          const payload = {
            name: name.trim(),
            parentName: parentName.trim(),
            rollNo: rollNo.trim(),
            monthlyFee: Number(monthlyFee),
            joiningDate,
            classId,
          }

          onSubmit(payload)
        }}
      >
        {error ? <div className="inline-alert danger">{error}</div> : null}
        <div className="form-grid two-columns">
          <label className="drawer-field">
            <span>Name</span>
            <input ref={nameInputRef} type="text" required placeholder="Student name" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="drawer-field">
            <span>Parent Name</span>
            <input type="text" required placeholder="Parent name" value={parentName} onChange={(event) => setParentName(event.target.value)} />
          </label>
          <label className="drawer-field">
            <span>Roll No</span>
            <input type="text" required placeholder="Roll number" value={rollNo} onChange={(event) => setRollNo(event.target.value)} />
          </label>
          <label className="drawer-field">
            <span>Monthly Fee</span>
            <input type="number" min="0" required placeholder="Monthly fee" value={monthlyFee} onChange={(event) => setMonthlyFee(event.target.value)} />
          </label>
          <Select label="Class" options={classOptions} value={classId} onChange={setClassId} />
          <label className="drawer-field">
            <span>Joining date</span>
            <input type="date" required value={joiningDate} onChange={(event) => setJoiningDate(event.target.value)} />
          </label>
        </div>
      </form>
    </Modal>
  )
}

export default StudentFormModal
