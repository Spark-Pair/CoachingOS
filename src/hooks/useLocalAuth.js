import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../utils/api'

const TOKEN_STORAGE_KEY = 'school-mgmt-admin-token'

function useLocalAuth() {
  const [hasPin, setHasPin] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || '')

  const persistToken = useCallback((nextToken) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken)
    setToken(nextToken)
    setIsAuthenticated(true)
    setHasPin(true)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken('')
    setIsAuthenticated(false)
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadAuthState() {
      try {
        const setup = await apiRequest('/auth/setup-status')
        if (!isMounted) return
        setHasPin(setup.hasPin)

        const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
        if (!savedToken) {
          setIsAuthenticated(false)
          return
        }

        await apiRequest('/auth/session', { token: savedToken })
        if (!isMounted) return
        setToken(savedToken)
        setIsAuthenticated(true)
      } catch {
        if (!isMounted) return
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        setToken('')
        setIsAuthenticated(false)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadAuthState()

    return () => {
      isMounted = false
    }
  }, [])

  return useMemo(
    () => ({
      hasPin,
      isAuthenticated,
      isLoading,
      token,
      async registerPin(pin) {
        const result = await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ pin }),
        })
        persistToken(result.token)
        return result
      },
      async verifyPin(pin) {
        const result = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ pin }),
        })
        persistToken(result.token)
        return true
      },
      async resetPin(currentPin, newPin) {
        const result = await apiRequest('/auth/reset-pin', {
          method: 'POST',
          token,
          body: JSON.stringify({ currentPin, newPin }),
        })
        persistToken(result.token)
        return result
      },
      logout,
      resetAll: logout,
    }),
    [hasPin, isAuthenticated, isLoading, logout, persistToken, token],
  )
}

export default useLocalAuth
