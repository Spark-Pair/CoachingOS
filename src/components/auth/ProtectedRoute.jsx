import { Navigate, useLocation } from 'react-router-dom'

function ProtectedRoute({ auth, children }) {
  const location = useLocation()

  if (auth.isLoading) {
    return (
      <div className="pin-screen">
        <div className="auth-loading">Checking session...</div>
      </div>
    )
  }

  if (!auth.hasPin || !auth.isAuthenticated) {
    return <Navigate to="/pin" replace state={{ from: location.pathname }} />
  }

  return children
}

export default ProtectedRoute
