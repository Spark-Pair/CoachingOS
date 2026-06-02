import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import Modal from '../common/Modal'

function StudentQrModal({ student, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    if (!student) {
      return undefined
    }

    let isMounted = true

    QRCode.toDataURL(student.rollNo, {
      margin: 1,
      width: 260,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((dataUrl) => {
        if (isMounted) setQrDataUrl(dataUrl)
      })
      .catch(() => {
        if (isMounted) setQrDataUrl('')
      })

    return () => {
      isMounted = false
    }
  }, [student])

  if (!student) return null

  return (
    <Modal
      // title={`${student.name} : ${student.rollNo}`}
      title={(
        <div>
          {student.name} <span className='chip' style={{fontSize: '12px'}}>{student.rollNo}</span>
        </div>
      )}
      isOpen={Boolean(student)}
      onClose={onClose}
      className="student-qr-modal"
      footer={(
        <button type="button" className="primary-button modal-action" onClick={onClose}>
          Done
        </button>
      )}
    >
      <div className="student-qr-preview">
        <div className="student-qr-art" aria-hidden="true">
          {qrDataUrl ? <img src={qrDataUrl} alt="" /> : <span className="muted-copy">Generating QR...</span>}
        </div>
      </div>
    </Modal>
  )
}

export default StudentQrModal
