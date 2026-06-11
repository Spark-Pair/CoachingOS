import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, ChevronRight, FileSpreadsheet, FolderKanban, ReceiptText, SlidersHorizontal, Users } from 'lucide-react'
import FilterDrawer from '../components/common/FilterDrawer'
import MultiSelect from '../components/common/MultiSelect'
import PageHeader from '../components/common/PageHeader'
import Select from '../components/common/Select'
import TablePanel from '../components/common/TablePanel'
import useToast from '../components/common/useToast'
import { API_URL, apiRequest } from '../utils/api'

const reportCategories = [
  { id: 'students', title: 'Students', detail: 'Student directory Excel export', icon: Users },
  { id: 'attendance', title: 'Attendance', detail: 'Daily and student attendance exports', icon: CalendarDays },
  { id: 'fees', title: 'Fees', detail: 'Ledgers, monthly fees, and unpaid installments', icon: ReceiptText },
  { id: 'classes', title: 'Classes', detail: 'Complete classes Excel export', icon: FolderKanban },
]

const attendanceReports = [
  {
    id: 'absentees',
    title: 'Absentees Report',
    detail: 'Students absent on a selected date, optionally filtered by class.',
  },
  {
    id: 'present',
    title: 'Present Students Report',
    detail: 'Students present on a selected date, optionally filtered by class.',
  },
  {
    id: 'student-attendance',
    title: 'Single Student Attendance Report',
    detail: 'Daily attendance for one student within a selected date range.',
  },
]

const feeReports = [
  {
    id: 'student-ledger',
    title: 'Student Fee Ledger',
    detail: 'Paid and unpaid installments for one student within a month range.',
  },
  {
    id: 'monthly-fees',
    title: 'Monthly Fees Report',
    detail: 'Paid and unpaid fees for a selected month and multiple classes.',
  },
  {
    id: 'unpaid-installments',
    title: 'All Unpaid Installments Report',
    detail: 'Every unpaid installment from each student’s joining month.',
  },
]

const statusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
]

function getTodayInputValue() {
  const today = new Date()
  const offset = today.getTimezoneOffset() * 60 * 1000
  return new Date(today.getTime() - offset).toISOString().slice(0, 10)
}

function getMonthStartValue() {
  return `${getTodayInputValue().slice(0, 7)}-01`
}

function formatMonth(month) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(`${month}-01T00:00:00`))
}

function monthValuesBetween(startMonth, endMonth) {
  if (!startMonth || !endMonth || startMonth > endMonth) return []
  const values = []
  const cursor = new Date(`${startMonth}-01T00:00:00.000Z`)
  const end = new Date(`${endMonth}-01T00:00:00.000Z`)
  while (cursor <= end) {
    values.push(cursor.toISOString().slice(0, 7))
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }
  return values
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

async function downloadReport({ token, path, params, fallbackName }) {
  const query = new URLSearchParams(params)
  const response = await fetch(`${API_URL}${path}?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Unable to download report.')
  }

  const blob = await response.blob()
  const disposition = response.headers.get('content-disposition') || ''
  const filename = disposition.match(/filename="([^"]+)"/)?.[1] || fallbackName
  downloadBlob(blob, filename)
}

function ReportRow({ title, detail, filterCount, isDownloading, onFilter, onDownload }) {
  return (
    <tr>
      <td>
        <div className="report-name-cell">
          <div className="report-category-icon"><FileSpreadsheet size={17} /></div>
          <div>
            <span className="student-name">{title}</span>
            <br />
            <span>{detail}</span>
          </div>
        </div>
      </td>
      <td>
        {onFilter ? (
          <button type="button" className="toolbar-button report-table-action" disabled={isDownloading} onClick={onFilter}>
            <SlidersHorizontal size={16} />
            Filters
            <span className="filter-number">{filterCount}</span>
          </button>
        ) : <span className="report-no-filters">No filters</span>}
      </td>
      <td><span className="report-format-pill">Excel</span></td>
      <td>
        <button type="button" className="primary-button report-table-action" disabled={isDownloading} onClick={onDownload}>
          <FileSpreadsheet size={16} />
          {isDownloading ? 'Preparing...' : 'Download'}
        </button>
      </td>
    </tr>
  )
}

function ReportsTable({ children }) {
  return (
    <table className="data-table reports-table">
      <thead>
        <tr>
          <th>Report</th>
          <th>Filters</th>
          <th>Format</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  )
}

function ReportsPage({ auth }) {
  const toast = useToast()
  const today = getTodayInputValue()
  const [activeCategory, setActiveCategory] = useState('')
  const [classOptions, setClassOptions] = useState([])
  const [studentOptions, setStudentOptions] = useState([])
  const [filterTarget, setFilterTarget] = useState('')
  const [downloadingReport, setDownloadingReport] = useState('')
  const [studentFilters, setStudentFilters] = useState({ status: 'all', classIds: [], dateFrom: '', dateTo: '' })
  const [studentDraft, setStudentDraft] = useState(studentFilters)
  const [attendanceFilters, setAttendanceFilters] = useState({
    absentees: { date: today, classIds: [] },
    present: { date: today, classIds: [] },
    'student-attendance': { studentId: '', dateFrom: getMonthStartValue(), dateTo: today },
  })
  const [attendanceDraft, setAttendanceDraft] = useState(attendanceFilters.absentees)
  const [feeFilters, setFeeFilters] = useState({
    'student-ledger': { studentId: '', monthFrom: '', monthTo: today.slice(0, 7) },
    'monthly-fees': { month: today.slice(0, 7), classIds: [] },
  })
  const [feeDraft, setFeeDraft] = useState(feeFilters['student-ledger'])
  const activeCategoryItem = reportCategories.find((category) => category.id === activeCategory)

  const selectableStudents = useMemo(
    () => studentOptions.map((student) => ({
      label: `${student.name} (${student.rollNo}) - ${student.className}`,
      value: student.id,
    })),
    [studentOptions],
  )

  const allFeeMonthOptions = useMemo(() => {
    const joiningMonths = studentOptions
      .map((student) => String(student.joiningDate || '').slice(0, 7))
      .filter(Boolean)
      .sort()
    const firstMonth = joiningMonths[0] || today.slice(0, 7)
    return monthValuesBetween(firstMonth, today.slice(0, 7))
      .reverse()
      .map((month) => ({ label: formatMonth(month), value: month }))
  }, [studentOptions, today])

  const ledgerMonthOptions = useMemo(() => {
    const student = studentOptions.find((item) => item.id === feeDraft.studentId)
    const joiningMonth = student?.joiningDate ? String(student.joiningDate).slice(0, 7) : ''
    return monthValuesBetween(joiningMonth, today.slice(0, 7))
      .reverse()
      .map((month) => ({ label: formatMonth(month), value: month }))
  }, [feeDraft.studentId, studentOptions, today])

  function studentReportFilterCount() {
    return [
      studentFilters.status !== 'all',
      studentFilters.classIds.length > 0,
      Boolean(studentFilters.dateFrom),
      Boolean(studentFilters.dateTo),
    ].filter(Boolean).length
  }

  function attendanceReportFilterCount(reportId) {
    const filters = attendanceFilters[reportId]
    if (reportId === 'student-attendance') {
      return [Boolean(filters.studentId), Boolean(filters.dateFrom), Boolean(filters.dateTo)].filter(Boolean).length
    }
    return [Boolean(filters.date), filters.classIds.length > 0].filter(Boolean).length
  }

  function feeReportFilterCount(reportId) {
    const filters = feeFilters[reportId]
    if (reportId === 'student-ledger') {
      return [Boolean(filters.studentId), Boolean(filters.monthFrom), Boolean(filters.monthTo)].filter(Boolean).length
    }
    return [Boolean(filters.month), filters.classIds.length > 0].filter(Boolean).length
  }

  const loadClassOptions = useCallback(async () => {
    try {
      const result = await apiRequest('/classes/options', { token: auth.token })
      setClassOptions(result.data || [])
    } catch (error) {
      toast.error(error.message)
    }
  }, [auth.token, setClassOptions, toast])

  const loadStudentOptions = useCallback(async () => {
    if (studentOptions.length) return
    try {
      const result = await apiRequest('/students/options', { token: auth.token })
      setStudentOptions(result.data || [])
    } catch (error) {
      toast.error(error.message)
    }
  }, [auth.token, setStudentOptions, studentOptions.length, toast])

  useEffect(() => {
    const timer = window.setTimeout(() => loadClassOptions(), 0)
    return () => window.clearTimeout(timer)
  }, [loadClassOptions])

  useEffect(() => {
    if (!['attendance', 'fees'].includes(activeCategory)) return undefined
    const timer = window.setTimeout(() => loadStudentOptions(), 0)
    return () => window.clearTimeout(timer)
  }, [activeCategory, loadStudentOptions])

  function openStudentFilters() {
    setStudentDraft(studentFilters)
    setFilterTarget('student-directory')
  }

  function openAttendanceFilters(reportId) {
    setAttendanceDraft(attendanceFilters[reportId])
    setFilterTarget(reportId)
  }

  function openFeeFilters(reportId) {
    setFeeDraft(feeFilters[reportId])
    setFilterTarget(reportId)
  }

  async function handleStudentDownload() {
    setDownloadingReport('student-directory')
    try {
      await downloadReport({
        token: auth.token,
        path: '/reports/students/student-directory.xlsx',
        params: {
          ...(studentFilters.status !== 'all' ? { status: studentFilters.status } : {}),
          ...(studentFilters.classIds.length ? { classIds: studentFilters.classIds.join(',') } : {}),
          ...(studentFilters.dateFrom ? { dateFrom: studentFilters.dateFrom } : {}),
          ...(studentFilters.dateTo ? { dateTo: studentFilters.dateTo } : {}),
        },
        fallbackName: 'student-directory.xlsx',
      })
      toast.success('Excel report downloaded.')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setDownloadingReport('')
    }
  }

  async function handleAttendanceDownload(reportId) {
    const filters = attendanceFilters[reportId]
    if (reportId === 'student-attendance' && !filters.studentId) {
      toast.error('Select a student in filters first.')
      return
    }

    setDownloadingReport(reportId)
    try {
      await downloadReport({
        token: auth.token,
        path: `/reports/attendance/${reportId}.xlsx`,
        params: reportId === 'student-attendance'
          ? filters
          : {
            date: filters.date,
            ...(filters.classIds.length ? { classIds: filters.classIds.join(',') } : {}),
          },
        fallbackName: `${reportId}.xlsx`,
      })
      toast.success('Excel report downloaded.')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setDownloadingReport('')
    }
  }

  async function handleFeeDownload(reportId) {
    const filters = feeFilters[reportId] || {}
    if (reportId === 'student-ledger' && !filters.studentId) {
      toast.error('Select a student in filters first.')
      return
    }

    setDownloadingReport(reportId)
    try {
      await downloadReport({
        token: auth.token,
        path: `/reports/fees/${reportId}.xlsx`,
        params: reportId === 'unpaid-installments'
          ? {}
          : {
            ...filters,
            ...(filters.classIds?.length ? { classIds: filters.classIds.join(',') } : {}),
          },
        fallbackName: `${reportId}.xlsx`,
      })
      toast.success('Excel report downloaded.')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setDownloadingReport('')
    }
  }

  async function handleClassesDownload() {
    setDownloadingReport('classes')
    try {
      await downloadReport({
        token: auth.token,
        path: '/reports/classes.xlsx',
        params: {},
        fallbackName: 'classes.xlsx',
      })
      toast.success('Excel report downloaded.')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setDownloadingReport('')
    }
  }

  function resetFilters() {
    if (filterTarget === 'student-directory') {
      const next = { status: 'all', classIds: [], dateFrom: '', dateTo: '' }
      setStudentDraft(next)
      setStudentFilters(next)
    } else if (filterTarget === 'student-attendance') {
      const next = { studentId: '', dateFrom: getMonthStartValue(), dateTo: today }
      setAttendanceDraft(next)
      setAttendanceFilters((current) => ({ ...current, [filterTarget]: next }))
    } else if (filterTarget === 'student-ledger') {
      const next = { studentId: '', monthFrom: '', monthTo: today.slice(0, 7) }
      setFeeDraft(next)
      setFeeFilters((current) => ({ ...current, [filterTarget]: next }))
    } else if (filterTarget === 'monthly-fees') {
      const next = { month: today.slice(0, 7), classIds: [] }
      setFeeDraft(next)
      setFeeFilters((current) => ({ ...current, [filterTarget]: next }))
    } else {
      const next = { date: today, classIds: [] }
      setAttendanceDraft(next)
      setAttendanceFilters((current) => ({ ...current, [filterTarget]: next }))
    }
    setFilterTarget('')
  }

  function applyFilters() {
    if (filterTarget === 'student-directory') {
      setStudentFilters(studentDraft)
    } else if (['student-ledger', 'monthly-fees'].includes(filterTarget)) {
      setFeeFilters((current) => ({ ...current, [filterTarget]: feeDraft }))
    } else {
      setAttendanceFilters((current) => ({ ...current, [filterTarget]: attendanceDraft }))
    }
    setFilterTarget('')
  }

  const panelFooter = (
    <div className="report-panel-footer">
      <button type="button" className="qr-back-button" onClick={() => setActiveCategory('')} disabled={Boolean(downloadingReport)}>
        <ArrowLeft size={16} />
        Categories
      </button>
    </div>
  )

  return (
    <div className="page-layout">
      <PageHeader
        title="Reports"
        subtitle={activeCategory ? `${activeCategoryItem?.title || ''} Excel reports` : 'Choose a report category.'}
      />

      {!activeCategory ? (
        <TablePanel className="students-directory reports-directory" showDefaultActions={false} showToolbar={false}>
          <div className="report-category-grid">
            {reportCategories.map((category) => {
              const Icon = category.icon
              return (
                <button type="button" key={category.id} className="report-category-row" onClick={() => setActiveCategory(category.id)}>
                  <span className="report-category-icon"><Icon size={18} /></span>
                  <span className="report-category-copy">
                    <span className="report-category-title">{category.title}</span>
                    <span className="report-category-detail">{category.detail}</span>
                  </span>
                  <ChevronRight size={18} />
                </button>
              )
            })}
          </div>
        </TablePanel>
      ) : activeCategory === 'students' ? (
        <TablePanel className="students-directory reports-directory" showDefaultActions={false} showToolbar={false} footerContent={panelFooter}>
          <ReportsTable>
            <ReportRow
              title="Student Directory Report"
              detail="Students with roll no, parent name, phone, DOB, class, group, monthly fee, joining date, and status."
              filterCount={studentReportFilterCount()}
              isDownloading={downloadingReport === 'student-directory'}
              onFilter={openStudentFilters}
              onDownload={handleStudentDownload}
            />
          </ReportsTable>
        </TablePanel>
      ) : activeCategory === 'attendance' ? (
        <TablePanel className="students-directory reports-directory" showDefaultActions={false} showToolbar={false} footerContent={panelFooter}>
          <ReportsTable>
            {attendanceReports.map((report) => (
              <ReportRow
                key={report.id}
                title={report.title}
                detail={report.detail}
                filterCount={attendanceReportFilterCount(report.id)}
                isDownloading={downloadingReport === report.id}
                onFilter={() => openAttendanceFilters(report.id)}
                onDownload={() => handleAttendanceDownload(report.id)}
              />
            ))}
          </ReportsTable>
        </TablePanel>
      ) : activeCategory === 'fees' ? (
        <TablePanel className="students-directory reports-directory" showDefaultActions={false} showToolbar={false} footerContent={panelFooter}>
          <ReportsTable>
            {feeReports.map((report) => (
              <ReportRow
                key={report.id}
                title={report.title}
                detail={report.detail}
                filterCount={report.id === 'unpaid-installments' ? 0 : feeReportFilterCount(report.id)}
                isDownloading={downloadingReport === report.id}
                onFilter={report.id === 'unpaid-installments' ? null : () => openFeeFilters(report.id)}
                onDownload={() => handleFeeDownload(report.id)}
              />
            ))}
          </ReportsTable>
        </TablePanel>
      ) : activeCategory === 'classes' ? (
        <TablePanel className="students-directory reports-directory" showDefaultActions={false} showToolbar={false} footerContent={panelFooter}>
          <ReportsTable>
            <ReportRow
              title="Classes Report"
              detail="All classes with status and active, inactive, and total student counts."
              isDownloading={downloadingReport === 'classes'}
              onDownload={handleClassesDownload}
            />
          </ReportsTable>
        </TablePanel>
      ) : (
        <TablePanel className="students-directory reports-directory" showDefaultActions={false} showToolbar={false} footerContent={panelFooter}>
          <div className="report-empty-panel">
            <span className="report-category-icon"><FileSpreadsheet size={18} /></span>
            <div>
              <h3>No Excel reports configured yet</h3>
              <p>{activeCategoryItem?.title} report types can be added here later.</p>
            </div>
          </div>
        </TablePanel>
      )}

      <FilterDrawer
        title={filterTarget === 'student-attendance'
          ? 'Student Attendance Filters'
          : filterTarget === 'student-ledger'
            ? 'Student Ledger Filters'
            : 'Report Filters'}
        isOpen={Boolean(filterTarget)}
        onClose={() => setFilterTarget('')}
        onReset={resetFilters}
        onApply={applyFilters}
        isLocked={Boolean(downloadingReport)}
      >
        {filterTarget === 'student-directory' ? (
          <>
            <Select
              label="Status"
              options={statusOptions}
              value={studentDraft.status}
              onChange={(status) => setStudentDraft((current) => ({ ...current, status }))}
            />
            <MultiSelect
              label="Classes"
              options={classOptions.map((classItem) => ({ label: classItem.name, value: classItem.id }))}
              values={studentDraft.classIds}
              onChange={(classIds) => setStudentDraft((current) => ({ ...current, classIds }))}
              placeholder="All classes"
            />
            <label className="drawer-field">
              <span>Joining Date From</span>
              <input type="date" value={studentDraft.dateFrom} onChange={(event) => setStudentDraft((current) => ({ ...current, dateFrom: event.target.value }))} />
            </label>
            <label className="drawer-field">
              <span>Joining Date To</span>
              <input type="date" value={studentDraft.dateTo} onChange={(event) => setStudentDraft((current) => ({ ...current, dateTo: event.target.value }))} />
            </label>
          </>
        ) : filterTarget === 'student-attendance' ? (
          <>
            <Select
              label="Student"
              options={selectableStudents}
              value={attendanceDraft.studentId}
              onChange={(studentId) => setAttendanceDraft((current) => ({ ...current, studentId }))}
              placeholder="Select student"
            />
            <label className="drawer-field">
              <span>Date From</span>
              <input type="date" max={today} value={attendanceDraft.dateFrom} onChange={(event) => setAttendanceDraft((current) => ({ ...current, dateFrom: event.target.value }))} />
            </label>
            <label className="drawer-field">
              <span>Date To</span>
              <input type="date" max={today} value={attendanceDraft.dateTo} onChange={(event) => setAttendanceDraft((current) => ({ ...current, dateTo: event.target.value }))} />
            </label>
          </>
        ) : filterTarget === 'student-ledger' ? (
          <>
            <Select
              label="Student"
              options={selectableStudents}
              value={feeDraft.studentId}
              onChange={(studentId) => {
                const student = studentOptions.find((item) => item.id === studentId)
                setFeeDraft((current) => ({
                  ...current,
                  studentId,
                  monthFrom: student?.joiningDate ? String(student.joiningDate).slice(0, 7) : '',
                }))
              }}
              placeholder="Select student"
            />
            <Select
              label="Month From"
              options={ledgerMonthOptions}
              value={feeDraft.monthFrom}
              onChange={(monthFrom) => setFeeDraft((current) => ({ ...current, monthFrom }))}
              placeholder={feeDraft.studentId ? 'Select month' : 'Select student first'}
              disabled={!feeDraft.studentId}
            />
            <Select
              label="Month To"
              options={ledgerMonthOptions}
              value={feeDraft.monthTo}
              onChange={(monthTo) => setFeeDraft((current) => ({ ...current, monthTo }))}
              placeholder={feeDraft.studentId ? 'Select month' : 'Select student first'}
              disabled={!feeDraft.studentId}
            />
          </>
        ) : filterTarget === 'monthly-fees' ? (
          <>
            <Select
              label="Fee Month"
              options={allFeeMonthOptions}
              value={feeDraft.month}
              onChange={(month) => setFeeDraft((current) => ({ ...current, month }))}
            />
            <MultiSelect
              label="Classes"
              options={classOptions.map((classItem) => ({ label: classItem.name, value: classItem.id }))}
              values={feeDraft.classIds}
              onChange={(classIds) => setFeeDraft((current) => ({ ...current, classIds }))}
              placeholder="All classes"
            />
          </>
        ) : filterTarget ? (
          <>
            <label className="drawer-field">
              <span>Attendance Date</span>
              <input type="date" max={today} value={attendanceDraft.date} onChange={(event) => setAttendanceDraft((current) => ({ ...current, date: event.target.value }))} />
            </label>
            <MultiSelect
              label="Classes"
              options={classOptions.map((classItem) => ({ label: classItem.name, value: classItem.id }))}
              values={attendanceDraft.classIds}
              onChange={(classIds) => setAttendanceDraft((current) => ({ ...current, classIds }))}
              placeholder="All classes"
            />
          </>
        ) : null}
      </FilterDrawer>
    </div>
  )
}

export default ReportsPage
