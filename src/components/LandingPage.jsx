import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Building2, Upload, CheckCircle2, ArrowRight } from 'lucide-react'
import { useAuth } from '../AuthContext'
import { db } from '../firebase'
import { collection, getCountFromServer } from 'firebase/firestore'

const ASSOCIATIONS = ['ACD', 'ADN', 'ADE', 'ADOSE', 'ADONE', 'ADS']
const BASE = 270

function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0)
  const raf = useRef(null)

  useEffect(() => {
    const start = performance.now()
    function tick(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) {
        raf.current = requestAnimationFrame(tick)
      }
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])

  return count
}

export default function LandingPage() {
  const { user, userDoc, login } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const target = BASE + (stats || 0)
  const animated = useCountUp(target)
  const [loggingIn, setLoggingIn] = useState(false)

  useEffect(() => {
    async function loadStats() {
      try {
        const snap = await getCountFromServer(collection(db, 'submissions'))
        setStats(snap.data().count)
      } catch {
        setStats(0)
      }
    }
    loadStats()
  }, [])

  useEffect(() => {
    if (!loggingIn && user && userDoc?.role) {
      navigate('/portal', { replace: true })
    }
  }, [user, userDoc, loggingIn, navigate])

  async function handleLogin() {
    setLoggingIn(true)
    try {
      await login()
      navigate('/role')
    } catch {
      setLoggingIn(false)
    }
  }

  return (
    <div className="landing">
      <div className="landing-sun">
        <Sun size={36} />
      </div>

      <h1>Solar Grid</h1>
      <p>
        Recopilación de datos de consumo eléctrico para el proyecto de energía
        renovable de nuestras iglesias.
      </p>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats === null ? '—' : animated.toLocaleString()}</div>
          <div className="stat-label">Facturas recibidas</div>
        </div>
      </div>

      <div className="landing-actions" style={{ marginBottom: '3rem' }}>
        {user ? (
          <>
            <div className="landing-user">
              {user.photoURL && <img src={user.photoURL} alt="" />}
              <span>{user.displayName}</span>
            </div>
            {userDoc?.role ? (
              <button className="btn btn-primary" onClick={() => navigate('/portal')}>
                <Sun size={18} />
                Ir al Portal
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => navigate('/role')}>
                Seleccionar tu rol
                <ArrowRight size={18} />
              </button>
            )}
          </>
        ) : (
          <button className="btn btn-google" onClick={handleLogin} disabled={loggingIn}>
            {loggingIn ? (
              <div className="spinner spinner-dark" />
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Iniciar sesión con Google
              </>
            )}
          </button>
        )}
      </div>

      <div style={{ maxWidth: 800, width: '100%' }}>
        <div
          style={{
            background: 'white',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius)',
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            marginBottom: '1.5rem',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center', color: 'var(--gray-800)' }}>
            ¿Cómo funciona?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--sun-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', color: 'var(--orange-500)' }}>
                <Building2 size={24} />
              </div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--gray-700)' }}>1. Selecciona</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--gray-400)', lineHeight: 1.5 }}>
                Elige tu asociación e iglesia
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--sky-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', color: 'var(--sky-500)' }}>
                <Upload size={24} />
              </div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--gray-700)' }}>2. Sube</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--gray-400)', lineHeight: 1.5 }}>
                Toma foto o sube tu factura de luz
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', color: 'var(--green-500)' }}>
                <CheckCircle2 size={24} />
              </div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--gray-700)' }}>3. Listo</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--gray-400)', lineHeight: 1.5 }}>
                Datos enviados para el proyecto
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'white',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius)',
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            marginBottom: '3rem',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center', color: 'var(--gray-800)' }}>
            Asociaciones participantes
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {ASSOCIATIONS.map((a) => (
              <span
                key={a}
                style={{
                  padding: '0.375rem 1rem',
                  borderRadius: 20,
                  background: 'var(--sun-50)',
                  color: 'var(--sun-700)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
