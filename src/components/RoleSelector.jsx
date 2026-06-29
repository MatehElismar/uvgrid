import { useEffect, useState } from 'react'
import { User, Wallet, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function RoleSelector() {
  const { userDoc, setRole, loading } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && userDoc?.role) {
      navigate('/portal', { replace: true })
    }
  }, [userDoc, loading, navigate])

  async function handleSelect(role) {
    try {
      await setRole(role)
      navigate('/portal')
    } catch {
      setError('Error al guardar tu rol. Intenta de nuevo.')
    }
  }

  if (loading) return null

  return (
    <div className="container">
      {error && (
        <div className="toast toast-error" style={{ maxWidth: 480, margin: '0 auto 1rem' }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      <div className="card" style={{ maxWidth: 480, margin: '3rem auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 className="hero-title" style={{ fontSize: '1.5rem' }}>
            ¿Quién eres?
          </h2>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9375rem', marginTop: '0.5rem' }}>
            Selecciona tu rol para continuar al portal
          </p>
        </div>

        <div className="role-grid">
          <button className="role-card" onClick={() => handleSelect('pastor')}>
            <div className="role-card-icon pastor">
              <User size={28} />
            </div>
            <h3>Pastor</h3>
            <p>Encargado de la iglesia</p>
          </button>

          <button className="role-card" onClick={() => handleSelect('tesorero')}>
            <div className="role-card-icon tesorero">
              <Wallet size={28} />
            </div>
            <h3>Tesorero</h3>
            <p>Encargado de finanzas</p>
          </button>
        </div>
      </div>
    </div>
  )
}
