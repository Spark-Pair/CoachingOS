import { useCallback, useEffect, useState } from 'react'
import Modal from '../common/Modal'
import Select from '../common/Select'
import StatusPill from '../common/StatusPill'
import TablePanel from '../common/TablePanel'
import { apiRequest } from '../../utils/api'
import useToast from '../common/useToast'

const statusOptions = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
]

function ClassStudentsModal({ classItem, token, onClose }) {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [filters, setFilters] = useState({ search: '', status: 'all' })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadStudents = useCallback(async () => {
    setIsLoading(true)
    setError('')
    setRows([])
    const params = new URLSearchParams({ page: String(page) })
    if (filters.search) params.set('search', filters.search)
    if (filters.status !== 'all') params.set('status', filters.status)

    try {
      const result = await apiRequest(`/classes/${classItem.id}/students?${params}`, { token })
      setRows(result.data)
      setPagination(result.pagination)
    } catch (requestError) {
      setError(requestError.message)
      toast.error(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [classItem.id, filters, page, toast, token])

  useEffect(() => {
    const timer = window.setTimeout(() => loadStudents(), 0)
    return () => window.clearTimeout(timer)
  }, [loadStudents])

  return (
    <Modal title={`${classItem.name} Students`} isOpen onClose={onClose} className="class-students-modal">
      <form
        className="class-students-filters"
        onSubmit={(event) => {
          event.preventDefault()
          setPage(1)
          setFilters({ search: search.trim(), status })
        }}
      >
        <label className="drawer-field">
          <span>Find student</span>
          <input type="search" value={search} placeholder="Name, roll no, parent, or group" onChange={(event) => setSearch(event.target.value)} />
        </label>
        <Select label="Status" options={statusOptions} value={status} onChange={setStatus} />
        <button type="submit" className="primary-button student-filter-action">Apply</button>
      </form>

      {error ? <div className="inline-alert danger">{error}</div> : null}
      <TablePanel
        className="class-student-table"
        title={`${pagination.total} assigned student${pagination.total === 1 ? '' : 's'}`}
        actionsLabel="Refresh"
        onFilterClick={loadStudents}
        pagination={{ ...pagination, onChange: setPage }}
        isLoading={isLoading}
        loadingLabel="Loading students"
      >
        <table className="data-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Student</th>
              <th>Parent</th>
              <th>Roll No</th>
              <th>Group</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((student, index) => (
              <tr key={student.id}>
                <td className="student-index">{(pagination.page - 1) * 30 + index + 1}</td>
                <td className="student-name">{student.name}</td>
                <td>{student.parentName || '-'}</td>
                <td>{student.rollNo || '-'}</td>
                <td>{student.group || '-'}</td>
                <td><StatusPill value={student.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && rows.length === 0 ? <p className="empty-table-copy">No students match these filters.</p> : null}
      </TablePanel>
    </Modal>
  )
}

export default ClassStudentsModal
