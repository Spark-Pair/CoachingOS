import { BookOpenCheck, CheckCircle2, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

function PinPage({ auth }) {
  const navigate = useNavigate()
  const location = useLocation()
  const pinInputRef = useRef(null)
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectPath = location.state?.from || '/dashboard'
  const isRegistration = !auth.hasPin

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!/^\d{4}$/.test(pin)) {
      setError('Use a 4-digit PIN.')
      pinInputRef.current?.focus()
      return
    }

    if (isRegistration) {
      if (pin !== confirmPin) {
        setError('PIN confirmation does not match.')
        return
      }

      try {
        setIsSubmitting(true)
        await auth.registerPin(pin)
        navigate('/dashboard', { replace: true })
      } catch (requestError) {
        setError(requestError.message)
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    try {
      setIsSubmitting(true)
      await auth.verifyPin(pin)
      navigate(redirectPath, { replace: true })
    } catch (requestError) {
      setError(requestError.message)
      setPin('')
      pinInputRef.current?.focus()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="pin-screen">
      <section className="pin-shell">
        <div className="pin-brand-panel" aria-hidden="true">
          <div className="pin-brand-mark">
            <BookOpenCheck size={24} strokeWidth={2.2} />
          </div>
          <div>
            <span className="pin-brand-title">SchoolOS</span>
            <span className="pin-brand-subtitle">Management workspace</span>
          </div>

          <div className="pin-feature-list">
            <div className="pin-feature">
              <CheckCircle2 size={17} />
              <span>Student, fee, class, and attendance records in one place</span>
            </div>
            <div className="pin-feature">
              <CheckCircle2 size={17} />
              <span>Local admin PIN protects management routes</span>
            </div>
            <div className="pin-feature">
              <CheckCircle2 size={17} />
              <span>Teacher scan remains quick and separate</span>
            </div>
          </div>
        </div>

        <div className="pin-card">
          <div className="pin-card-top">
            <span className="pin-lock-chip">
              {isRegistration ? <ShieldCheck size={20} strokeWidth={2} /> : <LockKeyhole size={20} strokeWidth={2} />}
            </span>
            <span className="pin-mode">{isRegistration ? 'First setup' : 'Admin access'}</span>
          </div>

          <div className="pin-heading">
            <h1>{isRegistration ? 'Register admin PIN' : 'Welcome back'}</h1>
            <p className="pin-copy">
              {isRegistration
                ? 'Create a 4-digit PIN for this browser. You can change auth later when backend login is connected.'
                : 'Enter your 4-digit PIN to continue to the protected workspace.'}
            </p>
          </div>

          <form className="pin-form" onSubmit={handleSubmit}>
            <label>
              <span>PIN</span>
              <input
                ref={pinInputRef}
                type="password"
                inputMode="numeric"
                autoComplete={isRegistration ? 'new-password' : 'current-password'}
                maxLength={4}
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0000"
              />
            </label>
            {isRegistration ? (
              <label>
                <span>Confirm PIN</span>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="0000"
                />
              </label>
            ) : null}
            {error ? <div className="inline-alert danger">{error}</div> : null}
            <button type="submit" className="primary-button pin-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Please wait...' : isRegistration ? 'Save PIN and continue' : 'Unlock workspace'}
            </button>
            <Link to="/scan" className="secondary-button pin-submit teacher-scan-link">
              Teacher Scan
            </Link>
          </form>
        </div>
      </section>
    </main>
  )
}

export default PinPage
