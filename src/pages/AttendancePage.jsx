import { useMemo, useState } from 'react'
import { CalendarDays, CircleCheckBig, Coffee, QrCode, ScanLine, UsersRound } from 'lucide-react'
import MetricCard from '../components/common/MetricCard'
import PageHeader from '../components/common/PageHeader'
import Select from '../components/common/Select'
import TablePanel from '../components/common/TablePanel'
import { classes, students } from '../data/mockData'

const attendanceStatuses = ['Present', 'Absent', 'Leave']

const classOptions = [
  { label: 'All classes', value: 'all' },
  ...classes.map((classItem) => ({ label: classItem.name, value: classItem.name })),
]

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function createInitialAttendance() {
  return students.reduce((records, student, index) => {
    records[student.id] = index % 9 === 0 ? 'Leave' : index % 5 === 0 ? 'Absent' : 'Present'
    return records
  }, {})
}

function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(() => getTodayInputValue())
  const [selectedClass, setSelectedClass] = useState('all')
  const [attendance, setAttendance] = useState(() => createInitialAttendance())

  const visibleStudents = useMemo(
    () => students.filter((student) => selectedClass === 'all' || student.className === selectedClass),
    [selectedClass],
  )

  const metrics = useMemo(() => {
    const visibleIds = new Set(visibleStudents.map((student) => student.id))
    const visibleStatuses = Object.entries(attendance)
      .filter(([studentId]) => visibleIds.has(studentId))
      .map(([, status]) => status)

    return {
      present: visibleStatuses.filter((status) => status === 'Present').length,
      absent: visibleStatuses.filter((status) => status === 'Absent').length,
      leave: visibleStatuses.filter((status) => status === 'Leave').length,
      total: visibleStudents.length,
    }
  }, [attendance, visibleStudents])

  const markDayOff = () => {
    setAttendance((currentAttendance) => {
      const nextAttendance = { ...currentAttendance }
      visibleStudents.forEach((student) => {
        nextAttendance[student.id] = 'Leave'
      })
      return nextAttendance
    })
  }

  return (
    <div className="page-layout">
      <PageHeader
        title="Attendance"
        subtitle="Track daily presence and QR-based classroom check-ins."
        action={(
          <a href="/scan" className="primary-button">
            <QrCode size={16} />
            Open Scan
          </a>
        )}
      />

      <section className="metric-grid compact-four">
        <MetricCard icon={CircleCheckBig} label="Present" value={metrics.present} tone="success" />
        <MetricCard icon={UsersRound} label="Absent" value={metrics.absent} tone="danger" />
        <MetricCard icon={Coffee} label="Leave" value={metrics.leave} tone="warning" />
        <MetricCard icon={ScanLine} label="Total students" value={metrics.total} tone="brand" />
      </section>

      <TablePanel
        className="students-directory attendance-directory"
        actionsLabel="Mark day off"
        actionIcon={CalendarDays}
        onFilterClick={markDayOff}
        toolbarContent={(
          <div className="attendance-toolbar-controls">
            <label className="attendance-date-field">
              <CalendarDays size={15} />
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                aria-label="Attendance date"
              />
            </label>
            <Select
              options={classOptions}
              value={selectedClass}
              onChange={setSelectedClass}
              placeholder="Select class"
            />
          </div>
        )}
      >
        <table className="data-table attendance-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Student</th>
              <th>Parent</th>
              <th>Class</th>
              <th>Joining date</th>
              <th>Attendance</th>
            </tr>
          </thead>
          <tbody>
            {visibleStudents.map((student, index) => (
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
                <td>{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(student.joiningDate))}</td>
                <td>
                  <div className="attendance-switch" aria-label={`Attendance for ${student.name}`}>
                    {attendanceStatuses.map((status) => (
                      <button
                        type="button"
                        key={status}
                        className={attendance[student.id] === status ? 'active' : ''}
                        onClick={() => {
                          setAttendance((currentAttendance) => ({
                            ...currentAttendance,
                            [student.id]: status,
                          }))
                        }}
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
      </TablePanel>
    </div>
  )
}

export default AttendancePage
