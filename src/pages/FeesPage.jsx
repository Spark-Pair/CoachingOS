import { useMemo, useState } from 'react'
import { BadgeDollarSign, CalendarDays, MoreHorizontal, ReceiptText, Trash2, Wallet } from 'lucide-react'
import ConfirmModal from '../components/common/ConfirmModal'
import ContextMenu from '../components/common/ContextMenu'
import FilterDrawer from '../components/common/FilterDrawer'
import MetricCard from '../components/common/MetricCard'
import PageHeader from '../components/common/PageHeader'
import Select from '../components/common/Select'
import TablePanel from '../components/common/TablePanel'
import RecordPaymentModal from '../components/fees/RecordPaymentModal'
import { classes, feeRows, students } from '../data/mockData'

const studentOptions = [
  { label: 'All students', value: 'all' },
  ...students.map((student) => ({ label: `${student.name} (${student.rollNo})`, value: student.id })),
]

const classOptions = [
  { label: 'All classes', value: 'all' },
  ...classes.map((classItem) => ({ label: classItem.name, value: classItem.name })),
]

function formatMoney(amount) {
  return `Rs ${amount.toLocaleString()}`
}

function formatMonth(month) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(`${month}-01`))
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date))
}

function FeesPage() {
  const [records, setRecords] = useState(feeRows)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [menuState, setMenuState] = useState({ record: null, anchorRect: null })
  const [studentFilter, setStudentFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const studentById = useMemo(
    () => students.reduce((lookup, student) => {
      lookup[student.id] = student
      return lookup
    }, {}),
    [],
  )

  const visibleRecords = useMemo(() => records
    .filter((record) => {
      const student = studentById[record.studentId]
      if (!student) return false
      if (studentFilter !== 'all' && record.studentId !== studentFilter) return false
      if (classFilter !== 'all' && student.className !== classFilter) return false
      if (dateFrom && record.paidDate < dateFrom) return false
      if (dateTo && record.paidDate > dateTo) return false
      return true
    })
    .sort((a, b) => b.paidDate.localeCompare(a.paidDate)), [classFilter, dateFrom, dateTo, records, studentById, studentFilter])

  const collected = visibleRecords.reduce((total, record) => total + record.amount, 0)
  const latestRecord = visibleRecords[0]
  const isMenuOpen = Boolean(menuState.record)

  return (
    <div className="page-layout">
      <PageHeader
        title="Fees"
        subtitle="Track paid fee records with historical amounts preserved."
        action={(
          <button type="button" className="primary-button" onClick={() => setIsPaymentOpen(true)}>
            <ReceiptText size={16} />
            Record Payment
          </button>
        )}
      />
      <section className="metric-grid compact-four">
        <MetricCard icon={Wallet} label="Collected" value={formatMoney(collected)} tone="success" />
        <MetricCard icon={ReceiptText} label="Paid records" value={visibleRecords.length} tone="brand" />
        <MetricCard icon={BadgeDollarSign} label="Average paid" value={formatMoney(visibleRecords.length ? Math.round(collected / visibleRecords.length) : 0)} tone="info" />
        <MetricCard icon={CalendarDays} label="Latest paid" value={latestRecord ? formatDate(latestRecord.paidDate) : '-'} tone="warning" />
      </section>
      <TablePanel
        className="students-directory fees-directory"
        onFilterClick={() => setIsFilterOpen(true)}
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
            {visibleRecords.map((record, index) => {
              const student = studentById[record.studentId]

              return (
                <tr key={record.id}>
                  <td className="student-index">{String(index + 1).padStart(2, '0')}</td>
                  <td>
                    <div className="student-cell">
                      <div className="student-avatar" aria-hidden="true">
                        {student.name.split(' ').map((part) => part[0]).join('')}
                      </div>
                      <div>
                        <span className="student-name">{student.name}</span>
                        <span>{student.rollNo}</span>
                      </div>
                    </div>
                  </td>
                  <td>{student.className}</td>
                  <td>{formatMonth(record.month)}</td>
                  <td>{formatMoney(record.amount)}</td>
                  <td>{formatDate(record.paidDate)}</td>
                  <td>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`More actions for ${student.name} fee record`}
                      onClick={(event) => {
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
              )
            })}
          </tbody>
        </table>
      </TablePanel>

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onReset={() => {
          setStudentFilter('all')
          setClassFilter('all')
          setDateFrom('')
          setDateTo('')
          setIsFilterOpen(false)
        }}
        onApply={() => setIsFilterOpen(false)}
      >
        <Select label="Student" options={studentOptions} value={studentFilter} onChange={setStudentFilter} />
        <Select label="Class" options={classOptions} value={classFilter} onChange={setClassFilter} />
        <label className="drawer-field">
          <span>Date From</span>
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        </label>
        <label className="drawer-field">
          <span>Date To</span>
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </label>
      </FilterDrawer>

      <RecordPaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        students={students}
        feeRecords={records}
        onRecord={(record) => setRecords((currentRecords) => [record, ...currentRecords])}
      />
      <ContextMenu
        isOpen={isMenuOpen}
        anchorRect={menuState.anchorRect}
        onClose={() => setMenuState({ record: null, anchorRect: null })}
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
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          setRecords((currentRecords) => currentRecords.filter((record) => record.id !== deleteTarget.id))
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}

export default FeesPage
