import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import AdminLayout from '../components/layout/AdminLayout'
import useLocalAuth from '../hooks/useLocalAuth'
import AttendancePage from '../pages/AttendancePage'
import ClassesPage from '../pages/ClassesPage'
import DashboardPage from '../pages/DashboardPage'
import FeesPage from '../pages/FeesPage'
import PinPage from '../pages/PinPage'
import QrPage from '../pages/QrPage'
import ReportsPage from '../pages/ReportsPage'
import SettingsPage from '../pages/SettingsPage'
import StudentsPage from '../pages/StudentsPage'
import TeacherScanPage from '../pages/TeacherScanPage'

function AppRoutes() {
  const auth = useLocalAuth()

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/scan" element={<TeacherScanPage />} />
      <Route path="/pin" element={<PinPage auth={auth} />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute auth={auth}>
            <AdminLayout auth={auth}>
              <DashboardPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/students"
        element={
          <ProtectedRoute auth={auth}>
            <AdminLayout auth={auth}>
              <StudentsPage auth={auth} />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <ProtectedRoute auth={auth}>
            <AdminLayout auth={auth}>
              <AttendancePage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes"
        element={
          <ProtectedRoute auth={auth}>
            <AdminLayout auth={auth}>
              <ClassesPage auth={auth} />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/fees"
        element={
          <ProtectedRoute auth={auth}>
            <AdminLayout auth={auth}>
              <FeesPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute auth={auth}>
            <AdminLayout auth={auth}>
              <ReportsPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/qr"
        element={
          <ProtectedRoute auth={auth}>
            <AdminLayout auth={auth}>
              <QrPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute auth={auth}>
            <AdminLayout auth={auth}>
              <SettingsPage auth={auth} />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default AppRoutes
