import { AlertTriangle, KeyRound } from 'lucide-react'
import { useState } from 'react'
import ResetPinModal from '../components/auth/ResetPinModal'
import PageHeader from '../components/common/PageHeader'

function SettingsPage({ auth }) {
  const [isResetPinOpen, setIsResetPinOpen] = useState(false)

  return (
    <div className="page-layout">
      <PageHeader
        title="Settings"
        subtitle="Manage administrator security preferences."
      />

      <section className="settings-stack">
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
