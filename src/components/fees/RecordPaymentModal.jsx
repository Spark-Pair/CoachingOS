import { useEffect, useMemo, useState } from 'react'
import Modal from '../common/Modal'
import Select from '../common/Select'
import { apiRequest } from '../../utils/api'

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function formatMoney(amount) {
  return `Rs ${Number(amount || 0).toLocaleString()}`
}

function formatMonth(month) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(`${month}-01`))
}

function RecordPaymentModal({ isOpen, onClose, students, token, onRecord, isSaving = false }) {
  const studentOptions = useMemo(
    () => students
      .filter((student) => student.status === 'Active')
      .map((student) => ({ label: `${student.name} (${student.rollNo})`, value: student.id })),
    [students],
  )
  const [studentId, setStudentId] = useState('')
  const [month, setMonth] = useState('')
  const [paidDate, setPaidDate] = useState(() => getTodayInputValue())
  const [amount, setAmount] = useState(0)
  const [unpaidMonths, setUnpaidMonths] = useState([])
  const [isLoadingMonths, setIsLoadingMonths] = useState(false)
  const [error, setError] = useState('')

  const monthOptions = useMemo(
    () => unpaidMonths.map((monthValue) => ({ label: formatMonth(monthValue), value: monthValue })),
    [unpaidMonths],
  )

  const hasSelectedStudent = Boolean(studentId)
  const canEditDetails = hasSelectedStudent && !isLoadingMonths && !isSaving
  const canSubmit = canEditDetails && Boolean(month)

  useEffect(() => {
    if (!isOpen) {
      const timer = window.setTimeout(() => {
        setStudentId('')
        setMonth('')
        setPaidDate(getTodayInputValue())
        setAmount(0)
        setUnpaidMonths([])
        setError('')
      }, 0)
      return () => window.clearTimeout(timer)
    }

    return undefined
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !studentId) {
      return undefined
    }

    let isMounted = true

    const timer = window.setTimeout(async () => {
      if (!isMounted) return
      setIsLoadingMonths(true)
      setError('')
      setMonth('')
      setUnpaidMonths([])
      setAmount(0)

      try {
        const result = await apiRequest(`/fees/students/${studentId}/unpaid-months`, { token })
        if (!isMounted) return
        setUnpaidMonths(result.unpaidMonths || [])
        setAmount(result.amount || 0)
        setMonth(result.unpaidMonths?.[0] || '')
      } catch (requestError) {
        if (!isMounted) return
        setError(requestError.message)
      } finally {
        if (isMounted) setIsLoadingMonths(false)
      }
    }, 0)

    return () => {
      isMounted = false
      window.clearTimeout(timer)
    }
  }, [isOpen, studentId, token])

  return (
    <Modal
      title="Record Payment"
      isOpen={isOpen}
      onClose={onClose}
      className="fee-modal"
      footer={(
        <>
          <button type="button" className="secondary-button modal-action" disabled={isSaving} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="primary-button modal-action"
            disabled={!canSubmit}
            onClick={async () => {
              if (!canSubmit) return
              setError('')
              try {
                await onRecord({ studentId, month, paidDate })
              } catch (requestError) {
                setError(requestError.message)
              }
            }}
          >
            {isSaving ? 'Saving...' : 'Save Payment'}
          </button>
        </>
      )}
    >
      <form className="student-form">
        <div className="form-grid two-columns">
          <Select
            label="Student"
            options={studentOptions}
            value={studentId}
            onChange={setStudentId}
            placeholder="Select student"
            disabled={isSaving}
          />
          <Select
            label="Month"
            options={monthOptions}
            value={month}
            onChange={setMonth}
            placeholder={hasSelectedStudent ? (isLoadingMonths ? 'Loading months...' : 'No unpaid months') : 'Select student first'}
            disabled={!canEditDetails || !monthOptions.length}
          />
          <label className="drawer-field">
            <span>Amount</span>
            <input type="text" value={hasSelectedStudent ? formatMoney(amount) : ''} placeholder="Select student first" readOnly disabled={!hasSelectedStudent} />
          </label>
          <label className="drawer-field">
            <span>Paid date</span>
            <input type="date" value={paidDate} disabled={!canEditDetails} onChange={(event) => setPaidDate(event.target.value)} />
          </label>
        </div>
        {error ? <div className="inline-alert danger">{error}</div> : null}
      </form>
    </Modal>
  )
}

export default RecordPaymentModal
