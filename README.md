# Solar Grid

Portal de captura de datos de consumo eléctrico para iglesias. Recolecta facturas de luz como parte de un proyecto de energía renovable.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite 6 |
| Estilos | CSS custom (tema solar) |
| Íconos | lucide-react |
| Ruteo | react-router-dom |
| Backend | Firebase (Google Cloud Platform) |
| Base de datos | Cloud Firestore (nativa) |
| Archivos | Cloud Storage |
| Autenticación | Firebase Auth (Google provider) |
| Hosting | Firebase Hosting |

## Arquitectura

### Flujo de usuario

```
Landing (/) → Login Google → /role (Pastor / Tesorero) → /portal (carga de facturas)
                                                └→ /admin (solo rol "admin")
```

### Estructura del proyecto

```
├── index.html              # Entry point HTML
├── package.json
├── vite.config.js
├── firebase.json           # Config Firebase Hosting + rewrites SPA
├── .firebaserc             # Project default (uvgrid)
├── firestore.rules         # Reglas de seguridad Firestore
├── firestore.indexes.json  # Índices compuestos
├── storage.rules           # Reglas de seguridad Storage
└── src/
    ├── main.jsx            # Bootstrap (BrowserRouter + AuthProvider)
    ├── index.css           # Sistema de diseño completo
    ├── firebase.js         # Inicialización Firebase SDK
    ├── AuthContext.jsx     # Contexto de autenticación + rol
    ├── App.jsx             # Definición de rutas
    └── components/
        ├── Navbar.jsx
        ├── LandingPage.jsx
        ├── RoleSelector.jsx
        ├── PastorPortal.jsx
        └── AdminDashboard.jsx
```

### Rutas

| Ruta | Acceso | Descripción |
|---|---|---|
| `/` | Público | Landing page con stats, login Google |
| `/role` | Autenticado | Selección de rol (pastor/tesorero/admin) |
| `/portal` | Autenticado + rol | Formulario de carga de facturas |
| `/admin` | Rol `admin` | Panel de administración |

### Modelo de datos (Firestore)

**`users/{uid}`**
```
{
  displayName: string,
  email: string,
  photoURL: string,
  role: "pastor" | "tesorero" | "admin",
  createdAt: Timestamp
}
```

**`churches/{id}`**
```
{
  name: string,
  association: "ACD" | "ADN" | "ADE" | "ADOSE" | "ADONE" | "ADS",
  lastPastor: string,
  createdAt: Timestamp
}
```

**`submissions/{id}`**
```
{
  association: string,
  churchName: string,
  churchId: string,
  pastorName: string,
  files: [{ fileUrl, fileName, fileType }],
  status: "pendiente",
  submittedBy: string (uid),
  submitterRole: string,
  submittedAt: Timestamp
}
```

### Almacenamiento (Cloud Storage)

```
invoices/{association}/{churchName}_{timestamp}_{index}.{ext}
```

## Desarrollo local

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # Compilación producción → dist/
```

## Deploy

```bash
# Hosting
firebase deploy --only hosting --project uvgrid

# Firestore rules
firebase deploy --only firestore --project uvgrid

# Storage rules
firebase deploy --only storage --project uvgrid

# Todo
firebase deploy --project uvgrid
```

## Administración

Para asignar el rol `admin`, editar el documento del usuario en Firestore Console:

1. Ir a Firestore → colección `users`
2. Abrir documento del usuario
3. Cambiar `role` a `"admin"`

Los usuarios con rol `admin` ven el enlace "Admin" en la navbar y pueden acceder a `/admin` para revisar envíos, previsualizar documentos y exportar CSV.

## Diseño visual

Tema solar brillante:
- Gradientes cálidos (ámbar, naranja, dorado)
- Cards blancas con sombras suaves
- Acentos en naranja (`#f97316`) y azul cielo (`#0ea5e9`)
- Tipografía: Inter
- Responsive (adaptado a móviles con soporte para cámara)
