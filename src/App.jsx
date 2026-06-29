import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import Navbar from './components/Navbar'
import LandingPage from './components/LandingPage'
import RoleSelector from './components/RoleSelector'
import PastorPortal from './components/PastorPortal'
import AdminDashboard from './components/AdminDashboard'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { userDoc } = useAuth()

  return (
    <div className="app">
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/role"
          element={
            <RequireAuth>
              {userDoc?.role ? <Navigate to="/portal" replace /> : <RoleSelector />}
            </RequireAuth>
          }
        />
        <Route
          path="/portal"
          element={
            <RequireAuth>
              {!userDoc?.role ? <Navigate to="/role" replace /> : <PastorPortal />}
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              {userDoc?.role !== 'admin' ? <Navigate to="/portal" replace /> : <AdminDashboard />}
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
