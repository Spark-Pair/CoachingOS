import {
  AlertTriangle,
  CalendarClock,
  Clock3,
  DatabaseBackup,
  Download,
  HardDrive,
  KeyRound,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import ResetPinModal from '../components/auth/ResetPinModal'
import ConfirmModal from '../components/common/ConfirmModal'
import PageHeader from '../components/common/PageHeader'
import PanelLoader from '../components/common/PanelLoader'
import StatusPill from '../components/common/StatusPill'
import useToast from '../components/common/useToast'
import { API_URL, apiRequest } from '../utils/api'

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
  const [backupStatus, setBackupStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [restoreFile, setRestoreFile] = useState(null)
  const restoreInputRef = useRef(null)

  const loadSettings = useCallback(async () => {
    setIsLoading(true)
    try {
      const [subscriptionResult, backupResult] = await Promise.all([
        apiRequest('/auth/subscription', { token: auth.token }),
        apiRequest('/backups/status', { token: auth.token }),
      ])
      setSubscription(subscriptionResult.subscription)
      setBackupStatus(backupResult.backup)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [auth.token, toast])

  useEffect(() => {
    const timer = window.setTimeout(() => loadSettings(), 0)
    return () => window.clearTimeout(timer)
  }, [loadSettings])

  const handleBackup = async () => {
    setIsBackingUp(true)
    try {
      const response = await fetch(`${API_URL}/backups/download`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })

      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.message || 'Could not create database backup')
      }

      const disposition = response.headers.get('Content-Disposition') || ''
      const fileName = disposition.match(/filename="([^"]+)"/)?.[1] || 'CoachingOS-backup.coachingos-backup'
      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success('Database backup downloaded successfully.')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsBackingUp(false)
    }
  }

  const closeRestoreConfirmation = () => {
    if (isRestoring) return
    setRestoreFile(null)
    if (restoreInputRef.current) restoreInputRef.current.value = ''
  }

  const handleRestore = async () => {
    if (!restoreFile) return

    setIsRestoring(true)
    try {
      const response = await fetch(`${API_URL}/backups/restore`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/octet-stream',
        },
        body: restoreFile,
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result.message || 'Could not restore database backup')
      }

      toast.success('Database restored successfully. A safety backup was created first.', { durationMs: 6000 })
      closeRestoreConfirmation()
      window.setTimeout(() => window.location.reload(), 900)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsRestoring(false)
    }
  }

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

        <section className="panel-shell settings-shell backup-settings-shell">
          <div className="settings-shell-header">
            <div className="settings-shell-title">
              <span className="icon-chip icon-chip-brand">
                <DatabaseBackup size={16} />
              </span>
              <div>
                <h3>Backup and restore</h3>
                <p>Download a complete database backup or restore an earlier CoachingOS backup.</p>
              </div>
            </div>
          </div>
          <div className="backup-settings-content">
            <div className="backup-settings-row">
              <span className="backup-action-icon"><Download size={18} /></span>
              <div>
                <strong>Create backup</strong>
                <span>Downloads students, classes, attendance, fees, settings, and database indexes.</span>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={handleBackup}
                disabled={isLoading || isBackingUp || isRestoring}
              >
                <Download size={16} />
                {isBackingUp ? 'Creating...' : 'Download backup'}
              </button>
            </div>
            <div className="backup-settings-row">
              <span className="backup-action-icon danger"><RotateCcw size={18} /></span>
              <div>
                <strong>Restore backup</strong>
                <span>Replaces current data. CoachingOS automatically saves the current database first.</span>
              </div>
              <input
                ref={restoreInputRef}
                className="visually-hidden"
                type="file"
                accept=".coachingos-backup,application/gzip"
                onChange={(event) => setRestoreFile(event.target.files?.[0] || null)}
              />
              <button
                type="button"
                className="danger-outline-button"
                onClick={() => restoreInputRef.current?.click()}
                disabled={isLoading || isBackingUp || isRestoring}
              >
                <HardDrive size={16} />
                Select backup
              </button>
            </div>
            {backupStatus?.backupDirectory ? (
              <div className="backup-location">
                Safety backups are stored in <strong>{backupStatus.backupDirectory}</strong>
              </div>
            ) : null}
          </div>
        </section>
      </section>

      <ResetPinModal
        isOpen={isResetPinOpen}
        onClose={() => setIsResetPinOpen(false)}
        auth={auth}
      />

      <ConfirmModal
        isOpen={Boolean(restoreFile)}
        title="Restore database?"
        message={restoreFile
          ? `${restoreFile.name} will replace all current CoachingOS data. A safety backup will be created automatically before restoring.`
          : ''}
        confirmLabel="Restore backup"
        tone="danger"
        isConfirming={isRestoring}
        onCancel={closeRestoreConfirmation}
        onConfirm={handleRestore}
      />
    </div>
  )
}

export default SettingsPage
