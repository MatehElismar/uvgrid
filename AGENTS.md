# Solar Grid — AGENTS.md

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # → dist/
firebase deploy --only hosting --project uvgrid
```

No tests, linter, or typecheck configured.

## Routes (react-router-dom v6)

| Path | Access | Component |
|---|---|---|
| `/` | public | `LandingPage` — hero, stats, Google login |
| `/role` | auth required | `RoleSelector` — pick pastor/tesorero |
| `/portal` | auth + role set | `PastorPortal` — upload invoices |
| `/admin` | role === `admin` | `AdminDashboard` — review + CSV export |

Flow: `/` → Google login → `/role` → `/portal`.  
Non-admin users hitting `/admin` get redirected to `/portal`.

## Firestore collections

```
users/{uid}         → { displayName, email, photoURL, role, createdAt }
churches/{id}       → { name, association, lastPastor, createdAt }
submissions/{id}    → { association, churchName, churchId, pastorName,
                        files: [{fileUrl, fileName, fileType}],
                        status, submittedBy, submitterRole, submittedAt }
```

## Auth

- Google sign-in via `signInWithPopup` (`AuthContext.jsx`)
- Role set manually in Firestore Console (`users/{uid}.role`)
- Admin role grants access to `/admin` — assigned via Firestore doc edit only

## Key constraints

- Use `getCountFromServer()` for counts (not fetching docs).
- The "Nueva iglesia" flow creates a church doc in `handleSubmit` if `selectedChurch.id` is falsy.
- Upload progress uses `uploadBytesResumable` with per-file tracking.
- CSV export generates a client-side blob download (`AdminDashboard.jsx`).
- Firestore rules (`firestore.rules`) and Storage rules (`storage.rules`) must be deployed explicitly (`firebase deploy --only firestore,storage`).
- No Firestore indexes beyond defaults; add to `firestore.indexes.json` if queries need them.
- File validation accepts PNG, JPG, PDF up to 20 MB; invalid files show a toast warning.
- Errors use inline toast notifications (`toast-error`), never `alert()`.
- Form includes a step indicator (`form-steps`) for association → church → pastor → files.
- Modal preview closes on Esc key (`keydown` listener in `AdminDashboard.jsx`).
- All CSS custom properties are defined in `:root` in `index.css`; components use `--gray-*`, `--sun-*`, `--sky-*`, `--green-*`, `--red-*` scales — no legacy dark-theme variables.

## Deploy

```bash
firebase deploy --project uvgrid                   # all
firebase deploy --only hosting --project uvgrid     # frontend only
```
