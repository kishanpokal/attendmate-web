<div align="center">

<!-- LOGO -->
<img src="https://attendmateweb.vercel.app/favicon.ico" width="80" height="80" alt="AttendMate Logo" />

<h1>AttendMate</h1>

<p><strong>Attendance, finally smart.</strong></p>

<p>
  A full-stack, AI-powered attendance management system built for students — know your exact attendance percentage, predict safe skips, and track friends in real-time.
</p>

<!-- BADGES -->
<p>
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Firebase-10-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Gemini_AI-Google-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

<p>
  <a href="https://attendmateweb.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/🌐_Live_Demo-attendmateweb.vercel.app-5c6bc0?style=for-the-badge" alt="Live Demo" />
  </a>
</p>

</div>

---

## 📸 Screenshots

### 🏠 Landing Page

> *The marketing homepage — clean, dark-themed, hero section with animated dashboard preview.*

![AttendMate Landing Page](https://attendmateweb.vercel.app/og-image.png)

> **Live:** [https://attendmateweb.vercel.app](https://attendmateweb.vercel.app)

---

## 🚀 Features

| Feature | Description |
|---|---|
| ⚡ **One-Click Attendance** | Mark your attendance in under 10 seconds — present, absent, or anything in between |
| 📊 **Live Analytics** | Real-time charts showing trends, subject-wise breakdowns, and performance tracking |
| 🤖 **AI Copilot (Gemini)** | Ask the AI how many classes you can skip, or mark attendance by voice command |
| 👥 **Friends Tracking** | Add friends and see their attendance in real-time — know who made the 8 AM lecture |
| ☁️ **Cloud Sync** | Data securely saved to Firebase, synced instantly across all devices |
| 📅 **Smart Timetable** | Set your weekly schedule once; auto-detect active lectures and get prompted |

---

## 🗂️ Project Structure

```
attendmate-web/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── page.tsx          # Landing page
│   │   ├── login/            # Auth — Login
│   │   ├── register/         # Auth — Register
│   │   └── dashboard/        # Main dashboard (protected)
│   ├── components/           # Reusable UI components
│   ├── lib/                  # Firebase config, utilities
│   └── styles/               # Global styles
├── data/                     # Static/seed data
├── public/                   # Static assets & icons
├── next.config.ts            # Next.js configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── package.json
```

---

## 🛠️ Tech Stack

<table>
  <thead>
    <tr>
      <th>Category</th>
      <th>Technology</th>
      <th>Purpose</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Framework</strong></td>
      <td>
        <img src="https://img.shields.io/badge/Next.js-black?style=flat-square&logo=next.js" />
      </td>
      <td>Full-stack React framework (App Router, SSR)</td>
    </tr>
    <tr>
      <td><strong>UI Library</strong></td>
      <td>
        <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black" />
      </td>
      <td>Component-based UI rendering</td>
    </tr>
    <tr>
      <td><strong>Language</strong></td>
      <td>
        <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
      </td>
      <td>Type-safe development across the entire codebase</td>
    </tr>
    <tr>
      <td><strong>Backend / DB</strong></td>
      <td>
        <img src="https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black" />
      </td>
      <td>Authentication, Firestore database, real-time sync</td>
    </tr>
    <tr>
      <td><strong>AI</strong></td>
      <td>
        <img src="https://img.shields.io/badge/Gemini_AI-4285F4?style=flat-square&logo=google&logoColor=white" />
      </td>
      <td>AI Copilot — skip predictions, voice commands</td>
    </tr>
    <tr>
      <td><strong>Styling</strong></td>
      <td>
        <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" />
        &nbsp;
        <img src="https://img.shields.io/badge/MUI-007FFF?style=flat-square&logo=mui&logoColor=white" />
      </td>
      <td>Utility-first CSS + Material UI components</td>
    </tr>
    <tr>
      <td><strong>Animations</strong></td>
      <td>
        <img src="https://img.shields.io/badge/Framer_Motion-EF0A7E?style=flat-square&logo=framer&logoColor=white" />
      </td>
      <td>Smooth page transitions and UI animations</td>
    </tr>
    <tr>
      <td><strong>Deployment</strong></td>
      <td>
        <img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white" />
      </td>
      <td>CI/CD and hosting via Vercel</td>
    </tr>
  </tbody>
</table>

---

## 📋 How It Works

```
Step 01 — Sign In
  └─ Login with Google or email → Set up subjects & timetable

Step 02 — Mark Attendance
  └─ Get prompted when class starts → Tap Present / Absent

Step 03 — Get AI Insights
  └─ View real-time analytics → Ask AI how many you can skip
```

---

## 🚦 Getting Started

### Prerequisites

- Node.js `v18+`
- npm / yarn / pnpm
- A Firebase project (Firestore + Auth enabled)
- Google Gemini API key

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/kishanpokal/attendmate-web.git
cd attendmate-web

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your Firebase and Gemini API credentials

# 4. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file in the root directory:

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

---

## 📦 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server at `localhost:3000` |
| `npm run build` | Create an optimized production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint across the codebase |

---

## 🌐 Deployment

This project is deployed on **Vercel**. Every push to `main` triggers an automatic deployment.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kishanpokal/attendmate-web)

---

## 📊 Key Metrics (Dashboard)

The dashboard provides a live overview of:

- 📈 **Per-subject attendance %** (e.g. Mathematics 82%, Data Structures 76%)
- 🎯 **Overall attendance** across all subjects
- 🤖 **AI prediction** — how many classes you can safely skip
- ⚡ **Quick mark** — attendance marked in < 10 seconds
- ☁️ **100% cloud-synced** — accessible anywhere

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 👨‍💻 Author

**Kishan Pokal**

- GitHub: [@kishanpokal](https://github.com/kishanpokal)
- Live App: [attendmateweb.vercel.app](https://attendmateweb.vercel.app)

---

## 📄 License

This project is open source. Feel free to use it as a reference or build on top of it.

---

<div align="center">
  <sub>Built with ❤️ by Kishan Pokal · © 2026 AttendMate</sub>
</div>
