import { BrowserMultiFormatReader } from '@zxing/browser'
import { Camera, CheckCircle2, QrCode, ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiRequest } from '../utils/api'
import { formatDate } from '../utils/date'

const scanFeedbackCooldownMs = 1000

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function TeacherScanPage({ auth, mode = 'teacher' }) {
  const isAdmin = mode === 'admin'
  const adminToken = auth?.token || ''
  const [searchParams] = useSearchParams()
  const [count, setCount] = useState(0)
  const today = getTodayInputValue()
  const initialDate = isAdmin ? String(searchParams.get('date') || '').trim() : ''
  const selectedDate = isAdmin && initialDate && initialDate <= today ? initialDate : today
  const classIdFromQuery = isAdmin ? String(searchParams.get('classId') || '').trim() : ''
  const effectiveDate = isAdmin ? selectedDate : today

  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [dayOffBlocked, setDayOffBlocked] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [scanFeedback, setScanFeedback] = useState(null)
  const [message, setMessage] = useState({
    tone: 'info',
    text: 'Point camera at student QR code to mark attendance.',
  })

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const detectorTimerRef = useRef(null)
  const zxingControlsRef = useRef(null)
  const lastScanRef = useRef('')
  const submittingRef = useRef(false)
  const scanCooldownRef = useRef(false)
  const scanCooldownTimerRef = useRef(null)
  const scanFeedbackTimerRef = useRef(null)

  useEffect(() => {
    submittingRef.current = isSubmitting
  }, [isSubmitting])

  useEffect(() => () => {
    window.clearTimeout(scanCooldownTimerRef.current)
    window.clearTimeout(scanFeedbackTimerRef.current)
  }, [])

  const showScanFeedback = useCallback((scanCode, feedback) => {
    window.clearTimeout(scanCooldownTimerRef.current)
    window.clearTimeout(scanFeedbackTimerRef.current)

    scanCooldownRef.current = true
    setScanFeedback(feedback)

    scanFeedbackTimerRef.current = window.setTimeout(() => {
      setScanFeedback(null)
    }, scanFeedbackCooldownMs)

    scanCooldownTimerRef.current = window.setTimeout(() => {
      scanCooldownRef.current = false
      if (lastScanRef.current === scanCode) {
        lastScanRef.current = ''
      }
    }, scanFeedbackCooldownMs)
  }, [])

  const markAttendance = useCallback(async (scanCodeRaw) => {
    const scanCode = String(scanCodeRaw || '').trim()
    if (!scanCode) return
    if (scanCooldownRef.current) return
    if (submittingRef.current) return
    if (lastScanRef.current === scanCode) return
    if (isAdmin && !adminToken) {
      setMessage({ tone: 'warning', text: 'Admin session is missing. Please login again.' })
      return
    }

    lastScanRef.current = scanCode
    setIsSubmitting(true)
    try {
      const result = await apiRequest(isAdmin ? '/attendance/scan' : '/attendance/scan-public', {
        method: 'POST',
        ...(isAdmin ? { token: adminToken } : {}),
        body: JSON.stringify({
          code: scanCode,
          ...(isAdmin ? { date: selectedDate } : {}),
        }),
      })

      if (!result.alreadyMarked) {
        setCount((value) => value + 1)
      }

      const statusText = result.alreadyMarked ? 'Already marked' : 'Marked successfully'
      const statusTone = result.alreadyMarked ? 'info' : 'success'
      setMessage({
        tone: statusTone,
        text: `${statusText}: ${result.student.name} in ${result.student.className}.`,
      })
      showScanFeedback(scanCode, {
        tone: statusTone,
        title: 'Successfully scanned',
        text: statusText,
        detail: `${result.student.name} - ${result.student.className}`,
      })
    } catch (error) {
      setMessage({ tone: 'warning', text: error.message })
      showScanFeedback(scanCode, {
        tone: 'warning',
        title: 'Scan failed',
        text: error.message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [adminToken, isAdmin, selectedDate, showScanFeedback])

  useEffect(() => {
    let isMounted = true

    if (!isAdmin || !classIdFromQuery || !adminToken) {
      const timer = window.setTimeout(() => {
        if (isMounted) setDayOffBlocked(false)
      }, 0)
      return () => {
        isMounted = false
        window.clearTimeout(timer)
      }
    }

    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ date: selectedDate, classId: classIdFromQuery })
        const result = await apiRequest(`/attendance?${params}`, { token: adminToken })
        if (!isMounted) return
        setDayOffBlocked(Boolean(result.dayOff))
      } catch (error) {
        if (!isMounted) return
        setMessage({ tone: 'warning', text: error.message })
      }
    }, 0)

    return () => {
      isMounted = false
      window.clearTimeout(timer)
    }
  }, [adminToken, classIdFromQuery, isAdmin, selectedDate])

  useEffect(() => {
    let isMounted = true

    async function startCamera() {
      if (dayOffBlocked) {
        setCameraReady(false)
        setCameraError('')
        return
      }
      if (!videoRef.current) return
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraReady(true)
        setCameraError('')
      } catch {
        setCameraReady(false)
        setCameraError('Camera access is blocked or unavailable on this device.')
      }
    }

    const timer = window.setTimeout(() => {
      startCamera().catch(() => {})
    }, 0)

    return () => {
      isMounted = false
      window.clearTimeout(timer)
      if (detectorTimerRef.current) {
        window.clearTimeout(detectorTimerRef.current)
        detectorTimerRef.current = null
      }
      if (zxingControlsRef.current) {
        zxingControlsRef.current.stop()
        zxingControlsRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [dayOffBlocked])

  useEffect(() => {
    if (!cameraReady || dayOffBlocked || !videoRef.current) {
      return () => {}
    }

    let stopped = false

    if ('BarcodeDetector' in window) {
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
      const tick = async () => {
        if (stopped || !videoRef.current) return
        try {
          const codes = await detector.detect(videoRef.current)
          const rawValue = String(codes?.[0]?.rawValue || '').trim()
          if (rawValue) {
            await markAttendance(rawValue)
          }
        } catch {
          // Ignore transient browser detector errors and keep scanning.
        }
        detectorTimerRef.current = window.setTimeout(tick, 280)
      }
      tick()
      return () => {
        stopped = true
        if (detectorTimerRef.current) {
          window.clearTimeout(detectorTimerRef.current)
          detectorTimerRef.current = null
        }
      }
    }

    const reader = new BrowserMultiFormatReader()
    reader.decodeFromVideoDevice(undefined, videoRef.current, async (result, error, controls) => {
      if (controls) {
        zxingControlsRef.current = controls
      }
      if (result) {
        await markAttendance(result.getText())
      } else if (error) {
        setMessage({ tone: 'warning', text: 'Camera is active but QR decode failed. Keep the QR centered and steady.' })
      }
    }).catch(() => {
      setCameraError('Unable to initialize QR scanner.')
    })

    return () => {
      stopped = true
      if (zxingControlsRef.current) {
        zxingControlsRef.current.stop()
        zxingControlsRef.current = null
      }
    }
  }, [cameraReady, dayOffBlocked, markAttendance])

  return (
    <main className="scan-screen themed-scan-screen">
      <section className="scan-shell">
        <div className="scan-hero-panel">
          <div className="scan-brand-row">
            <span className="pin-brand-mark">
              <QrCode size={24} strokeWidth={2.2} />
            </span>
            <div>
              <span className="pin-brand-title">IQBAL COACHING</span>
              <span className="pin-brand-subtitle">{isAdmin ? 'Administrator attendance scan' : 'Teacher attendance scan'}</span>
            </div>
          </div>

          <div className="scan-camera-card">
            <div className="camera-frame">
              {dayOffBlocked ? (
                <div className="scan-camera-blocked">
                  <ShieldCheck size={42} strokeWidth={1.7} />
                  <span className="camera-copy">Day-off</span>
                  <span className="camera-subcopy">Selected class is day-off for this date. Scanning is disabled.</span>
                </div>
              ) : (
                <>
                  <video ref={videoRef} className="scan-camera-video" muted playsInline />
                  <div className="scan-camera-hud">
                    <Camera size={16} />
                    <span>{cameraError || (cameraReady ? 'Scanner active' : 'Connecting camera...')}</span>
                  </div>
                  {scanFeedback ? (
                    <div className={`scan-feedback-popup ${scanFeedback.tone}`} role="status">
                      <CheckCircle2 size={24} />
                      <span className="scan-feedback-title">{scanFeedback.title}</span>
                      <span className="scan-feedback-text">{scanFeedback.text}</span>
                      {scanFeedback.detail ? <span className="scan-feedback-detail">{scanFeedback.detail}</span> : null}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <div className="scan-header">
            <div>
              <div className="eyebrow">{isAdmin ? 'Protected route' : 'Public route'}</div>
              <h1>{isAdmin ? 'Admin scan' : 'Teacher scan'}</h1>
              <p className="muted-copy">{isAdmin ? `Attendance date: ${selectedDate}` : `Attendance date: ${today}`}</p>
            </div>
          </div>

          <div className="scan-stat-row">
            <div className="scan-stat">
              <span>{formatDate(new Date(`${effectiveDate}T00:00:00`))}</span>
            </div>
            <div className="scan-stat success">
              <CheckCircle2 size={16} />
              <span>Marked: {count}</span>
            </div>
          </div>

          <div className={`scan-toast ${message.tone}`}>
            <CheckCircle2 size={16} />
            <span>{message.text}</span>
          </div>
        </div>
      </section>
    </main>
  )
}

export default TeacherScanPage
