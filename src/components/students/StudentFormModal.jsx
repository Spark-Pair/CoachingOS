import { useEffect, useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import Modal from '../common/Modal'
import Select from '../common/Select'

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function StudentFormModal({ mode = 'add', isOpen, onClose, classOptions, student }) {
  const nameInputRef = useRef(null)
  const [picturePreview, setPicturePreview] = useState('')
  const [className, setClassName] = useState(student?.className ?? classOptions[0]?.value ?? '')
  const [joiningDate, setJoiningDate] = useState(() => getTodayInputValue())

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const timer = window.setTimeout(() => nameInputRef.current?.focus(), 80)
    return () => window.clearTimeout(timer)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setClassName(student?.className ?? classOptions[0]?.value ?? '')
      setJoiningDate(student?.joiningDate ?? getTodayInputValue())
      if (!student) {
        setPicturePreview((currentPreview) => {
          if (currentPreview) {
            URL.revokeObjectURL(currentPreview)
          }
          return ''
        })
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [classOptions, isOpen, student])

  useEffect(() => () => {
    if (picturePreview) {
      URL.revokeObjectURL(picturePreview)
    }
  }, [picturePreview])

  const title = mode === 'edit' ? 'Edit Student' : 'Add Student'
  const saveLabel = mode === 'edit' ? 'Save Changes' : 'Save Student'

  return (
    <Modal
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      className="student-modal"
      footer={(
        <>
          <button type="button" className="secondary-button modal-action" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="primary-button modal-action" onClick={onClose}>
            {saveLabel}
          </button>
        </>
      )}
    >
      <form className="student-form">
        <label className="picture-upload">
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) {
                return
              }

              setPicturePreview((currentPreview) => {
                if (currentPreview) {
                  URL.revokeObjectURL(currentPreview)
                }
                return URL.createObjectURL(file)
              })
            }}
          />
          <span className="picture-upload-icon">
            {picturePreview ? <img src={picturePreview} alt="" /> : <ImagePlus size={22} />}
          </span>
          <span>
            <span className="picture-upload-title">Picture</span>
            <small>{picturePreview ? 'Change student photo' : 'Upload student photo'}</small>
          </span>
        </label>

        <div className="form-grid two-columns">
          <label className="drawer-field">
            <span>Name</span>
            <input ref={nameInputRef} type="text" placeholder="Student name" defaultValue={student?.name ?? ''} />
          </label>
          <label className="drawer-field">
            <span>Parent Name</span>
            <input type="text" placeholder="Parent name" defaultValue={student?.parentName ?? ''} />
          </label>
          <label className="drawer-field">
            <span>Roll No</span>
            <input type="text" placeholder="Roll number" defaultValue={student?.rollNo ?? ''} />
          </label>
          <label className="drawer-field">
            <span>Monthly Fee</span>
            <input type="number" min="0" placeholder="Monthly fee" defaultValue={student?.monthlyFee ?? ''} />
          </label>
          <Select label="Class" options={classOptions} value={className} onChange={setClassName} />
          <label className="drawer-field">
            <span>Joining date</span>
            <input type="date" value={joiningDate} onChange={(event) => setJoiningDate(event.target.value)} />
          </label>
        </div>
      </form>
    </Modal>
  )
}

export default StudentFormModal
