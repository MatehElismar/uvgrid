import { useLocation, useNavigate } from 'react-router-dom'
import { Sun, LogOut, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../AuthContext'

export default function Navbar() {
  const { user, userDoc, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (location.pathname === '/') return null

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate('/')}>
        <div className="navbar-brand-icon">
          <Sun size={18} />
        </div>
        Solar Grid
      </div>
      <div className="navbar-links">
        {userDoc?.role && (
          <>
            <button
              className={`navbar-link ${location.pathname === '/portal' ? 'active' : ''}`}
              onClick={() => navigate('/portal')}
            >
              Portal
            </button>
            {userDoc?.role === 'admin' && (
              <button
                className={`navbar-link ${location.pathname === '/admin' ? 'active' : ''}`}
                onClick={() => navigate('/admin')}
              >
                Admin
              </button>
            )}
          </>
        )}
        {user && (
          <div className="navbar-user">
            {userDoc?.role && <span className="navbar-role">{userDoc.role}</span>}
            {user.photoURL && (
              <img className="navbar-avatar" src={user.photoURL} alt="" />
            )}
            <button className="navbar-link" onClick={logout} title="Cerrar sesión">
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
