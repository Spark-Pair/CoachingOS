import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Search } from 'lucide-react'
import QRCode from 'qrcode'
import PanelLoader from '../components/common/PanelLoader'
import useToast from '../components/common/useToast'
import { apiRequest } from '../utils/api'

function studentInitials(name) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
}

function drawCenteredText(pdf, text, x, y, maxWidth, options = {}) {
  const lines = pdf.splitTextToSize(String(text || ''), maxWidth)
  lines.forEach((line, index) => {
    pdf.text(line, x, y + (index * (options.lineHeight || 5)), { align: 'center' })
  })
  return y + (lines.length * (options.lineHeight || 5))
}

async function buildQrPdf(students) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 12
  const gap = 6
  const columns = 3
  const rows = 3
  const cardWidth = (pageWidth - (margin * 2) - (gap * (columns - 1))) / columns
  const cardHeight = (pageHeight - (margin * 2) - (gap * (rows - 1))) / rows
  const qrSize = 42

  for (let index = 0; index < students.length; index += 1) {
    if (index > 0 && index % (columns * rows) === 0) {
      pdf.addPage()
    }

    const pageIndex = index % (columns * rows)
    const column = pageIndex % columns
    const row = Math.floor(pageIndex / columns)
    const x = margin + column * (cardWidth + gap)
    const y = margin + row * (cardHeight + gap)
    const centerX = x + cardWidth / 2
    const student = students[index]
    const qrDataUrl = await QRCode.toDataURL(student.rollNo, {
      margin: 1,
      width: 320,
      color: { dark: '#0f172a', light: '#ffffff' },
    })

    pdf.setDrawColor(226, 232, 240)
    pdf.roundedRect(x, y, cardWidth, cardHeight, 2, 2)
    pdf.addImage(qrDataUrl, 'PNG', centerX - qrSize / 2, y + 8, qrSize, qrSize)

    pdf.setTextColor(15, 23, 42)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    let textY = y + 58
    textY = drawCenteredText(pdf, student.name, centerX, textY, cardWidth - 8, { lineHeight: 4.6 })

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8.5)
    textY += 1.5
    textY = drawCenteredText(pdf, `F Name: ${student.parentName || '-'}`, centerX, textY, cardWidth - 8, { lineHeight: 4.2 })
    drawCenteredText(pdf, `Class: ${student.className || '-'}`, centerX, textY + 1, cardWidth - 8, { lineHeight: 4.2 })
  }

  pdf.save(`student-qr-codes-${new Date().toISOString().slice(0, 10)}.pdf`)
}

function QrPager({ pagination, isLoading, isLocked }) {
  const currentPage = pagination?.page ?? 1
  const pageCount = pagination?.pages ?? 1
  const isPagerDisabled = isLocked || isLoading

  return (
    <div className="pager-chip">
      <button
        type="button"
        className="pager-button"
        aria-label="Previous page"
        disabled={!pagination || isPagerDisabled || currentPage <= 1}
        onClick={() => {
          if (isPagerDisabled) return
          pagination?.onChange(currentPage - 1)
        }}
      >
        <ChevronLeft size={14} />
      </button>
      <span>Page</span>
      <span className="pager-current">{currentPage}</span>
      <span>of {pageCount}</span>
      <button
        type="button"
        className="pager-button"
        aria-label="Next page"
        disabled={!pagination || isPagerDisabled || currentPage >= pageCount}
        onClick={() => {
          if (isPagerDisabled) return
          pagination?.onChange(currentPage + 1)
        }}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  )
}

function QrPanel({ children, pagination, isLoading, loadingLabel, isLocked, toolbarContent, footerLeft, footerMetric }) {
  return (
    <section className="panel-shell students-directory qr-selection-panel">
      <div className="panel-toolbar">
        <QrPager pagination={pagination} isLoading={isLoading} isLocked={isLocked} />
        <div className="panel-toolbar-actions">{toolbarContent}</div>
      </div>
      <div className="panel-content">
        {isLoading ? <PanelLoader label={loadingLabel || 'Loading...'} /> : children}
      </div>
      <div className="qr-panel-footer">
        <div className="qr-panel-footer-left">
          {footerLeft}
        </div>
        <div className="qr-panel-footer-right">{footerMetric}</div>
      </div>
    </section>
  )
}

function QrPage({ auth }) {
  const toast = useToast()
  const [classes, setClasses] = useState([])
  const [classPage, setClassPage] = useState(1)
  const [classPagination, setClassPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [totalActiveStudents, setTotalActiveStudents] = useState(0)
  const [classSearch, setClassSearch] = useState('')
  const [selectedClass, setSelectedClass] = useState(null)
  const [students, setStudents] = useState([])
  const [studentPage, setStudentPage] = useState(1)
  const [studentPagination, setStudentPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudentsById, setSelectedStudentsById] = useState({})
  const [isLoadingClasses, setIsLoadingClasses] = useState(true)
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const selectedStudents = useMemo(() => Object.values(selectedStudentsById), [selectedStudentsById])
  const visibleStudentIds = useMemo(() => students.map((student) => student.id), [students])
  const areVisibleStudentsSelected = visibleStudentIds.length > 0 && visibleStudentIds.every((id) => selectedStudentsById[id])

  const selectedCountByClass = useMemo(() => selectedStudents.reduce((lookup, student) => {
    const classId = String(student.classId || '')
    lookup[classId] = (lookup[classId] || 0) + 1
    return lookup
  }, {}), [selectedStudents])

  const loadClasses = useCallback(async () => {
    setIsLoadingClasses(true)
    setClasses([])

    const params = new URLSearchParams({
      page: String(classPage),
      status: 'Active',
      studentStatus: 'Active',
    })
    if (classSearch.trim()) params.set('search', classSearch.trim())

    try {
      const result = await apiRequest(`/classes?${params}`, { token: auth.token })
      if (classPage > result.pagination.pages) {
        setClassPage(result.pagination.pages)
        return
      }
      setClasses(result.data || [])
      setClassPagination(result.pagination)
      setTotalActiveStudents(result.summary?.assignedStudents || 0)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsLoadingClasses(false)
    }
  }, [auth.token, classPage, classSearch, toast])

  const loadStudents = useCallback(async () => {
    if (!selectedClass) return

    setIsLoadingStudents(true)
    setStudents([])

    const params = new URLSearchParams({
      page: String(studentPage),
      status: 'Active',
    })
    if (studentSearch.trim()) params.set('search', studentSearch.trim())

    try {
      const result = await apiRequest(`/classes/${selectedClass.id}/students?${params}`, { token: auth.token })
      if (studentPage > result.pagination.pages) {
        setStudentPage(result.pagination.pages)
        return
      }
      setStudents(result.data || [])
      setStudentPagination(result.pagination)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsLoadingStudents(false)
    }
  }, [auth.token, selectedClass, studentPage, studentSearch, toast])

  useEffect(() => {
    const timer = window.setTimeout(() => loadClasses(), 0)
    return () => window.clearTimeout(timer)
  }, [loadClasses])

  useEffect(() => {
    const timer = window.setTimeout(() => loadStudents(), 0)
    return () => window.clearTimeout(timer)
  }, [loadStudents])

  async function downloadPdf() {
    if (!selectedStudents.length) return

    setIsDownloading(true)
    try {
      await buildQrPdf(selectedStudents)
      toast.success('QR PDF downloaded.')
    } catch (error) {
      toast.error(error.message || 'Unable to generate QR PDF.')
    } finally {
      setIsDownloading(false)
    }
  }

  function openClass(classItem) {
    setSelectedClass(classItem)
    setStudentPage(1)
    setStudentSearch('')
    setStudents([])
    setStudentPagination({ page: 1, pages: 1, total: 0 })
  }

  function closeClass() {
    setSelectedClass(null)
    setStudentPage(1)
    setStudentSearch('')
    setStudents([])
  }

  function toggleStudent(student) {
    setSelectedStudentsById((current) => {
      if (current[student.id]) {
        const next = { ...current }
        delete next[student.id]
        return next
      }

      return { ...current, [student.id]: student }
    })
  }

  function toggleVisibleStudents() {
    setSelectedStudentsById((current) => {
      const next = { ...current }
      if (areVisibleStudentsSelected) {
        visibleStudentIds.forEach((id) => delete next[id])
        return next
      }

      students.forEach((student) => {
        next[student.id] = student
      })
      return next
    })
  }

  const isStudentView = Boolean(selectedClass)
  const isBusy = isLoadingClasses || isLoadingStudents || isDownloading

  return (
    <div className="page-layout">
      <section className="page-header qr-page-header">
        <div className="page-header-copy">
          <h1>QR Codes</h1>
          <p>{isStudentView ? selectedClass.name : 'Select a class, choose students, and download QR codes as a PDF.'}</p>
        </div>
        <div className="page-header-action">
          <button
            type="button"
            className="primary-button"
            disabled={isBusy || selectedStudents.length === 0}
            onClick={downloadPdf}
          >
            <Download size={16} />
            {isDownloading ? 'Preparing PDF...' : 'Download PDF'}
          </button>
        </div>
      </section>

      {!isStudentView ? (
        <QrPanel
          pagination={{ ...classPagination, onChange: setClassPage }}
          isLoading={isLoadingClasses}
          loadingLabel="Loading classes"
          isLocked={isDownloading}
          footerLeft={(
            <button type="button" className="qr-back-button" disabled>
              <ArrowLeft size={16} />
              Classes
            </button>
          )}
          footerMetric={(
            <div className="qr-selection-summary">
              <strong>{selectedStudents.length}</strong>
              <span>selected of {totalActiveStudents} students</span>
            </div>
          )}
          toolbarContent={(
            <label className="qr-search-field">
              <Search size={15} />
              <input
                type="search"
                value={classSearch}
                placeholder="Search classes"
                onChange={(event) => {
                  setClassSearch(event.target.value)
                  setClassPage(1)
                }}
              />
            </label>
          )}
        >
          <div className="qr-class-grid">
            {classes.length === 0 ? <p className="empty-table-copy">No active classes found.</p> : null}
            {classes.map((classItem) => {
              const selectedCount = selectedCountByClass[String(classItem.id)] || 0
              return (
                <button
                  type="button"
                  key={classItem.id}
                  className="qr-class-card"
                  onClick={() => openClass(classItem)}
                >
                  <span className="qr-class-name">{classItem.name}</span>
                  <span className="qr-class-count">Selected {selectedCount}/{classItem.studentCount} students</span>
                  <ChevronRight size={18} />
                </button>
              )
            })}
          </div>
        </QrPanel>
      ) : (
        <QrPanel
          pagination={{ ...studentPagination, onChange: setStudentPage }}
          isLoading={isLoadingStudents}
          loadingLabel="Loading students"
          isLocked={isDownloading}
          footerLeft={(
            <button type="button" className="qr-back-button" onClick={closeClass} disabled={isBusy}>
              <ArrowLeft size={16} />
              Classes
            </button>
          )}
          footerMetric={(
            <div className="qr-selection-summary">
              <strong>{selectedCountByClass[String(selectedClass.id)] || 0}</strong>
              <span>of {selectedClass.studentCount} selected</span>
            </div>
          )}
          toolbarContent={(
            <label className="qr-search-field">
              <Search size={15} />
              <input
                type="search"
                value={studentSearch}
                placeholder="Search students"
                onChange={(event) => {
                  setStudentSearch(event.target.value)
                  setStudentPage(1)
                }}
              />
            </label>
          )}
        >
          <table className="data-table qr-selection-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    aria-label="Select visible students"
                    checked={areVisibleStudentsSelected}
                    disabled={isLoadingStudents || visibleStudentIds.length === 0}
                    onChange={toggleVisibleStudents}
                  />
                </th>
                <th>Student</th>
                <th>Parent name</th>
                <th>Class</th>
              </tr>
            </thead>
            <tbody>
              {!isLoadingStudents && students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-table-copy">No active students found.</td>
                </tr>
              ) : null}
              {!isLoadingStudents && students.map((student) => (
                <tr key={student.id}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select ${student.name}`}
                      checked={Boolean(selectedStudentsById[student.id])}
                      onChange={() => toggleStudent(student)}
                    />
                  </td>
                  <td>
                    <div className="student-cell">
                      <div className="student-avatar" aria-hidden="true">
                        {studentInitials(student.name)}
                      </div>
                      <div>
                        <span className="student-name">{student.name}</span>
                        <span>{student.rollNo}</span>
                      </div>
                    </div>
                  </td>
                  <td>{student.parentName}</td>
                  <td>{student.className}</td>
                </tr>
            ))}
          </tbody>
        </table>
        </QrPanel>
      )}
    </div>
  )
}

export default QrPage
