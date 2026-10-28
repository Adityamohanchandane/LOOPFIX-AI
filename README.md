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
# Edit .env with your Supabase and Groq credentials

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
│   React Frontend │────▶│  Express Backend  │────▶│  Supabase (Pg)  │
│   (Vite + TW)   │     │   Port 3001       │────▶│   Groq AI API   │
└─────────────────┘     └──────────────────┘     └──────────────────┘
```

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | No* | Supabase project URL |
| `SUPABASE_ANON_KEY` | No* | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | No* | Supabase service role key (for server) |
| `GROQ_API_KEY` | No* | Groq API key for AI analysis |
| `PORT` | No | Server port (default: 3001) |

*Without these, the app runs in **demo mode** (in-memory storage, rule-based classification).

## 🗄️ Database Setup

Run `supabase-schema.sql` in your Supabase SQL Editor to create the complaints table.

## ✨ Features

- **Student Complaint Form** — submit issues with location, category, and description
- **AI Analysis (Groq)** — automatic normalization, categorization, urgency assessment
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
