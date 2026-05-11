# Integrated Postcode Management System (IPMS) — Prototype Plan

A polished, responsive front-end prototype for Bangladesh Post Office's postcode system. Pure front-end with mock data — no backend, no real auth, no real GIS dependencies required.

## Design direction

- **Look & feel**: government-grade, trustworthy, modern. Not flashy.
- **Palette** (in `src/styles.css`, oklch tokens):
  - Primary: deep Bangladesh green (`oklch(0.45 0.12 150)`)
  - Accent: Bangladesh red (`oklch(0.58 0.20 25)`) — used sparingly for the flag motif and critical alerts
  - Neutrals: warm off-white background, slate text
  - Dark mode supported
- **Typography**: Inter for English, Hind Siliguri (via Google Fonts) for Bangla. Large headings, generous spacing on public pages; denser layouts on admin pages.
- **Components**: shadcn/ui (Button, Card, Table, Dialog, Sidebar, Tabs, Select, Form, Sonner toast, Chart).
- **Iconography**: lucide-react (MapPin, Search, Navigation, Database, Users, Shield, Upload, BarChart3, FileText, Settings, Wifi, WifiOff, Key).
- **Responsiveness**: mobile-first; admin uses collapsible sidebar (icon mode) on tablet/mobile.

## Architecture

- **Stack**: TanStack Start (already configured), React 19, TS, Tailwind v4, shadcn/ui.
- **Routing** (file-based under `src/routes/`):
  - `__root.tsx` — providers (QueryClient, Sonner Toaster, LanguageProvider, OnlineProvider, MockAuthProvider)
  - Public layout `_public.tsx` — public header + footer + language toggle
    - `index.tsx` — Home
    - `gps.tsx` — GPS lookup
    - `search.tsx` — Manual search
    - `map.tsx` — Interactive map
    - `feedback.tsx` — Report issue
    - `offline.tsx` — Offline demo
    - `login.tsx` — Mock admin login (role picker)
  - Admin layout `admin.tsx` — sidebar + topbar, gated by mock role
    - `admin.index.tsx` — Dashboard
    - `admin.records.tsx` — Postcode records management
    - `admin.upload.tsx` — Bulk data upload
    - `admin.boundaries.tsx` — Geo-boundary management
    - `admin.api.tsx` — API management
    - `admin.audit.tsx` — Audit trail
    - `admin.reports.tsx` — Reports & analytics
    - `admin.pilot.tsx` — Pilot deployment
    - `admin.users.tsx` — User & role management (Super Admin only)
- **State**:
  - `MockAuthContext` — current role (`super_admin | data_manager | ops_staff | null`), persisted in localStorage. No real auth.
  - `LanguageContext` — `en | bn` with a small dictionary `src/lib/i18n.ts` for key public labels.
  - `OnlineContext` — simulated online/offline toggle for the offline demo page.
- **Mock data** (`src/data/`):
  - `postcodes.ts` — ~40 records across all 8 divisions with Bangla + English names, lat/lng, status, updatedAt.
  - `divisions.ts` — Division → District → Upazila → Area cascade.
  - `users.ts`, `apiKeys.ts`, `auditLogs.ts`, `feedback.ts`, `pilotDistricts.ts`, `analytics.ts` (time-series for charts).
- **Reusable components** (`src/components/ipms/`):
  - `PublicHeader`, `PublicFooter`, `LanguageToggle`
  - `PostcodeResultCard`, `PostcodeTable`, `PostcodeFormDialog`
  - `DashboardStatCard`, `ChartPanel` (wraps shadcn Chart + Recharts)
  - `MapPlaceholder` — SVG-based stylized Bangladesh map with colored region polygons + click-to-popup. Avoids Leaflet runtime/SSR concerns; looks intentional, not broken.
  - `RoleGuard`, `AdminSidebar`, `LoadingSkeleton`, `EmptyState`

## Page-level behavior (highlights)

- **Home**: hero with bilingual title, two big CTAs (GPS / Manual), 5 benefit cards, recent updates strip.
- **GPS lookup**: simulated `getCurrentPosition` with timed states (requesting → success / denied / weak-signal / out-of-pilot). Returns a deterministic mock based on a seeded coordinate.
- **Manual search**: cascading Selects + keyword input with debounce; suggestions appear after 3 chars; matches both English and Bangla strings.
- **Map**: SVG map of Bangladesh divided into colored polygon zones; clicking opens a popup with postcode info; layer toggle swaps style classes (standard / satellite-tinted / boundary-only); side panel lists nearby zones. You can use OpenStreetMap API to identify divisions, districts of Bangladesh. Drop down selection menu should be available. You can divide districts to custom polygons. 
- **Feedback**: react-hook-form + zod, success toast + inline confirmation card.
- **Login**: three role cards — selecting one sets mock role and routes to `/admin`. Visual MFA hint only.
- **Dashboard**: 6 stat cards, 4 charts (line, donut, bar, stacked bar) using Recharts, and a CSS-grid heatmap panel.
- **Records**: shadcn Table with search, status filter, pagination, row actions. Add/Edit Dialog with full validation. Soft-delete toggles status.
- **Bulk upload**: drag-drop zone (mock), pre-baked validation result table with mixed pass/fail rows, "Commit Valid Records" toast.
- **Boundaries**: zone list + SVG editor where points can be dragged; overlap detection shows a destructive Alert.
- **API management**: endpoint doc cards with copy-to-clipboard, sample JSON in a code block, API key table with masked keys, "Generate" produces a new mock key with toast.
- **Audit trail**: filterable table, export buttons trigger CSV download (real, generated client-side) and a "PDF export queued" toast.
- **Reports**: date range picker, 4 report cards each with a chart + Download (CSV real, PDF/Excel mocked via toast).
- **Offline**: top banner reflects `OnlineContext`; switching to offline disables GPS/Map CTAs and restricts search to a cached subset; shows recent-search chips.

## Role-based visibility

Implemented via a small `can(action)` helper:

- `ops_staff`: read-only records, can submit reports, no Delete, no Users, no API, no Settings.
- `data_manager`: full Records/Upload/Boundaries, no Users, no API key generation.
- `super_admin`: everything including Users and Audit.

Sidebar items and row-action buttons are filtered through `can()`.

## Out of scope (explicit)

- No real backend, database, or Lovable Cloud (prototype only — can be added later).
- No real Leaflet/OpenStreetMap integration; using a deliberate SVG visualization to avoid SSR/tile-loading issues in the prototype. Easy to swap later.
- No real authentication, MFA, or file parsing — all simulated with mock data and toasts.

## Build order

1. Tokens, fonts, providers, public layout, header/footer, language toggle.
2. Public pages: Home → GPS → Search → Map → Feedback → Offline → Login.
3. Mock data + admin layout + sidebar + role guard.
4. Admin pages in dashboard order: Dashboard → Records → Upload → Boundaries → API → Audit → Reports → Pilot → Users.
5. Polish pass: empty/loading/error states, toasts, responsive QA on mobile/tablet/desktop, SEO meta per route.