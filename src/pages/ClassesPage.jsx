import { useCallback, useEffect, useState } from 'react'
import { BookOpen, CircleCheckBig, MoreHorizontal, Pencil, Plus, Power, PowerOff, Users, UsersRound } from 'lucide-react'
import ClassFormModal from '../components/classes/ClassFormModal'
import ClassStudentsModal from '../components/classes/ClassStudentsModal'
import ConfirmModal from '../components/common/ConfirmModal'
import ContextMenu from '../components/common/ContextMenu'
import FilterDrawer from '../components/common/FilterDrawer'
import MetricCard from '../components/common/MetricCard'
import PageHeader from '../components/common/PageHeader'
import Select from '../components/common/Select'
import StatusPill from '../components/common/StatusPill'
import TablePanel from '../components/common/TablePanel'
import { apiRequest } from '../utils/api'

const statusOptions = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
]

function ClassesPage({ auth }) {
  const [classRows, setClassRows] = useState([])
  const [summary, setSummary] = useState({ total: 0, active: 0, inactive: 0, assignedStudents: 0 })
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isAddClassOpen, setIsAddClassOpen] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [viewingClass, setViewingClass] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const [menuState, setMenuState] = useState({ classItem: null, anchorRect: null })
  const [searchDraft, setSearchDraft] = useState('')
  const [statusDraft, setStatusDraft] = useState('all')
  const [filters, setFilters] = useState({ search: '', status: 'all' })
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const isStatusTargetActive = statusTarget?.status === 'Active'

  const loadClasses = useCallback(async () => {
    setIsLoading(true)
    setPageError('')
    const params = new URLSearchParams({ page: String(page) })
    if (filters.search) params.set('search', filters.search)
    if (filters.status !== 'all') params.set('status', filters.status)

    try {
      const result = await apiRequest(`/classes?${params}`, { token: auth.token })
      if (page > result.pagination.pages) {
        setPage(result.pagination.pages)
        return
      }
      setClassRows(result.data)
      setPagination(result.pagination)
      setSummary(result.summary)
    } catch (error) {
      setPageError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [auth.token, filters, page])

  useEffect(() => {
    const timer = window.setTimeout(() => loadClasses(), 0)
    return () => window.clearTimeout(timer)
  }, [loadClasses])

  async function saveClass(values, classId) {
    setIsSaving(true)
    setFormError('')
    try {
      await apiRequest(classId ? `/classes/${classId}` : '/classes', {
        method: classId ? 'PUT' : 'POST',
        token: auth.token,
        body: JSON.stringify(values),
      })
      setIsAddClassOpen(false)
      setEditingClass(null)
      await loadClasses()
    } catch (error) {
      setFormError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function changeStatus() {
    if (!statusTarget) return

    setPageError('')
    try {
      await apiRequest(`/classes/${statusTarget.id}/status`, {
        method: 'PATCH',
        token: auth.token,
        body: JSON.stringify({ status: isStatusTargetActive ? 'Inactive' : 'Active' }),
      })
      setStatusTarget(null)
      await loadClasses()
    } catch (error) {
      setPageError(error.message)
      setStatusTarget(null)
    }
  }

  return (
    <div className="page-layout">
      <PageHeader
        title="Classes"
        subtitle="Register classes, manage availability, and inspect assigned students."
        action={(
          <button type="button" className="primary-button" onClick={() => {
            setFormError('')
            setIsAddClassOpen(true)
          }}>
            <Plus size={16} />
            Add Class
          </button>
        )}
      />

      <section className="metric-grid compact-four">
        <MetricCard icon={BookOpen} label="Total classes" value={summary.total} tone="brand" />
        <MetricCard icon={CircleCheckBig} label="Active classes" value={summary.active} tone="success" />
        <MetricCard icon={Users} label="Assigned students" value={summary.assignedStudents} tone="info" />
        <MetricCard icon={UsersRound} label="Inactive classes" value={summary.inactive} tone="danger" />
      </section>

      {pageError ? <div className="inline-alert danger">{pageError}</div> : null}
      <TablePanel
        className="students-directory classes-directory"
        panelContentHeight="64.5vh"
        onFilterClick={() => setIsFilterOpen(true)}
        pagination={{ ...pagination, onChange: setPage }}
      >
        <table className="data-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Class</th>
              <th>Students</th>
              <th>Sort Order</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {classRows.map((classItem, index) => (
              <tr key={classItem.id}>
                <td className="student-index">{String((pagination.page - 1) * 30 + index + 1).padStart(2, '0')}</td>
                <td>
                  <div className="student-cell">
                    <div className="student-avatar class-avatar" aria-hidden="true">
                      {classItem.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
                    </div>
                    <span className="student-name">{classItem.name}</span>
                  </div>
                </td>
                <td>
                  <button type="button" className="table-link" onClick={() => setViewingClass(classItem)}>
                    {classItem.studentCount} student{classItem.studentCount === 1 ? '' : 's'}
                  </button>
                </td>
                <td>{classItem.sortOrder}</td>
                <td><StatusPill value={classItem.status} /></td>
                <td>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`More actions for ${classItem.name}`}
                    onClick={(event) => setMenuState({
                      classItem,
                      anchorRect: event.currentTarget.getBoundingClientRect(),
                    })}
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && classRows.length === 0 ? <p className="empty-table-copy">No classes match these filters.</p> : null}
        {isLoading ? <p className="empty-table-copy">Loading classes...</p> : null}
      </TablePanel>

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onReset={() => {
          setSearchDraft('')
          setStatusDraft('all')
          setFilters({ search: '', status: 'all' })
          setPage(1)
          setIsFilterOpen(false)
        }}
        onApply={() => {
          setFilters({ search: searchDraft.trim(), status: statusDraft })
          setPage(1)
          setIsFilterOpen(false)
        }}
      >
        <label className="drawer-field">
          <span>Class Name</span>
          <input type="search" value={searchDraft} placeholder="Search by class" onChange={(event) => setSearchDraft(event.target.value)} />
        </label>
        <Select label="Status" options={statusOptions} value={statusDraft} onChange={setStatusDraft} />
      </FilterDrawer>

      <ClassFormModal
        isOpen={isAddClassOpen}
        onClose={() => setIsAddClassOpen(false)}
        onSubmit={(values) => saveClass(values)}
        isSaving={isSaving}
        error={formError}
      />
      <ClassFormModal
        mode="edit"
        isOpen={Boolean(editingClass)}
        onClose={() => setEditingClass(null)}
        classItem={editingClass}
        onSubmit={(values) => saveClass(values, editingClass.id)}
        isSaving={isSaving}
        error={formError}
      />
      {viewingClass ? (
        <ClassStudentsModal classItem={viewingClass} token={auth.token} onClose={() => setViewingClass(null)} />
      ) : null}
      <ContextMenu
        isOpen={Boolean(menuState.classItem)}
        anchorRect={menuState.anchorRect}
        onClose={() => setMenuState({ classItem: null, anchorRect: null })}
        items={menuState.classItem ? [
          {
            label: 'View students',
            icon: Users,
            onClick: () => setViewingClass(menuState.classItem),
          },
          {
            label: 'Edit',
            icon: Pencil,
            onClick: () => {
              setFormError('')
              setEditingClass(menuState.classItem)
            },
          },
          {
            label: menuState.classItem.status === 'Active' ? 'Deactivate' : 'Activate',
            icon: menuState.classItem.status === 'Active' ? PowerOff : Power,
            tone: menuState.classItem.status === 'Active' ? 'danger' : 'success',
            onClick: () => setStatusTarget(menuState.classItem),
          },
        ] : []}
      />
      <ConfirmModal
        isOpen={Boolean(statusTarget)}
        title={isStatusTargetActive ? 'Deactivate Class' : 'Activate Class'}
        message={statusTarget
          ? `Are you sure you want to ${isStatusTargetActive ? 'deactivate' : 'activate'} "${statusTarget.name}"?`
          : ''}
        confirmLabel={isStatusTargetActive ? 'Deactivate' : 'Activate'}
        tone={isStatusTargetActive ? 'danger' : 'default'}
        onCancel={() => setStatusTarget(null)}
        onConfirm={changeStatus}
      />
    </div>
  )
}

export default ClassesPage
