import { useEffect, useState } from 'react'
import { AlertTriangle, KeyRound, Save, School } from 'lucide-react'
import ResetPinModal from '../components/auth/ResetPinModal'
import PageHeader from '../components/common/PageHeader'
import { apiRequest } from '../utils/api'

function SettingsPage({ auth }) {
  const [isResetPinOpen, setIsResetPinOpen] = useState(false)
  const [coachingName, setCoachingName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadSettings() {
      try {
        const result = await apiRequest('/settings', { token: auth.token })
        if (isMounted) setCoachingName(result.coachingName)
      } catch (requestError) {
        if (isMounted) setError(requestError.message)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadSettings()
    return () => {
      isMounted = false
    }
  }, [auth.token])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSaving(true)

    try {
      const result = await apiRequest('/settings', {
        method: 'PATCH',
        token: auth.token,
        body: JSON.stringify({ coachingName }),
      })
      setCoachingName(result.coachingName)
      setMessage('Coaching name updated successfully.')
      window.dispatchEvent(new CustomEvent('coaching-name-updated', { detail: result.coachingName }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="page-layout">
      <PageHeader
        title="Settings"
        subtitle="Update your coaching identity and secure administrator access."
      />

      <section className="settings-stack">
        <section className="panel-shell settings-profile-shell">
          <div className="settings-profile-intro">
            <span className="icon-chip icon-chip-brand">
              <School size={18} />
            </span>
            <div>
              <p className="eyebrow">Coaching profile</p>
              <h3>Display identity</h3>
              <p>This name appears in your administrator navigation and identifies your institute.</p>
            </div>
          </div>

          <form className="settings-profile-form" onSubmit={handleSubmit}>
            <label className="drawer-field">
              <span>Coaching Name</span>
              <input
                type="text"
                required
                minLength="2"
                maxLength="80"
                value={coachingName}
                disabled={isLoading}
                placeholder="Enter coaching name"
                onChange={(event) => setCoachingName(event.target.value)}
              />
            </label>
            {error ? <div className="inline-alert danger">{error}</div> : null}
            {message ? <div className="inline-alert success">{message}</div> : null}
            <button type="submit" className="primary-button profile-save-button" disabled={isLoading || isSaving}>
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Name'}
            </button>
          </form>
        </section>

        <section className="panel-shell settings-shell security-settings-shell">
          <div className="settings-shell-header">
            <div className="settings-shell-title">
              <span className="icon-chip icon-chip-danger">
                <AlertTriangle size={16} />
              </span>
              <div>
                <h3>Security</h3>
                <p>Change the administrator PIN used to unlock the management panel.</p>
              </div>
            </div>
            <button type="button" className="secondary-button" onClick={() => setIsResetPinOpen(true)}>
              <KeyRound size={16} />
              Reset PIN
            </button>
          </div>
        </section>
      </section>

      <ResetPinModal
        isOpen={isResetPinOpen}
        onClose={() => setIsResetPinOpen(false)}
        auth={auth}
      />
    </div>
  )
}

export default SettingsPage
