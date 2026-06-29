import { useState, useRef, useEffect } from 'react'
import {
  Upload,
  FileText,
  CheckCircle,
  Search,
  Sun,
  X,
  Image,
  AlertCircle,
  Check,
} from 'lucide-react'
import { useAuth } from '../AuthContext'
import { db, storage } from '../firebase'
import {
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
  addDoc,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'

const ASSOCIATIONS = ['ACD', 'ADN', 'ADE', 'ADOSE', 'ADONE', 'ADS']
const MAX_FILE_SIZE = 20 * 1024 * 1024
const VALID_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']

const STEPS = [
  { key: 'association', label: 'Asociación' },
  { key: 'church', label: 'Iglesia' },
  { key: 'pastor', label: 'Pastor' },
  { key: 'files', label: 'Facturas' },
]

export default function PastorPortal() {
  const { user, userDoc } = useAuth()
  const [association, setAssociation] = useState('')
  const [churchQuery, setChurchQuery] = useState('')
  const [churches, setChurches] = useState([])
  const [selectedChurch, setSelectedChurch] = useState(null)
  const [pastorName, setPastorName] = useState('')
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentUpload, setCurrentUpload] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loadingChurches, setLoadingChurches] = useState(false)
  const [userSubmissionCount, setUserSubmissionCount] = useState(null)
  const [error, setError] = useState('')
  const [fileWarnings, setFileWarnings] = useState([])
  const fileInputRef = useRef(null)
  const dropRef = useRef(null)

  useEffect(() => {
    if (user?.uid) {
      const q = query(
        collection(db, 'submissions'),
        where('submittedBy', '==', user.uid)
      )
      getCountFromServer(q).then((snap) => setUserSubmissionCount(snap.data().count)).catch(() => setUserSubmissionCount(0))
    }
  }, [user])

  useEffect(() => {
    if (association) {
      loadChurches()
    } else {
      setChurches([])
      setChurchQuery('')
      setSelectedChurch(null)
    }
  }, [association])

  async function loadChurches() {
    setLoadingChurches(true)
    try {
      const q = query(
        collection(db, 'churches'),
        where('association', '==', association),
        orderBy('name')
      )
      const snap = await getDocs(q)
      setChurches(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch {
      setChurches([])
    }
    setLoadingChurches(false)
  }

  const filteredChurches = churches.filter((c) =>
    c.name.toLowerCase().includes(churchQuery.toLowerCase())
  )

  const showNewChurchOption =
    churchQuery.trim().length > 0 &&
    !filteredChurches.some(
      (c) => c.name.toLowerCase() === churchQuery.trim().toLowerCase()
    )

  function selectChurch(church) {
    setSelectedChurch(church)
    setChurchQuery(church.name)
    setShowDropdown(false)
  }

  function currentStep() {
    if (!association) return 0
    if (!selectedChurch) return 1
    if (!pastorName) return 2
    return 3
  }

  function isValidFile(f) {
    return VALID_TYPES.includes(f.type)
  }

  function handleFilesSelected(rawFiles) {
    const valid = []
    const warnings = []
    for (const f of rawFiles) {
      if (!isValidFile(f)) {
        warnings.push(`${f.name}: formato no soportado (usa PNG, JPG o PDF)`)
      } else if (f.size > MAX_FILE_SIZE) {
        warnings.push(`${f.name}: supera el límite de 20 MB`)
      } else {
        valid.push(f)
      }
    }
    if (warnings.length > 0) setFileWarnings((prev) => [...prev, ...warnings])
    if (valid.length > 0) setFiles((prev) => [...prev, ...valid])
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!association || !selectedChurch || !pastorName || files.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    const uploaded = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setCurrentUpload(i + 1)
        const timestamp = Date.now()
        const ext = file.name.split('.').pop()
        const storagePath = `invoices/${association}/${selectedChurch.name}_${timestamp}_${i}.${ext}`
        const storageRef = ref(storage, storagePath)

        await new Promise((resolve, reject) => {
          const task = uploadBytesResumable(storageRef, file)
          task.on(
            'state_changed',
            (snap) => {
              const fileProgress = snap.bytesTransferred / snap.totalBytes
              const overall = ((i + fileProgress) / files.length) * 100
              setUploadProgress(Math.round(overall))
            },
            reject,
            resolve
          )
        })

        const fileUrl = await getDownloadURL(storageRef)
        uploaded.push({ fileUrl, fileName: file.name, fileType: file.type })
      }

      if (!selectedChurch.id) {
        const churchRef = await addDoc(collection(db, 'churches'), {
          name: selectedChurch.name,
          association,
          lastPastor: pastorName,
          createdAt: serverTimestamp(),
        })
        selectedChurch.id = churchRef.id
      }

      await addDoc(collection(db, 'submissions'), {
        association,
        churchName: selectedChurch.name,
        churchId: selectedChurch.id,
        pastorName,
        files: uploaded,
        status: 'pendiente',
        submittedBy: user?.uid || null,
        submitterRole: userDoc?.role || null,
        submittedAt: serverTimestamp(),
      })

      setSubmitted(true)
    } catch (err) {
      setError(`Error al subir archivo ${currentUpload} de ${files.length}. ${uploaded.length > 0 ? `Se subieron ${uploaded.length} archivo${uploaded.length !== 1 ? 's' : ''} antes del fallo.` : ''} Intenta de nuevo.`)
    }

    setUploading(false)
  }

  function reset() {
    setAssociation('')
    setChurchQuery('')
    setSelectedChurch(null)
    setPastorName('')
    setFiles([])
    setSubmitted(false)
    setUploadProgress(0)
    setError('')
    setFileWarnings([])
  }

  if (submitted) {
    return (
      <div className="container">
        <div className="card success-screen">
          <CheckCircle className="success-check" size={72} />
          <h2 className="success-title">¡Envío exitoso!</h2>
          <p className="success-text">
            Gracias, {pastorName}. {files.length} documento{files.length !== 1 ? 's' : ''} de{' '}
            {selectedChurch?.name} ha{files.length !== 1 ? 'n sido recibidos' : ' sido recibido'} correctamente.
          </p>
          <button className="btn btn-primary" onClick={reset} style={{ maxWidth: 280, margin: '0 auto' }}>
            Enviar otra factura
          </button>
        </div>
      </div>
    )
  }

  const step = currentStep()

  return (
    <div className="container">
      <div className="hero">
        <h1 className="hero-title">Solar Grid</h1>
        <p className="hero-subtitle">
          Ayúdanos a recopilar los datos reales de consumo eléctrico de tu
          iglesia para el proyecto de energía renovable.
        </p>
        {userSubmissionCount !== null && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--gray-400)' }}>
            Tus envíos: <strong style={{ color: 'var(--sun-600)' }}>{userSubmissionCount}</strong>
          </p>
        )}
      </div>

      <div className="form-steps">
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            className={`form-step ${i < step ? 'done' : ''} ${i === step ? 'current' : ''} ${i > step ? 'pending' : ''}`}
          >
            <span className="form-step-number">
              {i < step ? <Check size={10} /> : i + 1}
            </span>
            {s.label}
          </div>
        ))}
      </div>

      {error && (
        <div className="toast toast-error">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {fileWarnings.length > 0 && (
        <div className="toast toast-error" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          {fileWarnings.slice(-3).map((w, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}>
              <AlertCircle size={12} />
              {w}
            </div>
          ))}
          {fileWarnings.length > 3 && (
            <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem' }}>
              +{fileWarnings.length - 3} más
            </div>
          )}
          <button
            type="button"
            onClick={() => setFileWarnings([])}
            style={{ background: 'none', border: 'none', color: 'inherit', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', marginTop: '0.25rem' }}
          >
            Descartar
          </button>
        </div>
      )}

      <form className="card" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Asociación</label>
          <div className="association-grid">
            {ASSOCIATIONS.map((a) => (
              <button
                key={a}
                type="button"
                className={`association-card ${association === a ? 'selected' : ''}`}
                onClick={() => setAssociation(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Iglesia</label>
          <div className="input-wrapper">
            <Search className="input-icon" size={18} />
            <input
              className="input-field"
              type="text"
              placeholder={association ? 'Buscar o escribir iglesia...' : 'Selecciona una asociación primero'}
              value={churchQuery}
              onChange={(e) => {
                setChurchQuery(e.target.value)
                setSelectedChurch(null)
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              disabled={!association}
            />
            {showDropdown && association && (
              <div className="dropdown">
                {loadingChurches ? (
                  <div className="dropdown-empty">Cargando...</div>
                ) : filteredChurches.length > 0 ? (
                  filteredChurches.map((c) => (
                    <div
                      key={c.id}
                      className="dropdown-item"
                      onMouseDown={() => selectChurch(c)}
                    >
                      {c.name}
                    </div>
                  ))
                ) : (
                  <div className="dropdown-empty">
                    {churchQuery
                      ? 'No se encontraron iglesias'
                      : 'Escribe para buscar o crear una nueva'}
                  </div>
                )}
                {showNewChurchOption && (
                  <div
                    className="dropdown-item new-church"
                    onMouseDown={() => {
                      selectChurch({
                        name: churchQuery.trim(),
                        association,
                        lastPastor: '',
                      })
                    }}
                  >
                    ✨ Nueva iglesia: "{churchQuery.trim()}"
                  </div>
                )}
              </div>
            )}
          </div>
          {selectedChurch && !selectedChurch.id && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--sky-500)', marginTop: 6 }}>
              ✨ Se registrará como iglesia nueva al enviar
            </p>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Nombre del Pastor</label>
          <div className="input-wrapper">
            <input
              className="input-field no-icon"
              type="text"
              placeholder="Ej. Juan Pérez"
              value={pastorName}
              onChange={(e) => setPastorName(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Facturas de Luz</label>
          <div
            ref={dropRef}
            className={`upload-zone ${files.length > 0 ? 'has-file' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              dropRef.current?.classList.add('dragging')
            }}
            onDragLeave={() => {
              dropRef.current?.classList.remove('dragging')
            }}
            onDrop={(e) => {
              e.preventDefault()
              dropRef.current?.classList.remove('dragging')
              handleFilesSelected(e.dataTransfer.files)
            }}
          >
            {files.length === 0 ? (
              <>
                <Upload className="upload-icon" size={48} />
                <p className="upload-text">
                  Arrastra tus facturas aquí o haz clic para seleccionar
                </p>
                <p className="upload-hint">PNG, JPG o PDF — hasta 20 MB c/u</p>
              </>
            ) : (
              <>
                <Upload
                  size={32}
                  style={{ color: 'var(--green-500)', marginBottom: '0.5rem' }}
                />
                <p className="upload-text" style={{ color: 'var(--green-600)' }}>
                  {files.length} archivo{files.length !== 1 ? 's' : ''} seleccionado{files.length !== 1 ? 's' : ''}
                </p>
                <p className="upload-hint">Haz clic para agregar más documentos</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.pdf"
              onChange={(e) => {
                handleFilesSelected(e.target.files)
                e.target.value = ''
              }}
              style={{ display: 'none' }}
            />
          </div>
          {files.length > 0 && (
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {files.map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--gray-50)',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.8125rem',
                  }}
                >
                  {f.type === 'application/pdf' ? (
                    <FileText size={14} style={{ color: 'var(--red-500)', flexShrink: 0 }} />
                  ) : (
                    <Image size={14} style={{ color: 'var(--green-500)', flexShrink: 0 }} />
                  )}
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--gray-700)' }}>
                    {f.name}
                  </span>
                  <span style={{ color: 'var(--gray-400)', flexShrink: 0 }}>{formatFileSize(f.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--gray-400)',
                      cursor: 'pointer',
                      padding: 2,
                      flexShrink: 0,
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {uploading && (
          <div style={{ marginBottom: '1rem' }}>
            <div className="upload-progress">
              <div
                className="upload-progress-bar"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.25rem', textAlign: 'center' }}>
              Subiendo archivo {currentUpload} de {files.length} ({uploadProgress}%)
            </p>
          </div>
        )}

        <button
          className="btn btn-primary"
          type="submit"
          disabled={!association || !selectedChurch || !pastorName || files.length === 0 || uploading}
        >
          {uploading ? (
            <>
              <div className="spinner" />
              Subiendo... {uploadProgress}%
            </>
          ) : (
            <>
              <Sun size={18} />
              Enviar factura{files.length !== 1 ? 's' : ''}
            </>
          )}
        </button>
      </form>
    </div>
  )
}
