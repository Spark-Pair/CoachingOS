import { Camera, ScanLine } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { students } from '../data/mockData'
import { formatDate } from '../utils/date'

function TeacherScanPage() {
  const [code, setCode] = useState('')
  const [count, setCount] = useState(12)
  const [message, setMessage] = useState({
    tone: 'info',
    text: 'Public teacher scan page ready. Camera integration is the next feature slice.',
  })

  const handleScan = (event) => {
    event.preventDefault()
    const match = students.find((student) => student.id.toLowerCase() === code.trim().toLowerCase())

    if (!code.trim()) {
      setMessage({ tone: 'warning', text: 'Enter or paste a student ID to simulate a QR scan.' })
      return
    }

    if (!match) {
      setMessage({ tone: 'warning', text: 'Unknown QR code. Keep scanning.' })
      return
    }

    setCount((value) => value + 1)
    setMessage({ tone: 'success', text: `${match.name} marked present for today in ${match.className}.` })
    setCode('')
  }

  return (
    <div className="scan-screen">
      <div className="scan-overlay">
        <div className="scan-header">
          <div>
            <div className="eyebrow scan-eyebrow">Public route</div>
            <h1>Teacher scan</h1>
          </div>
          <NavLink to="/pin" className="scan-link">
            Admin PIN
          </NavLink>
        </div>

        <div className="scan-camera">
          <div className="camera-frame">
            <Camera size={42} strokeWidth={1.8} />
            <div className="camera-copy">Mobile camera area</div>
          </div>
        </div>

        <div className="scan-footer">
          <div className="scan-pill">{formatDate()}</div>
          <div className="scan-pill success">Marked today: {count}</div>
        </div>

        <div className={`scan-toast ${message.tone}`}>
          <ScanLine size={16} />
          <span>{message.text}</span>
        </div>

        <form className="scan-form" onSubmit={handleScan}>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Simulate scan with ST-1001"
            aria-label="Simulated scan input"
          />
          <button type="submit" className="primary-button">
            Mark present
          </button>
        </form>
      </div>
    </div>
  )
}

export default TeacherScanPage
