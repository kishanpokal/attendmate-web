# AttendMate 📋

> **Smart Attendance Management System** — built for modern classrooms and institutions.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-attendmateweb.vercel.app-blue?style=for-the-badge)](https://attendmateweb.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

---

## 🌟 Overview

AttendMate is a full-stack attendance management web application built as a Final Year Project. It replaces traditional paper-based attendance with a fast, reliable, and data-driven digital system. Teachers can mark attendance in seconds, and students can view their attendance history and analytics in real time.

**Live at:** [https://attendmateweb.vercel.app](https://attendmateweb.vercel.app)

---

## ✨ Features

### 📝 Attendance Tracking
- Mark student attendance (Present / Absent / Late) with a single click
- Session-based attendance management per subject and date
- Real-time sync across all devices using Firebase Firestore

### 📊 Analytics & Reports
- Visual attendance dashboards with charts and summaries
- Per-student and per-subject attendance percentage breakdowns
- Exportable PDF reports generated with Puppeteer
- Identify at-risk students (below minimum attendance threshold)

### 🔐 Authentication
- Secure Google Sign-In via Firebase Authentication
- Role-based access: Teacher and Student views
- Protected routes and session management

### 📱 Mobile-First Design
- Fully responsive UI optimized for phones, tablets, and desktops
- Built with Material UI (MUI v7) and Tailwind CSS v4
- Smooth page transitions powered by Framer Motion

### 🤖 AI-Powered Insights *(Gemini AI)*
- Attendance pattern analysis using Google Gemini AI
- Smart suggestions for teachers based on class trends

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS v4, Material UI v7, Framer Motion |
| **Backend / Database** | Firebase Firestore (real-time NoSQL) |
| **Authentication** | Firebase Auth (Google Sign-In) |
| **AI** | Google Gemini AI (`@google/generative-ai`) |
| **PDF Export** | Puppeteer Core + Chromium |
| **Deployment** | Vercel |
| **Analytics** | Vercel Analytics |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project ([create one here](https://console.firebase.google.com/))
- A Google Gemini API key ([get one here](https://aistudio.google.com/))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/kishanpokal/attendmate-web.git
cd attendmate-web

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your Firebase and Gemini API keys (see below)

# 4. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Firebase Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

---

## 📁 Project Structure

```
attendmate-web/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── (auth)/           # Login / signup pages
│   │   ├── dashboard/        # Teacher & student dashboards
│   │   ├── attendance/       # Attendance marking pages
│   │   ├── analytics/        # Charts and reports
│   │   └── api/              # API routes (PDF export, AI)
│   ├── components/           # Reusable UI components
│   ├── lib/                  # Firebase config, utilities
│   └── types/                # TypeScript type definitions
├── data/                     # Static/seed data
├── public/                   # Static assets
└── package.json
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   Client (Browser)               │
│         Next.js 16 App Router + React 19         │
│         MUI + Tailwind CSS + Framer Motion       │
└──────────────────────┬──────────────────────────┘
                       │
          ┌────────────▼─────────────┐
          │     Next.js API Routes   │
          │  (PDF Export, AI Proxy)  │
          └────────────┬─────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
  ┌──────────┐  ┌──────────┐  ┌──────────────┐
  │ Firebase │  │ Firebase │  │  Gemini AI   │
  │   Auth   │  │Firestore │  │   (Google)   │
  └──────────┘  └──────────┘  └──────────────┘
```

---

## 📸 Screenshots

> *(Add screenshots of your dashboard, attendance page, and analytics here)*

---

## 🔮 Future Improvements

- [ ] QR Code-based attendance marking
- [ ] Email/SMS notifications for low attendance
- [ ] Bulk CSV import for student data
- [ ] Parent portal with read-only access
- [ ] Offline support with PWA capabilities

---

## 👨‍💻 Author

**Kishan Pokal**
- GitHub: [@kishanpokal](https://github.com/kishanpokal)

---

## 📄 License

This project is developed as a Final Year Project. All rights reserved.

---

> Built with ❤️ using Next.js and Firebase
