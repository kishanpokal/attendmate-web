<div align="center">

<br />

<img src="https://attendmateweb.vercel.app/favicon.ico" width="88" height="88" alt="AttendMate" />

<br />
<br />

# AttendMate

**Attendance, finally smart.**

AI-powered attendance management for college students — track your percentage, predict safe skips, and stay ahead of the 75% threshold.

<br />

[![Live Demo](https://img.shields.io/badge/Live%20Demo-attendmateweb.vercel.app-7c3aed?style=flat-square&logo=vercel&logoColor=white)](https://attendmateweb.vercel.app)
&nbsp;
[![GitHub Stars](https://img.shields.io/github/stars/kishanpokal/attendmate-web?style=flat-square&color=f59e0b&logo=github)](https://github.com/kishanpokal/attendmate-web)
&nbsp;
[![License](https://img.shields.io/badge/License-MIT-10b981?style=flat-square)](LICENSE)
&nbsp;
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com)

<br />

</div>

---

## Overview

Most college students track attendance mentally — "I think I've attended enough." That guesswork leads to shortages, debarment notices, and last-minute panic.

**AttendMate replaces guesswork with real-time, AI-powered clarity.** Know your exact percentage per subject, get AI predictions on how many classes you can safely skip, and see your friends' attendance — all from a beautiful, dark-themed dashboard built for speed.

> **Try it now →** [attendmateweb.vercel.app](https://attendmateweb.vercel.app)

---

## Features

| Feature | Description |
|---|---|
| ⚡ **One-Click Attendance** | Mark Present or Absent in under 10 seconds. No forms, no friction. |
| 📊 **Live Analytics** | Subject-wise breakdowns and trend lines that update in real-time. |
| 🤖 **AI Copilot** | Powered by Gemini — ask how many classes you can safely skip. |
| 👥 **Friends Tracking** | See your friends' attendance live. Know who made the 8 AM lecture. |
| ☁️ **Cloud Sync** | Firebase-backed, synced instantly across all your devices. |
| 📅 **Smart Timetable** | Set your weekly schedule once. Get auto-prompted when class starts. |

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Full-stack rendering with SSR and API routes |
| **UI Library** | React 19 | Component-based UI with concurrent features |
| **Language** | TypeScript 5 | Type-safe development across the entire codebase |
| **Backend & DB** | Firebase 12 | Auth, Firestore database, real-time cloud sync |
| **AI Engine** | Gemini AI | Skip predictions, natural language insights |
| **Styling** | Tailwind CSS 4 + MUI | Utility-first CSS and Material UI components |
| **3D & Motion** | Three.js + Framer Motion + GSAP | Particle scenes, transitions, scroll animations |
| **Deployment** | Vercel | CI/CD with automatic deploys on every push |

---

## Dashboard Metrics

The dashboard provides a live glassmorphism-styled overview of:

- **Per-subject attendance %** — e.g. Mathematics 82%, DSA 76%
- **Overall attendance** — Aggregate across all subjects
- **AI skip prediction** — Classes you can skip before dropping below 75%
- **Quick mark** — One-tap marking in under 10 seconds
- **Today's lectures** — Auto-populated from your timetable with live status
- **Friends feed** — Real-time attendance status of connected friends

---

## How It Works

```
Step 01 — Sign In
   ├── Login with Google or email
   └── Set up your subjects and weekly timetable

Step 02 — Mark Attendance
   ├── Get auto-prompted when a class starts
   └── Tap Present / Absent — done in under 10 seconds

Step 03 — Get AI Insights
   ├── View real-time analytics on your dashboard
   └── Ask the AI: "How many can I skip this week?"
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  CLIENT (Browser)                   │
│                                                     │
│   Next.js 16     React 19      Three.js / R3F       │
│   App Router     Components    3D Scenes            │
│        │              │             │               │
│   Framer Motion + GSAP + Lenis Smooth Scroll        │
└──────────────────────┬──────────────────────────────┘
                       │
              ┌────────┴────────┐
              │   Firebase SDK  │
              │  (Client Auth)  │
              └────────┬────────┘
                       │
         ┌─────────────┼──────────────┐
         │             │              │
   ┌─────┴──────┐ ┌────┴─────┐ ┌─────┴──────┐
   │ Firestore  │ │ Firebase │ │ Gemini AI  │
   │  Database  │ │   Auth   │ │  Copilot   │
   │ (Realtime) │ │ (Google  │ │Predictions │
   │            │ │ + Email) │ │ & Insights │
   └────────────┘ └──────────┘ └────────────┘
```

---

## Project Structure

```
attendmate-web/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── page.tsx                # Landing page
│   │   ├── layout.tsx              # Root layout
│   │   ├── globals.css             # Global styles
│   │   ├── login/                  # Authentication — Login
│   │   ├── register/               # Authentication — Register
│   │   ├── forgot-password/        # Password recovery
│   │   ├── dashboard/              # Main dashboard (protected)
│   │   ├── attendance/             # Attendance marking & history
│   │   ├── subjects/               # Subject management
│   │   ├── timetable/              # Weekly schedule setup
│   │   ├── friends/                # Friends tracking
│   │   ├── analytics/              # Charts & performance
│   │   ├── ai/                     # AI Copilot interface
│   │   ├── settings/               # User settings
│   │   └── api/                    # API routes
│   ├── components/
│   │   ├── landing/                # Landing page components
│   │   │   ├── SmoothNav.tsx       # Animated navigation bar
│   │   │   ├── HeroScene.tsx       # 3D Three.js hero scene
│   │   │   ├── FloatingDashboard.tsx
│   │   │   ├── FeatureCards.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── StatsBar.tsx
│   │   │   ├── TechStack.tsx
│   │   │   └── FinalCTA.tsx
│   │   ├── dashboard/              # Dashboard UI components
│   │   │   ├── DashboardBackground.tsx
│   │   │   ├── GlassCard.tsx
│   │   │   ├── QuickStatsGrid.tsx
│   │   │   ├── AttendanceSummaryCard.tsx
│   │   │   ├── SubjectPerformanceCard.tsx
│   │   │   ├── TodayLecturesSection.tsx
│   │   │   ├── AICopilotCard.tsx
│   │   │   └── AttendanceDialog.tsx
│   │   ├── navigation/
│   │   └── sync/
│   ├── context/                    # React context providers
│   ├── hooks/                      # Custom React hooks
│   └── lib/                        # Utilities & configuration
│       ├── firebase.ts
│       ├── collegeSync.ts
│       └── ai/                     # Gemini integration
├── data/                           # Static & seed data
├── public/
│   └── screenshots/
├── next.config.ts
├── tailwind.config.ts
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
| Gemini API Key | [Get one here](https://ai.google.dev/) |

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/kishanpokal/attendmate-web.git
cd attendmate-web

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local

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

# Gemini AI
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server at `localhost:3000` |
| `npm run build` | Create an optimized production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint across the codebase |

---

## Deployment

This project is deployed on **Vercel** with automatic CI/CD. Every push to `main` triggers a new production deployment.

**Deploy your own instance:**

1. Fork this repository
2. Connect it to [Vercel](https://vercel.com)
3. Add your environment variables in the Vercel dashboard
4. Push to `main` — deployed automatically

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kishanpokal/attendmate-web)

---

## Contributing

Contributions, issues, and feature requests are welcome.

```bash
# 1. Fork the repository

# 2. Create your feature branch
git checkout -b feature/your-feature-name

# 3. Commit your changes
git commit -m "feat: add your feature"

# 4. Push and open a Pull Request
git push origin feature/your-feature-name
```

Check the [issues page](https://github.com/kishanpokal/attendmate-web/issues) for open tasks.

---

## Author

**Kishan Pokal**

[![GitHub](https://img.shields.io/badge/GitHub-kishanpokal-181717?style=flat-square&logo=github)](https://github.com/kishanpokal)
&nbsp;
[![Live App](https://img.shields.io/badge/Live%20App-attendmateweb.vercel.app-7c3aed?style=flat-square&logo=vercel)](https://attendmateweb.vercel.app)

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

<sub>Built with ❤️ by <a href="https://github.com/kishanpokal">Kishan Pokal</a> · © 2026 AttendMate</sub>

</div>
