import { useState, useEffect, useCallback } from 'react'
import {
  Download,
  Eye,
  FileText,
  X,
  ExternalLink,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { db } from '../firebase'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'

const ASSOCIATIONS = ['Todas', 'ACD', 'ADN', 'ADE', 'ADOSE', 'ADONE', 'ADS']

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState([])
  const [filter, setFilter] = useState('Todas')
  const [preview, setPreview] = useState(null)
  const [previewFileIndex, setPreviewFileIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSubmissions()
  }, [])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') setPreview(null)
  }, [])

  useEffect(() => {
    if (preview) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [preview, handleKeyDown])

  async function loadSubmissions() {
    setLoading(true)
    try {
      const q = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'))
      const snap = await getDocs(q)
      setSubmissions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const filtered =
    filter === 'Todas'
      ? submissions
      : submissions.filter((s) => s.association === filter)

  function formatDate(ts) {
    if (!ts?.toDate) return '—'
    return ts.toDate().toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function openPreview(s) {
    setPreview(s)
    setPreviewFileIndex(0)
  }

  function exportCSV() {
    const headers = ['Asociación', 'Iglesia', 'Pastor', 'Archivos', 'Estado', 'Fecha']
    const rows = filtered.map((s) => [
      s.association,
      s.churchName,
      s.pastorName,
      (s.files || []).map((f) => f.fileName).join('; '),
      s.status,
      formatDate(s.submittedAt),
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `solar-grid-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const previewFiles = preview?.files || []
  const currentFile = previewFiles[previewFileIndex]

  return (
    <div className="container-wide">
      <div className="hero" style={{ marginBottom: '1.5rem' }}>
        <h1 className="hero-title">Panel de Administración</h1>
        <p className="hero-subtitle">
          Revisa y administra los envíos de facturas de las iglesias.
        </p>
      </div>

      <div className="admin-header">
        <h2 className="admin-title">Envíos ({filtered.length})</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={loadSubmissions}>
            Actualizar
          </button>
          <button className="btn btn-primary btn-sm" onClick={exportCSV}>
            <Download size={14} />
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="admin-filters" style={{ marginBottom: '1rem' }}>
        <Filter size={16} style={{ color: 'var(--gray-400)', marginRight: 4, alignSelf: 'center' }} />
        {ASSOCIATIONS.map((a) => (
          <button
            key={a}
            className={`filter-btn ${filter === a ? 'active' : ''}`}
            onClick={() => setFilter(a)}
          >
            {a}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner spinner-dark" style={{ margin: '0 auto' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <FileText className="empty-state-icon" size={48} />
          <p className="empty-state-text">
            {submissions.length === 0
              ? 'Aún no hay envíos de facturas.'
              : 'No hay envíos con este filtro.'}
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Asociación</th>
                <th>Iglesia</th>
                <th>Pastor</th>
                <th>Archivos</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const submissionFiles = s.files || []
                return (
                  <tr key={s.id}>
                    <td>
                      <span className="badge badge-pending">{s.association}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{s.churchName}</td>
                    <td>{s.pastorName}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--gray-400)' }}>
                      {submissionFiles.length} archivo{submissionFiles.length !== 1 ? 's' : ''}
                    </td>
                    <td>
                      <span
                        className={`badge badge-${s.status === 'pendiente' ? 'pending' : s.status === 'completado' ? 'success' : 'error'}`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--gray-400)' }}>
                      {formatDate(s.submittedAt)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                          className="btn btn-secondary btn-icon btn-sm"
                          title="Ver documentos"
                          onClick={() => openPreview(s)}
                        >
                          <Eye size={14} />
                        </button>
                        {submissionFiles.length === 1 && (
                          <a
                            href={submissionFiles[0].fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-icon btn-sm"
                            title="Descargar"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {preview && currentFile && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabIndex={-1}>
            <div className="modal-header">
              <h3 className="modal-title">
                {preview.churchName}
                {previewFiles.length > 1 && (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--gray-400)', fontWeight: 400, marginLeft: '0.5rem' }}>
                    ({previewFileIndex + 1} de {previewFiles.length})
                  </span>
                )}
              </h3>
              <button className="modal-close" onClick={() => setPreview(null)} aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '1rem', color: 'var(--gray-400)', fontSize: '0.875rem' }}>
                Pastor: {preview.pastorName} · {preview.association} · {currentFile.fileName}
              </p>
              {currentFile.fileType === 'application/pdf' ? (
                <iframe
                  src={currentFile.fileUrl}
                  style={{ width: '100%', height: 500, border: 'none', borderRadius: 'var(--radius-sm)' }}
                  title="PDF Preview"
                />
              ) : (
                <img src={currentFile.fileUrl} alt="Factura" />
              )}

              {previewFiles.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ width: 'auto' }}
                    onClick={() => setPreviewFileIndex((i) => Math.max(0, i - 1))}
                    disabled={previewFileIndex === 0}
                  >
                    <ChevronLeft size={16} />
                    Anterior
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ width: 'auto' }}
                    onClick={() => setPreviewFileIndex((i) => Math.min(previewFiles.length - 1, i + 1))}
                    disabled={previewFileIndex === previewFiles.length - 1}
                  >
                    Siguiente
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                {previewFiles.map((f, i) => (
                  <a
                    key={i}
                    href={f.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ width: 'auto', display: 'inline-flex', fontSize: '0.75rem' }}
                  >
                    <Download size={12} />
                    {f.fileName}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
