
## Overview

Rebuild Pulse Chat as a plain Vite + React SPA using React Router v6, Context API for auth, and Axios for API calls to your Node backend. UI aesthetic: Claude.ai light-mode inspired — warm off-white canvas, generous whitespace, serif display + clean sans body, restrained accent color, soft borders.

## 1. Stack teardown & setup

- Remove TanStack Start scaffolding: `src/router.tsx`, `src/routes/`, `src/routeTree.gen.ts`, `src/server.ts`, `src/start.ts`, TanStack Router/Start plugins in `vite.config.ts`, related deps.
- Rewrite `vite.config.ts` as a standard React SPA (React + Vite plugin only, port 8080 preserved).
- Add `index.html` at project root with `<div id="root">` and mount point.
- Create `src/main.tsx` (ReactDOM root) and `src/App.tsx` (router + providers).
- Install: `react-router-dom`, `axios`, `@fontsource/instrument-serif`, `@fontsource/inter` (Claude-like pairing).
- Remove: `@tanstack/react-router`, `@tanstack/react-start`, `@tanstack/router-plugin`.

## 2. Design system (Claude.ai-inspired)

Update `src/styles.css` tokens:
- Background: `#faf9f5` (warm ivory), foreground: `#1f1e1d`.
- Card/surface: `#ffffff` with subtle `#eae7dc` borders.
- Muted text: `#6b6a67`. Accent: `#c96442` (Claude's coral-clay) for primary buttons/CTAs.
- Radius: 12px. Shadows: very soft, low-opacity warm grays.
- Typography: Instrument Serif for headings/logo, Inter for body/UI.
- Micro-interactions: 150ms ease transitions, gentle hover elevations, no gradients or neon.

## 3. Routing & auth

`src/App.tsx` with `<BrowserRouter>`:
- `/login` → LoginPage
- `/register` → RegisterPage
- `/` → protected → ChatDashboard
- `*` → 404

`src/context/AuthContext.tsx`:
- State: `user`, `token`, `loading`.
- Loads token from `localStorage` on mount.
- Exposes `login(email, password)`, `register(username, email, password)`, `logout()`.
- `<ProtectedRoute>` wrapper redirects to `/login` when no token.

## 4. API layer

`src/lib/api.ts`:
- Axios instance with `baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:5000"`.
- Request interceptor: attach `Authorization: Bearer <token>` from localStorage.
- Response interceptor: on 401 → clear token, redirect to `/login`.
- `.env.example` documenting `VITE_API_URL`.

`src/lib/auth.ts`:
- `register({ username, email, password })` → POSTs `/api/auth/register` with `publicKey: "temp_key"`.
- `login({ email, password })` → POSTs `/api/auth/login`.
- Both persist returned `token` to localStorage.

## 5. Pages

**LoginPage / RegisterPage** (`src/pages/`):
- Centered card on ivory canvas, serif headline ("Welcome back" / "Create your account"), Inter form labels.
- Fields, primary coral button, inline error state, link to switch between login/register.
- Submits via AuthContext; navigates to `/` on success.

**ChatDashboard** (`src/pages/ChatDashboard.tsx`) — future-proofed layout:
- Left sidebar (~280px): logo/wordmark, search input, "New chat" button, list of conversations (mocked for now — avatar, name, last message preview, timestamp), user profile footer with logout.
- Main pane:
  - Header: contact name, presence dot, subtle actions (call/info icons — placeholder).
  - Message list: alternating bubbles (outgoing = coral tint, incoming = white with border), timestamps, mocked messages.
  - Composer at bottom: textarea, plus a row of ghost buttons for **Schedule Send** (clock icon), **Translate toggle** (globe icon with on/off pill), attachment, and a coral Send button. Buttons are wired to no-op handlers with tooltips ("Coming soon") so the visual affordances are in place.
- Fully responsive; sidebar collapses to icon rail on narrow screens.

## 6. Components

`src/components/`:
- `ProtectedRoute.tsx`
- `AuthLayout.tsx` (shared shell for login/register)
- `Sidebar.tsx`, `ConversationList.tsx`, `MessageBubble.tsx`, `MessageComposer.tsx`, `ChatHeader.tsx`

Reuse existing shadcn primitives (`button`, `input`, `textarea`, `avatar`, `tooltip`, `scroll-area`) but restyle via tokens — no custom color classes in components.

## 7. Meta

- `index.html` title: "Pulse Chat — Private, real-time messaging".
- Favicon kept from existing `public/favicon.ico`.

## Technical notes

- E2EE, real Web Crypto keys, AI translation, and scheduled-send logic are **out of scope** for this pass — UI affordances only, per your instructions.
- Preview limitation: because the browser calls `http://localhost:5000` directly, login/register only work when you run this app locally against your Node backend. The Lovable-hosted preview will show the UI but network calls will fail until you deploy the backend or set `VITE_API_URL` to a reachable URL.
- No Lovable Cloud / Supabase — your Node backend owns auth and data.

## File map

```text
index.html
vite.config.ts                (rewritten)
src/
  main.tsx
  App.tsx
  styles.css                  (Claude-inspired tokens)
  context/AuthContext.tsx
  lib/api.ts
  lib/auth.ts
  components/
    ProtectedRoute.tsx
    AuthLayout.tsx
    Sidebar.tsx
    ConversationList.tsx
    ChatHeader.tsx
    MessageBubble.tsx
    MessageComposer.tsx
  pages/
    LoginPage.tsx
    RegisterPage.tsx
    ChatDashboard.tsx
    NotFound.tsx
```
