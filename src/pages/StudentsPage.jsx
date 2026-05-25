import { useState } from 'react'
import { CircleCheckBig, MoreHorizontal, Pencil, Plus, Power, PowerOff, Users, UsersRound } from 'lucide-react'
import ConfirmModal from '../components/common/ConfirmModal'
import ContextMenu from '../components/common/ContextMenu'
import FilterDrawer from '../components/common/FilterDrawer'
import MetricCard from '../components/common/MetricCard'
import PageHeader from '../components/common/PageHeader'
import Select from '../components/common/Select'
import StatusPill from '../components/common/StatusPill'
import TablePanel from '../components/common/TablePanel'
import StudentFormModal from '../components/students/StudentFormModal'
import { classes, students } from '../data/mockData'

function formatTableDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

const studentClassOptions = classes.map((classItem) => ({ label: classItem.name, value: classItem.name }))

const filterClassOptions = [
  { label: 'All', value: 'all' },
  ...studentClassOptions,
]

const statusOptions = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
]

function StudentsPage() {
  const [studentRows, setStudentRows] = useState(students)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const [menuState, setMenuState] = useState({ student: null, anchorRect: null })
  const [classFilter, setClassFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const activeStudents = studentRows.filter((student) => student.status === 'Active').length
  const inactiveStudents = studentRows.length - activeStudents
  const isMenuOpen = Boolean(menuState.student)
  const isStatusTargetActive = statusTarget?.status === 'Active'

  return (
    <div className="page-layout">
      <PageHeader
        title="Students"
        subtitle="Manage student profiles, class assignments, and QR-ready identities."
        action={(
          <button type="button" className="primary-button" onClick={() => setIsAddStudentOpen(true)}>
            <Plus size={16} />
            Add Student
          </button>
        )}
      />

      <section className="metric-grid students-metrics">
        <MetricCard icon={Users} label="Total students" value={studentRows.length} tone="brand" />
        <MetricCard icon={CircleCheckBig} label="Active students" value={activeStudents} tone="success" />
        <MetricCard icon={UsersRound} label="Inactive students" value={inactiveStudents} tone="danger" />
      </section>

      <TablePanel
        className="students-directory"
        panelContentHeight = "64.5vh"
        onFilterClick={() => setIsFilterOpen(true)}
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
            {studentRows.map((student, index) => (
              <tr key={student.id}>
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
                    onClick={(event) => {
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
        onClose={() => setIsFilterOpen(false)}
        onReset={() => setIsFilterOpen(false)}
        onApply={() => setIsFilterOpen(false)}
      >
        <label className="drawer-field">
          <span>Student Name</span>
          <input type="search" placeholder="Search by name" />
        </label>
        <Select label="Class" options={filterClassOptions} value={classFilter} onChange={setClassFilter} />
        <Select label="Status" options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
        <label className="drawer-field">
          <span>Date From</span>
          <input type="date" />
        </label>
        <label className="drawer-field">
          <span>Date To</span>
          <input type="date" />
        </label>
      </FilterDrawer>

      <StudentFormModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        classOptions={studentClassOptions}
      />
      <StudentFormModal
        mode="edit"
        isOpen={Boolean(editingStudent)}
        onClose={() => setEditingStudent(null)}
        classOptions={studentClassOptions}
        student={editingStudent}
      />
      <ContextMenu
        isOpen={isMenuOpen}
        anchorRect={menuState.anchorRect}
        onClose={() => setMenuState({ student: null, anchorRect: null })}
        items={menuState.student ? [
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
        onCancel={() => setStatusTarget(null)}
        onConfirm={() => {
          setStudentRows((currentRows) => currentRows.map((student) => (
            student.id === statusTarget.id
              ? { ...student, status: isStatusTargetActive ? 'Inactive' : 'Active' }
              : student
          )))
          setStatusTarget(null)
        }}
      />
    </div>
  )
}

export default StudentsPage
