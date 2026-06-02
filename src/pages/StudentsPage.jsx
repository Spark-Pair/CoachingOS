import { useCallback, useEffect, useMemo, useState } from 'react'
import { CircleCheckBig, MoreHorizontal, Pencil, Plus, Power, PowerOff, QrCode, Users, UsersRound } from 'lucide-react'
import ConfirmModal from '../components/common/ConfirmModal'
import ContextMenu from '../components/common/ContextMenu'
import FilterDrawer from '../components/common/FilterDrawer'
import MetricCard from '../components/common/MetricCard'
import PageHeader from '../components/common/PageHeader'
import Select from '../components/common/Select'
import StatusPill from '../components/common/StatusPill'
import TablePanel from '../components/common/TablePanel'
import StudentFormModal from '../components/students/StudentFormModal'
import StudentQrModal from '../components/students/StudentQrModal'
import { apiRequest } from '../utils/api'
import useToast from '../components/common/useToast'

function formatTableDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

const statusOptions = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
]

function StudentsPage({ auth }) {
  const toast = useToast()
  const [studentRows, setStudentRows] = useState([])
  const [summary, setSummary] = useState({ total: 0, active: 0, inactive: 0 })
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [classOptions, setClassOptions] = useState([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [qrStudent, setQrStudent] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const [menuState, setMenuState] = useState({ student: null, anchorRect: null })
  const [searchDraft, setSearchDraft] = useState('')
  const [classDraft, setClassDraft] = useState('all')
  const [statusDraft, setStatusDraft] = useState('all')
  const [dateFromDraft, setDateFromDraft] = useState('')
  const [dateToDraft, setDateToDraft] = useState('')
  const [filters, setFilters] = useState({ search: '', classId: 'all', status: 'all', dateFrom: '', dateTo: '' })
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const isMenuOpen = Boolean(menuState.student)
  const isStatusTargetActive = statusTarget?.status === 'Active'
  const isBusy = isLoading || isSaving

  const filterClassOptions = useMemo(() => [
    { label: 'All', value: 'all' },
    ...classOptions.map((classItem) => ({ label: classItem.name, value: classItem.id })),
  ], [classOptions])

  const studentClassOptions = useMemo(() => classOptions
    .filter((classItem) => classItem.status === 'Active')
    .map((classItem) => ({ label: classItem.name, value: classItem.id })), [classOptions])

  const loadClassOptions = useCallback(async () => {
    const result = await apiRequest('/classes/options', { token: auth.token })
    setClassOptions(result.data || [])
  }, [auth.token])

  const loadStudents = useCallback(async () => {
    setIsLoading(true)
    setStudentRows([])

    const params = new URLSearchParams({ page: String(page) })
    if (filters.search) params.set('search', filters.search)
    if (filters.status !== 'all') params.set('status', filters.status)
    if (filters.classId !== 'all') params.set('classId', filters.classId)
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.set('dateTo', filters.dateTo)

    try {
      const result = await apiRequest(`/students?${params}`, { token: auth.token })
      if (page > result.pagination.pages) {
        setPage(result.pagination.pages)
        return
      }
      setStudentRows(result.data)
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
      loadClassOptions().catch(() => {})
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadClassOptions])

  useEffect(() => {
    const timer = window.setTimeout(() => loadStudents(), 0)
    return () => window.clearTimeout(timer)
  }, [loadStudents])

  async function saveStudent(values, studentId) {
    setIsSaving(true)
    setFormError('')
    try {
      await apiRequest(studentId ? `/students/${studentId}` : '/students', {
        method: studentId ? 'PUT' : 'POST',
        token: auth.token,
        body: JSON.stringify(values),
      })

      toast.success(studentId ? 'Student updated.' : 'Student added.')
      setIsAddStudentOpen(false)
      setEditingStudent(null)
      await loadStudents()
    } catch (error) {
      setFormError(error.message)
      toast.error(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function changeStatus() {
    if (!statusTarget) return

    setIsSaving(true)
    try {
      await apiRequest(`/students/${statusTarget.id}/status`, {
        method: 'PATCH',
        token: auth.token,
        body: JSON.stringify({ status: isStatusTargetActive ? 'Inactive' : 'Active' }),
      })
      toast.success(isStatusTargetActive ? 'Student deactivated.' : 'Student activated.')
      setStatusTarget(null)
      await loadStudents()
    } catch (error) {
      toast.error(error.message)
      setStatusTarget(null)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="page-layout">
      <PageHeader
        title="Students"
        subtitle="Manage student profiles, class assignments, and QR-ready identities."
        action={(
          <button
            type="button"
            className="primary-button"
            disabled={isBusy}
            onClick={() => {
              setFormError('')
              setIsAddStudentOpen(true)
            }}
          >
            <Plus size={16} />
            Add Student
          </button>
        )}
      />

      <section className="metric-grid students-metrics">
        <MetricCard icon={Users} label="Total students" value={summary.total} tone="brand" />
        <MetricCard icon={CircleCheckBig} label="Active students" value={summary.active} tone="success" />
        <MetricCard icon={UsersRound} label="Inactive students" value={summary.inactive} tone="danger" />
      </section>

      <TablePanel
        className="students-directory"
        onFilterClick={() => {
          if (!isBusy) setIsFilterOpen(true)
        }}
        pagination={{ ...pagination, onChange: setPage }}
        isLoading={isLoading}
        loadingLabel="Loading students"
        isLocked={isSaving}
      >
        <table className="data-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Student</th>
              <th>Parent</th>
              <th>Class</th>
              <th>Monthly fee</th>
              <th>Joining date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading && studentRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-table-copy">No students match these filters.</td>
              </tr>
            ) : null}
            {!isLoading && studentRows.map((student, index) => (
              <tr key={student.id}>
                <td className="student-index">{String((pagination.page - 1) * 30 + index + 1).padStart(2, '0')}</td>
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
                <td>{student.parentName}</td>
                <td>{student.className}</td>
                <td>Rs {student.monthlyFee.toLocaleString()}</td>
                <td>{formatTableDate(student.joiningDate)}</td>
                <td><StatusPill value={student.status} /></td>
                <td>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`More actions for ${student.name}`}
                    disabled={isBusy}
                    onClick={(event) => {
                      if (isBusy) return
                      setMenuState({
                        student,
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
          setSearchDraft('')
          setClassDraft('all')
          setStatusDraft('all')
          setDateFromDraft('')
          setDateToDraft('')
          setFilters({ search: '', classId: 'all', status: 'all', dateFrom: '', dateTo: '' })
          setPage(1)
          setIsFilterOpen(false)
        }}
        onApply={() => {
          setFilters({
            search: searchDraft.trim(),
            classId: classDraft,
            status: statusDraft,
            dateFrom: dateFromDraft,
            dateTo: dateToDraft,
          })
          setPage(1)
          setIsFilterOpen(false)
        }}
        isLocked={isBusy}
      >
        <label className="drawer-field">
          <span>Student Name</span>
          <input type="search" value={searchDraft} placeholder="Search by name" onChange={(event) => setSearchDraft(event.target.value)} />
        </label>
        <Select label="Class" options={filterClassOptions} value={classDraft} onChange={setClassDraft} />
        <Select label="Status" options={statusOptions} value={statusDraft} onChange={setStatusDraft} />
        <label className="drawer-field">
          <span>Date From</span>
          <input type="date" value={dateFromDraft} onChange={(event) => setDateFromDraft(event.target.value)} />
        </label>
        <label className="drawer-field">
          <span>Date To</span>
          <input type="date" value={dateToDraft} onChange={(event) => setDateToDraft(event.target.value)} />
        </label>
      </FilterDrawer>

      <StudentFormModal
        isOpen={isAddStudentOpen}
        onClose={() => {
          if (!isSaving) setIsAddStudentOpen(false)
        }}
        classOptions={studentClassOptions}
        onSubmit={(values) => saveStudent(values)}
        isSaving={isSaving}
        error={formError}
      />
      <StudentFormModal
        mode="edit"
        isOpen={Boolean(editingStudent)}
        onClose={() => {
          if (!isSaving) setEditingStudent(null)
        }}
        classOptions={studentClassOptions}
        student={editingStudent}
        onSubmit={(values) => saveStudent(values, editingStudent.id)}
        isSaving={isSaving}
        error={formError}
      />
      <ContextMenu
        isOpen={isMenuOpen}
        anchorRect={menuState.anchorRect}
        onClose={() => setMenuState({ student: null, anchorRect: null })}
        isLocked={isBusy}
        items={menuState.student ? [
          {
            label: 'View QR',
            icon: QrCode,
            onClick: () => setQrStudent(menuState.student),
          },
          {
            label: 'Edit',
            icon: Pencil,
            onClick: () => setEditingStudent(menuState.student),
          },
          {
            label: menuState.student.status === 'Active' ? 'Deactivate' : 'Activate',
            icon: menuState.student.status === 'Active' ? PowerOff : Power,
            tone: menuState.student.status === 'Active' ? 'danger' : 'success',
            onClick: () => setStatusTarget(menuState.student),
          },
        ] : []}
      />
      <ConfirmModal
        isOpen={Boolean(statusTarget)}
        title={isStatusTargetActive ? 'Deactivate Student' : 'Activate Student'}
        message={
          statusTarget
            ? `Are you sure you want to ${isStatusTargetActive ? 'deactivate' : 'activate'} "${statusTarget.name}"?`
            : ''
        }
        confirmLabel={isStatusTargetActive ? 'Deactivate' : 'Activate'}
        tone={isStatusTargetActive ? 'danger' : 'default'}
        onCancel={() => {
          if (!isSaving) setStatusTarget(null)
        }}
        onConfirm={changeStatus}
      />
      <StudentQrModal student={qrStudent} onClose={() => setQrStudent(null)} />
    </div>
  )
}

export default StudentsPage
