import { AlertTriangle, Download, ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { API_URL } from '../../utils/api'
import Modal from '../common/Modal'

const DISMISSED_UPDATE_KEY = 'coachingos-dismissed-update'

function UpdateManager({ auth }) {
  const checkStartedRef = useRef(false)
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const [isInstalling, setIsInstalling] = useState(false)
  const [isStartingUpdater, setIsStartingUpdater] = useState(false)

  useEffect(() => {
    const shouldCheck = !import.meta.env.DEV || import.meta.env.VITE_ENABLE_UPDATE_CHECK === 'true'
    if (!shouldCheck || !auth.isAuthenticated || !auth.token || checkStartedRef.current) return

    checkStartedRef.current = true
    fetch(`${API_URL}/updates/status`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(result.message || 'Could not check for updates')
        return result
      })
      .then((result) => {
        if (!result.available || !result.update) return
        const dismissedVersion = localStorage.getItem(DISMISSED_UPDATE_KEY)
        if (!result.update.mandatory && dismissedVersion === result.update.version) return
        setStatus(result)
      })
      .catch(() => {
        // Update checks should not interrupt normal use when GitHub is unavailable.
      })
  }, [auth.isAuthenticated, auth.token])

  const update = status?.update
  const mandatory = Boolean(update?.mandatory)

  const dismiss = () => {
    if (!update || mandatory || isInstalling) return
    localStorage.setItem(DISMISSED_UPDATE_KEY, update.version)
    setStatus(null)
  }

  const install = async () => {
    setError('')
    setIsInstalling(true)

    try {
      const response = await fetch(`${API_URL}/updates/install`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${auth.token}` },
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || 'Could not start the update')

      localStorage.removeItem(DISMISSED_UPDATE_KEY)
      setIsStartingUpdater(true)
    } catch (requestError) {
      setError(requestError.message)
      setIsInstalling(false)
    }
  }

  if (!update) return null

  return (
    <Modal
      title={mandatory ? 'Update required' : 'Update available'}
      isOpen
      onClose={dismiss}
      disableClose={mandatory || isInstalling}
      className="update-modal"
      footer={isStartingUpdater ? null : (
        <>
          {!mandatory ? (
            <button type="button" className="secondary-button modal-action" onClick={dismiss} disabled={isInstalling}>
              Later
            </button>
          ) : (
            <a className="secondary-button modal-action" href={update.releaseUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={16} />
              Release details
            </a>
          )}
          <button
            type="button"
            className="primary-button modal-action"
            onClick={install}
            disabled={isInstalling || !status.canInstall || !status.online}
          >
            {isInstalling ? <RefreshCw className="button-spinner" size={16} /> : <Download size={16} />}
            {isInstalling ? 'Preparing update...' : `Update to ${update.version}`}
          </button>
        </>
      )}
    >
      <div className={`update-content${mandatory ? ' mandatory' : ''}`}>
        <span className="update-icon">
          {mandatory ? <AlertTriangle size={24} /> : <ShieldCheck size={24} />}
        </span>
        {isStartingUpdater ? (
          <>
            <h3>Updater is starting</h3>
            <p>CoachingOS will close, install the update, and reopen automatically. Keep this computer turned on.</p>
            <div className="update-progress-line"><span /></div>
          </>
        ) : (
          <>
            <h3>CoachingOS {update.version}</h3>
            <p>
              {mandatory
                ? 'This update is required before you can continue using CoachingOS.'
                : 'A newer version of CoachingOS is ready to install.'}
            </p>
            <div className="update-version-row">
              <span>Installed</span>
              <strong>{status.currentVersion}</strong>
              <span>Available</span>
              <strong>{update.version}</strong>
            </div>
            {!status.online ? (
              <div className="inline-alert danger">Connect to the internet to download this update.</div>
            ) : null}
            {!status.canInstall ? (
              <div className="inline-alert danger">Automatic installation is only available in the installed Windows app.</div>
            ) : null}
            {error ? <div className="inline-alert danger">{error}</div> : null}
          </>
        )}
      </div>
    </Modal>
  )
}

export default UpdateManager
