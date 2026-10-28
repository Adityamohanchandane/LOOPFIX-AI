# LoopFix AI

> **"Find the problem that keeps coming back."**

AI-powered campus maintenance intelligence that identifies recurring problems from historical complaints.

## 🚀 Quick Start

```bash
# 1. Clone / navigate to the project
cd "d:\projects\LOOPFIX AI"

# 2. Install dependencies (already done)
npm install

# 3. Configure environment (optional — works in demo mode without it)
cp .env.example .env
# Edit .env with your AI provider credentials (optional)

# 4. Start both frontend and backend
npm run dev
```

This starts:
- **Express backend** on `http://localhost:3001`
- **Vite frontend** on `http://localhost:5173`

Open `http://localhost:5173` in your browser.

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   React Frontend │────▶│  Express Backend  │────▶│  Cloud Firestore│
│   (Vite + TW)   │     │   Port 3001       │────▶│ Groq → Gemini  │
└─────────────────┘     └──────────────────┘     └──────────────────┘
```

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | No* | Primary Groq API key for AI analysis |
| `GEMINI_API_KEY` | No* | Google Gemini backup key; tried if Groq is unavailable or fails |
| `FIREBASE_PROJECT_ID` | For Firestore | Firebase project ID |
| `GOOGLE_APPLICATION_CREDENTIALS` | For Firestore | Path to the Firebase service-account JSON file |
| `PORT` | No | Server port (default: 3001) |

Configure either AI provider, or both for automatic backup. If neither is configured or both fail, the app uses rule-based classification.

Without Firebase credentials, complaints use **demo mode** (in-memory storage) and reset when the server restarts.

## 🗄️ Database Setup

The backend uses Firebase Admin SDK to store complaints in Cloud Firestore:

1. In Firebase Console, create a **Cloud Firestore** database for your project.
2. In **Project settings → Service accounts**, generate a private key. Keep this key private; never commit it or put it in frontend code.
3. For local development, save the JSON key as `.secrets/firebase-service-account.json` and set `FIREBASE_PROJECT_ID` and `GOOGLE_APPLICATION_CREDENTIALS` in `.env`. Use your Firebase project ID for the former and `.secrets/firebase-service-account.json` for the latter.
4. For Render, add the JSON key as a Secret File named `firebase-service-account.json`, then set `FIREBASE_PROJECT_ID` and `GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/firebase-service-account.json` on the backend service.
5. Restart/redeploy the backend and check `GET /api/health`. Firestore is reachable when `services.firestore.connected` is `true`.

The app creates the `complaints` collection when the first complaint is submitted. The browser does not connect directly to Firestore; database access stays on the backend.

## ✨ Features

- **Student Complaint Form** — submit issues with location, category, and description
- **AI Analysis (Groq with Gemini backup)** — automatic normalization, categorization, urgency assessment
- **Rule-based Fallback** — works even when AI is unavailable (clearly labeled)
- **Recurring Issue Detection** — matches new complaints against 90-day history using text similarity + location matching
- **Admin Dashboard** — full complaint management with filters, search, status updates
- **Demo Mode** — loads sample data when no database is configured
- **3D Hero** — interactive perspective-transform dashboard illustration
- **Mobile-first** — responsive at 320px, 375px, 768px, 1440px
- **Accessible** — semantic HTML, keyboard nav, ARIA labels, focus states, reduced-motion support

## 📋 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start both server and client (development) |
| `npm run server` | Start Express server only |
| `npm run client` | Start Vite dev server only |
| `npm run build` | Build frontend for production |
| `npm start` | Start production server (after `npm run build`) |

## 🏆 Hackathon Notes

Built for **AI Vibe Coding Hackathon** — designed to be presented live.

Demo workflow:
1. Open `/` — Hero page explains the product
2. Open `/submit` — Submit a complaint about "leaking water pipe in Block C"
3. AI (or fallback) categorizes it; recurring detection shows previous Block C leak
4. Open `/dashboard` — See the complaint, load demo data, update status
5. Submit another similar complaint — system flags it as recurring
