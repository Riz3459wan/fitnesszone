# GymZora — Gym Management Frontend

React + Vite frontend for GymZora, a multi-tenant gym management system. Supports member management, attendance tracking, payments, plans, reports, and per-gym settings.

---

## Tech stack

- **React 18** with lazy loading and Suspense
- **Vite 5** — dev server + production build
- **Tailwind CSS 3** — utility-first styling with dark mode support
- **React Router 6** — client-side routing with role-based guards
- **Axios** — API client with HttpOnly cookie auth
- **Recharts** — revenue and membership charts
- **react-hot-toast** — notifications

---

## Getting started

### Prerequisites

- Node.js 18+
- GymZora backend running on `http://localhost:8080`

### Install and run

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`.

### Environment variables

Create a `.env.local` file (never commit this):

```env
VITE_API_URL=http://localhost:8080/api
```

If `VITE_API_URL` is not set, it defaults to `http://localhost:8080/api`.

---

## Project structure

```
src/
├── assets/              # Static assets (logo, etc.)
├── components/
│   ├── Charts/          # RevenueChart, MembershipChart
│   ├── Common/          # Alert, Modal, Pagination, SearchBar, etc.
│   └── Layout/          # Header, Layout (shell with outlet)
├── context/
│   ├── AuthContext.jsx  # Auth state, login/logout, user profile
│   └── SettingsContext.jsx  # Gym settings, theme, currency, date format
├── hooks/
│   ├── useDebounce.js
│   └── usePreventBack.js
├── pages/               # One file per route
├── services/
│   └── api.js           # All Axios API calls, grouped by resource
└── utils/
    └── subdomain.js     # Multi-tenant subdomain detection
```

---

## Authentication

Auth uses **HttpOnly cookies** set by the backend on login — the JWT never touches JavaScript. `localStorage` stores only non-sensitive UI state (username, role, gym name) to hydrate the UI on refresh.

On 401, the axios interceptor clears localStorage and redirects to `/login` — with a debounce guard so multiple concurrent 401s don't cause multiple redirects.

---

## Multi-tenancy

Each gym gets its own subdomain (e.g. `mygym.gymzora.com`). The `getSubdomain()` util reads the subdomain from the hostname in production, or falls back to `lastGymSubdomain` in localStorage for `localhost` development.

---

## Roles

| Role    | Access                                          |
| ------- | ----------------------------------------------- |
| `ADMIN` | All routes including Users, Settings, Reports   |
| `STAFF` | Dashboard, Members, Attendance, Payments, Plans |

Role-based access is enforced by `<RoleRoute>` in `App.jsx`. Unauthorized access redirects to `/dashboard`.

---

## Build

```bash
npm run build      # production build → dist/
npm run preview    # preview the production build locally
```

Chunks are split manually in `vite.config.js`:

- `vendor` — react, react-dom, react-router-dom
- `charts` — recharts
- `ui` — lucide-react, react-hot-toast

---

## Theme & appearance

Theme (light/dark/system), primary colour, and font family are all controlled from the Settings page and applied via CSS variables on `document.documentElement`. Changes persist to the backend and are restored on next load.
