<div align="center">

<br />

<img src="https://attendmateweb.vercel.app/favicon.ico" width="88" height="88" alt="AttendMate" />

<br />
<br />

# AttendMate

**Never drop below 75% attendance again.**

A simple, accurate attendance tracker for college students — track your percentage per subject, know exactly how many classes you can safely skip, and stay above the 75% requirement.

<br />

[![Live Demo](https://img.shields.io/badge/Live%20Demo-attendmateweb.vercel.app-4f46e5?style=flat-square&logo=vercel&logoColor=white)](https://attendmateweb.vercel.app)
&nbsp;
[![License](https://img.shields.io/badge/License-MIT-10b981?style=flat-square)](LICENSE)
&nbsp;
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com)

<br />

</div>

---

## Overview

Most college students track attendance mentally — "I think I've attended enough." That guesswork leads to shortages, debarment notices, and last-minute panic.

**AttendMate replaces guesswork with real-time clarity.** Know your exact percentage per subject, see how many classes you can safely skip before dropping below 75%, and track everything from a clean dashboard that works on both mobile and desktop.

The site has two parts:

- **A public content site** — a landing page, free calculator tools, a blog, and legal pages. No login required, and where advertising is served.
- **The app** — the logged-in attendance tracker (dashboard, subjects, timetable, analytics). No ads.

> **Try it now →** [attendmateweb.vercel.app](https://attendmateweb.vercel.app)

---

## Features

| Feature | Description |
|---|---|
| ⚡ **One-Click Attendance** | Mark Present or Absent in seconds. No forms, no friction. |
| 📊 **Live Analytics** | Subject-wise breakdowns that update in real time. |
| 🧮 **Free Calculators** | Attendance %, safe-skip, and CGPA↔% tools — no login needed. |
| ☁️ **Cloud Sync** | Firebase-backed, synced instantly across all your devices. |
| 📅 **Smart Timetable** | Set your weekly schedule once. Get auto-prompted when class starts. |
| 🌗 **Light & Dark** | Clean, responsive UI with full light/dark theme support. |

---

## Free Tools

Public, no-login calculators that also serve as SEO content:

- **Attendance Percentage Calculator** — `/tools/attendance-calculator`
- **Safe Skip Calculator** ("how many classes can I miss?") — `/tools/safe-skip-calculator`
- **CGPA ↔ Percentage Converter** — `/tools/cgpa-percentage-converter`

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | SSR/SSG rendering and API routes |
| **UI Library** | React 19 | Component-based UI |
| **Language** | TypeScript 5 | Type-safe development |
| **Backend & DB** | Firebase 12 | Auth, Firestore, real-time cloud sync |
| **Styling** | Tailwind CSS 4 | Utility-first CSS |
| **Icons** | lucide-react | Consistent icon set |
| **Ads** | Google AdSense | Advertising on public content pages only |
| **Deployment** | Vercel | CI/CD with automatic deploys on every push |

---

## Project Structure

```
attendmate-web/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── page.tsx                # Landing page
│   │   ├── layout.tsx              # Root layout
│   │   ├── globals.css             # Global styles + design tokens
│   │   ├── sitemap.ts              # SEO sitemap
│   │   ├── robots.ts               # Robots rules (app routes disallowed)
│   │   ├── login/ register/ forgot-password/   # Auth
│   │   ├── tools/                  # Free public calculators
│   │   ├── blog/                   # Articles
│   │   ├── about/ contact/         # Info pages
│   │   ├── privacy/ terms/         # Legal (required for AdSense)
│   │   ├── dashboard/              # Main dashboard (protected)
│   │   ├── attendance/ subjects/ timetable/    # Core app (protected)
│   │   ├── analytics/ friends/ settings/       # App (protected)
│   │   └── api/                    # API routes
│   ├── components/
│   │   ├── ui/                     # Button, Container, Logo
│   │   ├── site/                   # SiteHeader, SiteFooter, PublicShell
│   │   ├── tools/                  # Calculators + ToolLayout
│   │   ├── ads/                    # AdBanner, AdSenseScript
│   │   ├── dashboard/ navigation/ sync/
│   ├── context/                    # React context providers
│   ├── hooks/                      # Custom React hooks
│   └── lib/                        # Utilities & configuration
│       ├── firebase.ts
│       ├── siteConfig.ts           # Site + AdSense config
│       ├── toolsData.ts
│       ├── blogData.ts
│       └── collegeSync.ts
├── public/
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## Getting Started

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | `v18+` |
| npm / yarn / pnpm | Latest |
| Firebase Project | Firestore + Authentication enabled |

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/kishanpokal/attendmate-web.git
cd attendmate-web

# 2. Install dependencies
npm install

# 3. Set up environment variables (see below)

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Configuration

Site-wide settings live in `src/lib/siteConfig.ts`:

- `email` — your contact email (shown on Privacy & Contact pages)
- `adsensePublisherId` — your AdSense publisher ID
- `adSlots` — ad unit slot IDs (paste real ones after AdSense approval)

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server at `localhost:3000` |
| `npm run build` | Create an optimized production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint across the codebase |

---

## Advertising & AdSense

Ads are served **only** on public content pages (landing, tools, blog) via
`PublicShell`, which loads the AdSense script. The logged-in app and auth
screens never load ads — this keeps the site compliant with AdSense's content
policies. Search engines are told (via `robots.ts`) not to index app routes.

After AdSense approves the site, create display ad units in your AdSense
dashboard and paste their slot IDs into `src/lib/siteConfig.ts`.

---

## Deployment

This project is deployed on **Vercel** with automatic CI/CD. Every push to `main` triggers a new production deployment. Add your Firebase environment variables in the Vercel dashboard.

---

## Author

**Kishan Pokal**

[![GitHub](https://img.shields.io/badge/GitHub-kishanpokal-181717?style=flat-square&logo=github)](https://github.com/kishanpokal)
&nbsp;
[![Live App](https://img.shields.io/badge/Live%20App-attendmateweb.vercel.app-4f46e5?style=flat-square&logo=vercel)](https://attendmateweb.vercel.app)

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

<sub>Built by <a href="https://github.com/kishanpokal">Kishan Pokal</a> · © 2026 AttendMate</sub>

</div>
