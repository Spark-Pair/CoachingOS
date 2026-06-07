import { useCallback, useMemo, useRef, useState } from 'react'
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react'
import ToastContext from './toastContext'

function createToast(id, { message, tone = 'info', durationMs = 3200 }) {
  return {
    id,
    message,
    tone,
    durationMs,
    createdAt: Date.now(),
  }
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef(new Map())

  const remove = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const push = useCallback((options) => {
    const id = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const toast = createToast(id, options)
    setToasts((current) => [toast, ...current].slice(0, 4))

    const timer = window.setTimeout(() => remove(id), toast.durationMs)
    timersRef.current.set(id, timer)
    return id
  }, [remove])

  const api = useMemo(() => ({
    push,
    remove,
    success(message, opts = {}) {
      return push({ message, tone: 'success', ...opts })
    },
    error(message, opts = {}) {
      return push({ message, tone: 'danger', durationMs: 4500, ...opts })
    },
    info(message, opts = {}) {
      return push({ message, tone: 'info', ...opts })
    },
  }), [push, remove])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" role="region" aria-label="Notifications">
        {toasts.map((toast) => {
          const Icon = toast.tone === 'success' ? CheckCircle2 : toast.tone === 'danger' ? CircleAlert : Info
          const title = toast.tone === 'success' ? 'Success' : toast.tone === 'danger' ? 'Something went wrong' : 'Notice'
          return (
            <div key={toast.id} className={`toast-item ${toast.tone}`} role="status">
              <span className="toast-icon"><Icon size={18} /></span>
              <span className="toast-copy">
                <strong>{title}</strong>
                <span className="toast-message">{toast.message}</span>
              </span>
              <button type="button" className="toast-dismiss" onClick={() => remove(toast.id)} aria-label="Dismiss notification">
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export default ToastProvider
