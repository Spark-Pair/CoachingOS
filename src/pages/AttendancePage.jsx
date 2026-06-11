import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, CircleCheckBig, Coffee, QrCode, ScanLine, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import MetricCard from '../components/common/MetricCard'
import PageHeader from '../components/common/PageHeader'
import Select from '../components/common/Select'
import TablePanel from '../components/common/TablePanel'
import { apiRequest } from '../utils/api'
import useToast from '../components/common/useToast'

const attendanceStatuses = ['Present', 'Absent', 'Leave']

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function formatTableDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

function AttendancePage({ auth }) {
  const toast = useToast()
  const [selectedDate, setSelectedDate] = useState(() => getTodayInputValue())
  const [selectedClass, setSelectedClass] = useState('')
  const [classRows, setClassRows] = useState([])
  const [students, setStudents] = useState([])
  const [summary, setSummary] = useState({ present: 0, absent: 0, leave: 0, total: 0, marked: false, dayOff: false })
  const [dayOff, setDayOff] = useState(false)
  const [marked, setMarked] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const today = getTodayInputValue()
  const isBusy = isLoading || isSaving

  const classOptions = useMemo(
    () => classRows.filter((classItem) => classItem.status === 'Active').map((classItem) => ({
      label: classItem.name,
      value: classItem.id,
    })),
    [classRows],
  )

  const loadClasses = useCallback(async () => {
    const result = await apiRequest('/classes/options', { token: auth.token })
    const nextClasses = result.data || []
    setClassRows(nextClasses)
    setSelectedClass((current) => current || nextClasses.find((classItem) => classItem.status === 'Active')?.id || '')
  }, [auth.token])

  const loadAttendance = useCallback(async () => {
    if (!selectedClass) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const params = new URLSearchParams({ date: selectedDate, classId: selectedClass })
      const result = await apiRequest(`/attendance?${params}`, { token: auth.token })
      setStudents(result.students || [])
      setSummary(result.summary)
      setDayOff(result.dayOff)
      setMarked(result.marked)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [auth.token, selectedClass, selectedDate, toast])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadClasses().catch((error) => toast.error(error.message))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadClasses, toast])

  useEffect(() => {
    const timer = window.setTimeout(() => loadAttendance(), 0)
    return () => window.clearTimeout(timer)
  }, [loadAttendance])

  async function updateStatus(studentId, status) {
    setIsSaving(true)
    try {
      await apiRequest(`/attendance/records/${studentId}`, {
        method: 'PATCH',
        token: auth.token,
        body: JSON.stringify({ date: selectedDate, classId: selectedClass, status }),
      })
      setStudents((currentRows) => currentRows.map((student) => (
        student.id === studentId ? { ...student, attendanceStatus: status } : student
      )))
      setMarked(true)
      await loadAttendance()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleDayOff() {
    setIsSaving(true)
    try {
      await apiRequest('/attendance/day-off', {
        method: 'PATCH',
        token: auth.token,
        body: JSON.stringify({ date: selectedDate, classId: selectedClass, dayOff: !dayOff }),
      })
      toast.success(!dayOff ? 'Class marked as day-off.' : 'Day-off cleared.')
      await loadAttendance()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="page-layout">
      <PageHeader
        title="Attendance"
        subtitle="Track daily presence by class with backend-saved attendance records."
        action={(
          <Link to={`/attendance/scan?date=${selectedDate}&classId=${selectedClass || ''}`} className="primary-button">
            <QrCode size={16} />
            Admin Scan
          </Link>
        )}
      />

      <section className="metric-grid compact-four">
        <MetricCard icon={CircleCheckBig} label="Present" value={summary.present} tone="success" />
        <MetricCard icon={UsersRound} label="Absent" value={summary.absent} tone="danger" />
        <MetricCard icon={Coffee} label="Leave" value={summary.leave} tone="warning" />
        <MetricCard icon={ScanLine} label="Total students" value={summary.total} tone="brand" />
      </section>

      {marked ? (
        <div className={`attendance-flag${dayOff ? ' day-off' : ''}`}>
          <CheckCircle2 size={17} />
          <span>{dayOff ? 'This class is marked as day-off for the selected date.' : 'Attendance has already been marked for this class and date.'}</span>
        </div>
      ) : null}

      <TablePanel
        className="students-directory attendance-directory"
        actionsLabel={dayOff ? 'Clear day off' : 'Mark day off'}
        actionIcon={Coffee}
        onFilterClick={toggleDayOff}
        isLoading={isLoading}
        loadingLabel="Loading attendance"
        isLocked={isSaving || !selectedClass}
        toolbarContent={(
          <div className="attendance-toolbar-controls">
            <label className="attendance-date-field">
              <CalendarDays size={15} />
              <input
                type="date"
                value={selectedDate}
                max={today}
                onChange={(event) => setSelectedDate(event.target.value > today ? today : event.target.value)}
                aria-label="Attendance date"
              />
            </label>
            <Select
              options={classOptions}
              value={selectedClass}
              onChange={setSelectedClass}
              placeholder="Select class"
              disabled={isBusy || classOptions.length === 0}
            />
          </div>
        )}
      >
        {dayOff ? (
          <div className="day-off-panel">
            <span className="icon-chip icon-chip-warning">
              <Coffee size={20} />
            </span>
            <h3>Day-off marked</h3>
            <p>No student attendance is shown because this class is closed for {formatTableDate(selectedDate)}.</p>
          </div>
        ) : (
          <table className="data-table attendance-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Student</th>
                <th>Parent</th>
                <th>Class</th>
                <th>Group</th>
                <th>Joining date</th>
                <th>Attendance</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-table-copy">No active students found for this class.</td>
                </tr>
              ) : null}
              {students.map((student, index) => (
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
                  <td>{student.group || '-'}</td>
                  <td>{formatTableDate(student.joiningDate)}</td>
                  <td>
                    <div className="attendance-switch" aria-label={`Attendance for ${student.name}`}>
                      {attendanceStatuses.map((status) => (
                        <button
                          type="button"
                          key={status}
                          disabled={isSaving}
                          className={student.attendanceStatus === status ? 'active' : ''}
                          onClick={() => updateStatus(student.id, status)}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TablePanel>
    </div>
  )
}

export default AttendancePage
