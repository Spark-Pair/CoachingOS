import { useEffect, useMemo, useRef, useState } from 'react'
import Modal from '../common/Modal'
import Select from '../common/Select'

const monthOptions = [
  { label: 'January 2026', value: '2026-01' },
  { label: 'February 2026', value: '2026-02' },
  { label: 'March 2026', value: '2026-03' },
  { label: 'April 2026', value: '2026-04' },
  { label: 'May 2026', value: '2026-05' },
  { label: 'June 2026', value: '2026-06' },
]

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function RecordPaymentModal({ isOpen, onClose, students, feeRecords, onRecord }) {
  const amountRef = useRef(null)
  const studentOptions = students.map((student) => ({ label: `${student.name} (${student.rollNo})`, value: student.id }))
  const [studentId, setStudentId] = useState(studentOptions[0]?.value ?? '')
  const selectedStudent = students.find((student) => student.id === studentId)

  const unpaidMonthOptions = useMemo(() => {
    const paidMonths = new Set(feeRecords
      .filter((record) => record.studentId === studentId)
      .map((record) => record.month))

    return monthOptions.filter((month) => !paidMonths.has(month.value))
  }, [feeRecords, studentId])

  const [month, setMonth] = useState(unpaidMonthOptions[0]?.value ?? '')
  const [paidDate, setPaidDate] = useState(() => getTodayInputValue())

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const timer = window.setTimeout(() => amountRef.current?.focus(), 80)
    return () => window.clearTimeout(timer)
  }, [isOpen])

  useEffect(() => {
    if (!unpaidMonthOptions.some((option) => option.value === month)) {
      const timer = window.setTimeout(() => {
        setMonth(unpaidMonthOptions[0]?.value ?? '')
      }, 0)
      return () => window.clearTimeout(timer)
    }

    return undefined
  }, [month, unpaidMonthOptions])

  return (
    <Modal
      title="Record Payment"
      isOpen={isOpen}
      onClose={onClose}
      className="fee-modal"
      footer={(
        <>
          <button type="button" className="secondary-button modal-action" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="primary-button modal-action"
            disabled={!studentId || !month}
            onClick={() => {
              if (!selectedStudent || !month) {
                return
              }

              onRecord({
                id: `FR-${Date.now()}`,
                studentId,
                month,
                amount: selectedStudent.monthlyFee,
                paidDate,
              })
              onClose()
            }}
          >
            Save Payment
          </button>
        </>
      )}
    >
      <form className="student-form">
        <div className="form-grid two-columns">
          <Select label="Student" options={studentOptions} value={studentId} onChange={setStudentId} />
          <Select
            label="Month"
            options={unpaidMonthOptions}
            value={month}
            onChange={setMonth}
            placeholder={unpaidMonthOptions.length ? 'Select month' : 'No unpaid months'}
            disabled={!unpaidMonthOptions.length}
          />
          <label className="drawer-field">
            <span>Amount</span>
            <input ref={amountRef} type="text" value={`Rs ${(selectedStudent?.monthlyFee ?? 0).toLocaleString()}`} readOnly />
          </label>
          <label className="drawer-field">
            <span>Paid date</span>
            <input type="date" value={paidDate} onChange={(event) => setPaidDate(event.target.value)} />
          </label>
        </div>
      </form>
    </Modal>
  )
}

export default RecordPaymentModal
