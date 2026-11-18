# PizzaHub Client

Next.js 16 App Router frontend for PizzaHub. It uses React 19, TypeScript, Tailwind CSS, shadcn-style reusable components, Motion, React Hook Form + Zod, Better Auth, Sonner toasts, and the Express API in `../pizzahub-server`.

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

Open <http://localhost:3000>. For the full stack, start `pizzahub-server` on port 5000 first.

Scripts:

- `npm run dev` — development server
- `npm run build` — production build
- `npm start` — serve a production build
- `npm run lint` — ESLint

## Environment

| Variable | Purpose |
| --- | --- |
| `BETTER_AUTH_SECRET` | Must match the server secret. |
| `BETTER_AUTH_URL` | Auth base URL and JWT issuer/audience. |
| `FRONTEND_URL` | Public redirect base URL. |
| `MONGODB_URI`, `DB_NAME` | Better Auth Mongo adapter. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Optional Google OAuth. |
| `NEXT_PUBLIC_API_URL` | Express API base URL. |
| `NEXT_PUBLIC_AUTH_URL` | Base URL for `/api/auth/token` and `/api/auth/jwks`. |

Only `NEXT_PUBLIC_*` variables reach the browser; keep secrets server-side.

## Structure

- `src/app/(auth)` — login and registration
- `src/app/(public)` — home, menu, item details, restaurants
- `src/app/dashboard` — customer, vendor, and admin workspaces
- `src/components/layout` — shared header/footer and dashboard shell
- `src/components/public` — menu browser, cards, detail views
- `src/components/dashboard` — role dashboards, forms, order timeline, charts
- `src/components/shared` — reusable form, dialog, upload, and UI primitives
- `src/lib` — auth client, JWT-aware API client, shared types
- `src/app/api/auth/[...all]/route.ts` — Better Auth catch-all, including `/token` and `/jwks`

## UI conventions

- Warm cream backgrounds with tomato red and oven-orange accents; dark mode uses charcoal surfaces with the same accents.
- One heading/paragraph scale across public and dashboard pages; cards and images use equal dimensions in grids.
- Buttons come from the shared UI kit so home, forms, and dashboards stay consistent.
- Route-level `loading.tsx`, `error.tsx`, `not-found.tsx`, and `global-error.tsx` handle navigation and render failures. API and form failures use inline messages plus Sonner toasts.
- The theme toggle persists in local storage and applies before paint to avoid hydration flash.

See `../README.md` for the advanced search query parameters and JWT middleware flow.
