# Insurance Advisor – Website and Advisor Portal

Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + React Three Fiber.

- Public website (3D): `/`, `/features`, `/pricing`, `/about`, `/contact`, `/signup`, legal pages
- Advisor portal: `/login` and everything under `/app` (dashboard, leads, customers, quotations, payments,
  policies, renewals, tasks, referrals, messages, Autodial, reports, team, subscription)

It talks to the backend API (insurance-backend). The API must list this site's address in `CORS_ORIGINS`.

## Run locally (Windows: Command Prompt or PowerShell)

```bash
copy .env.example .env.local     # macOS / Linux: cp .env.example .env.local
npm install
npm run dev                      # http://localhost:3000
```

Demo login (after `npm run seed` in the backend): `demo@test.com` / `Demo@1234`.

## Checks and production build

```bash
npm run lint && npm run typecheck && npm run build
npm start                        # serves the production build on http://localhost:3000
```

## Settings (`.env.local`)

| Name | Example | Meaning |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api/v1` | Backend address (ends with `/api/v1`) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | This website's own address (sitemap, sharing) |

`NEXT_PUBLIC_*` values are built into the pages: restart `npm run dev` (or build again) after changing them.

## Deploy

Vercel: import the repository, add the two settings, deploy. Render: New → Blueprint (uses `render.yaml`).
