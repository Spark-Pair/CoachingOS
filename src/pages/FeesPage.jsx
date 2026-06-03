import { useCallback, useEffect, useMemo, useState } from 'react'
import { BadgeDollarSign, CalendarDays, MoreHorizontal, ReceiptText, Trash2, Wallet } from 'lucide-react'
import ConfirmModal from '../components/common/ConfirmModal'
import ContextMenu from '../components/common/ContextMenu'
import FilterDrawer from '../components/common/FilterDrawer'
import MetricCard from '../components/common/MetricCard'
import PageHeader from '../components/common/PageHeader'
import Select from '../components/common/Select'
import TablePanel from '../components/common/TablePanel'
import useToast from '../components/common/useToast'
import RecordPaymentModal from '../components/fees/RecordPaymentModal'
import { apiRequest } from '../utils/api'

function formatMoney(amount) {
  return `Rs ${Number(amount || 0).toLocaleString()}`
}

function formatMonth(month) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(`${month}-01`))
}

function formatDate(date) {
  if (!date) return '-'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date))
}

function studentInitials(name) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
}

function FeesPage({ auth }) {
  const toast = useToast()
  const [records, setRecords] = useState([])
  const [summary, setSummary] = useState({ collected: 0, paidRecords: 0, averagePaid: 0, latestPaid: '' })
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [studentOptionsData, setStudentOptionsData] = useState([])
  const [classOptionsData, setClassOptionsData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [menuState, setMenuState] = useState({ record: null, anchorRect: null })
  const [studentDraft, setStudentDraft] = useState('all')
  const [classDraft, setClassDraft] = useState('all')
  const [dateFromDraft, setDateFromDraft] = useState('')
  const [dateToDraft, setDateToDraft] = useState('')
  const [filters, setFilters] = useState({ studentId: 'all', classId: 'all', dateFrom: '', dateTo: '' })
  const isMenuOpen = Boolean(menuState.record)
  const isBusy = isLoading || isSaving

  const studentFilterOptions = useMemo(() => [
    { label: 'All students', value: 'all' },
    ...studentOptionsData.map((student) => ({ label: `${student.name} (${student.rollNo})`, value: student.id })),
  ], [studentOptionsData])

  const classFilterOptions = useMemo(() => [
    { label: 'All classes', value: 'all' },
    ...classOptionsData.map((classItem) => ({ label: classItem.name, value: classItem.id })),
  ], [classOptionsData])

  const loadOptions = useCallback(async () => {
    const [studentResult, classResult] = await Promise.all([
      apiRequest('/students/options', { token: auth.token }),
      apiRequest('/classes/options', { token: auth.token }),
    ])
    setStudentOptionsData(studentResult.data || [])
    setClassOptionsData(classResult.data || [])
  }, [auth.token])

  const loadFees = useCallback(async () => {
    setIsLoading(true)
    setRecords([])

    const params = new URLSearchParams({ page: String(page) })
    if (filters.studentId !== 'all') params.set('studentId', filters.studentId)
    if (filters.classId !== 'all') params.set('classId', filters.classId)
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.set('dateTo', filters.dateTo)

    try {
      const result = await apiRequest(`/fees?${params}`, { token: auth.token })
      if (page > result.pagination.pages) {
        setPage(result.pagination.pages)
        return
      }
      setRecords(result.data || [])
      setPagination(result.pagination)
      setSummary(result.summary)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [auth.token, filters, page, toast])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadOptions().catch((error) => toast.error(error.message))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadOptions, toast])

  useEffect(() => {
    const timer = window.setTimeout(() => loadFees(), 0)
    return () => window.clearTimeout(timer)
  }, [loadFees])

  async function recordPayment(values) {
    setIsSaving(true)
    try {
      await apiRequest('/fees', {
        method: 'POST',
        token: auth.token,
        body: JSON.stringify(values),
      })
      toast.success('Payment recorded.')
      setIsPaymentOpen(false)
      await loadFees()
    } catch (error) {
      toast.error(error.message)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteRecord() {
    if (!deleteTarget) return

    setIsSaving(true)
    try {
      await apiRequest(`/fees/${deleteTarget.id}`, {
        method: 'DELETE',
        token: auth.token,
      })
      toast.success('Fee record deleted.')
      setDeleteTarget(null)
      await loadFees()
    } catch (error) {
      toast.error(error.message)
      setDeleteTarget(null)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="page-layout">
      <PageHeader
        title="Fees"
        subtitle="Track paid fee records with historical amounts preserved."
        action={(
          <button type="button" className="primary-button" disabled={isBusy} onClick={() => setIsPaymentOpen(true)}>
            <ReceiptText size={16} />
            Record Payment
          </button>
        )}
      />
      <section className="metric-grid compact-four">
        <MetricCard icon={Wallet} label="Collected" value={formatMoney(summary.collected)} tone="success" />
        <MetricCard icon={ReceiptText} label="Paid records" value={summary.paidRecords} tone="brand" />
        <MetricCard icon={BadgeDollarSign} label="Average paid" value={formatMoney(summary.averagePaid)} tone="info" />
        <MetricCard icon={CalendarDays} label="Latest paid" value={formatDate(summary.latestPaid)} tone="warning" />
      </section>
      <TablePanel
        className="students-directory fees-directory"
        onFilterClick={() => {
          if (!isBusy) setIsFilterOpen(true)
        }}
        pagination={{ ...pagination, onChange: setPage }}
        isLoading={isLoading}
        loadingLabel="Loading fees"
        isLocked={isSaving}
      >
        <table className="data-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Student</th>
              <th>Class</th>
              <th>Month</th>
              <th>Amount</th>
              <th>Paid date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading && records.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-table-copy">No fee records match these filters.</td>
              </tr>
            ) : null}
            {!isLoading && records.map((record, index) => (
              <tr key={record.id}>
                <td className="student-index">{String((pagination.page - 1) * 30 + index + 1).padStart(2, '0')}</td>
                <td>
                  <div className="student-cell">
                    <div className="student-avatar" aria-hidden="true">
                      {studentInitials(record.studentName)}
                    </div>
                    <div>
                      <span className="student-name">{record.studentName}</span>
                      <span>{record.rollNo}</span>
                    </div>
                  </div>
                </td>
                <td>{record.className}</td>
                <td>{formatMonth(record.month)}</td>
                <td>{formatMoney(record.amount)}</td>
                <td>{formatDate(record.paidDate)}</td>
                <td>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`More actions for ${record.studentName} fee record`}
                    disabled={isBusy}
                    onClick={(event) => {
                      if (isBusy) return
                      setMenuState({
                        record,
                        anchorRect: event.currentTarget.getBoundingClientRect(),
                      })
                    }}
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TablePanel>

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => {
          if (!isBusy) setIsFilterOpen(false)
        }}
        onReset={() => {
          setStudentDraft('all')
          setClassDraft('all')
          setDateFromDraft('')
          setDateToDraft('')
          setFilters({ studentId: 'all', classId: 'all', dateFrom: '', dateTo: '' })
          setPage(1)
          setIsFilterOpen(false)
        }}
        onApply={() => {
          setFilters({
            studentId: studentDraft,
            classId: classDraft,
            dateFrom: dateFromDraft,
            dateTo: dateToDraft,
          })
          setPage(1)
          setIsFilterOpen(false)
        }}
        isLocked={isBusy}
      >
        <Select label="Student" options={studentFilterOptions} value={studentDraft} onChange={setStudentDraft} />
        <Select label="Class" options={classFilterOptions} value={classDraft} onChange={setClassDraft} />
        <label className="drawer-field">
          <span>Date From</span>
          <input type="date" value={dateFromDraft} onChange={(event) => setDateFromDraft(event.target.value)} />
        </label>
        <label className="drawer-field">
          <span>Date To</span>
          <input type="date" value={dateToDraft} onChange={(event) => setDateToDraft(event.target.value)} />
        </label>
      </FilterDrawer>

      <RecordPaymentModal
        isOpen={isPaymentOpen}
        onClose={() => {
          if (!isSaving) setIsPaymentOpen(false)
        }}
        students={studentOptionsData}
        token={auth.token}
        onRecord={recordPayment}
        isSaving={isSaving}
      />
      <ContextMenu
        isOpen={isMenuOpen}
        anchorRect={menuState.anchorRect}
        onClose={() => setMenuState({ record: null, anchorRect: null })}
        isLocked={isBusy}
        items={menuState.record ? [
          {
            label: 'Delete',
            icon: Trash2,
            tone: 'danger',
            onClick: () => setDeleteTarget(menuState.record),
          },
        ] : []}
      />
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Fee Record"
        message="Are you sure you want to delete this fee record? This will remove it from fee calculations."
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => {
          if (!isSaving) setDeleteTarget(null)
        }}
        onConfirm={deleteRecord}
      />
    </div>
  )
}

export default FeesPage
