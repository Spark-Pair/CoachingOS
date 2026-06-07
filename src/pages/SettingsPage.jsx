import { AlertTriangle, CalendarClock, Clock3, KeyRound, ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import ResetPinModal from '../components/auth/ResetPinModal'
import PageHeader from '../components/common/PageHeader'
import PanelLoader from '../components/common/PanelLoader'
import StatusPill from '../components/common/StatusPill'
import useToast from '../components/common/useToast'
import { apiRequest } from '../utils/api'

function formatDate(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function SettingsPage({ auth }) {
  const toast = useToast()
  const [isResetPinOpen, setIsResetPinOpen] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadSubscription = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await apiRequest('/auth/subscription', { token: auth.token })
      setSubscription(result.subscription)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [auth.token, setIsLoading, setSubscription, toast])

  useEffect(() => {
    const timer = window.setTimeout(() => loadSubscription(), 0)
    return () => window.clearTimeout(timer)
  }, [loadSubscription])

  return (
    <div className="page-layout">
      <PageHeader
        title="Settings"
        subtitle="Manage administrator security and subscription details."
      />

      <section className="settings-stack">
        <section className="panel-shell settings-shell subscription-settings-shell">
          <div className="settings-shell-header">
            <div className="settings-shell-title">
              <span className="icon-chip icon-chip-brand">
                <ShieldCheck size={16} />
              </span>
              <div>
                <h3>Subscription</h3>
                <p>Signed offline license installed for this coaching center.</p>
              </div>
            </div>
            {subscription ? <StatusPill value={subscription.status} /> : null}
          </div>
          <div className="panel-content">
            {isLoading ? <PanelLoader label="Loading subscription" /> : subscription ? (
              <div className="subscription-details-grid">
                <div>
                  <span className="subscription-detail-icon"><CalendarClock size={17} /></span>
                  <span>Customer</span>
                  <strong>{subscription.customer}</strong>
                </div>
                <div>
                  <span className="subscription-detail-icon"><CalendarClock size={17} /></span>
                  <span>Issued</span>
                  <strong>{formatDate(subscription.issuedAt)}</strong>
                </div>
                <div>
                  <span className="subscription-detail-icon"><CalendarClock size={17} /></span>
                  <span>Expires</span>
                  <strong>{formatDate(subscription.expiresAt)}</strong>
                </div>
                <div>
                  <span className="subscription-detail-icon"><Clock3 size={17} /></span>
                  <span>Last verified</span>
                  <strong>{formatDateTime(subscription.lastSeenAt)}</strong>
                </div>
                <div>
                  <span className="subscription-detail-icon"><ShieldCheck size={17} /></span>
                  <span>Time remaining</span>
                  <strong>{subscription.daysRemaining} days</strong>
                </div>
              </div>
            ) : (
              <div className="dashboard-empty">Subscription details are unavailable.</div>
            )}
          </div>
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
