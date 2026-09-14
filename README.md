<div align="center">
  <img src="public/logo.svg" alt="BriefMail Logo" width="80" height="80" onerror="this.style.display='none'"/>
  
  # ⚡ BriefMail — Autonomous AI Email Assistant & Inbox Workflow Engine

  **Transform overwhelming inboxes into categorized actions, automated drafts, and daily executive digests.**

  [![Next.js](https://img.shields.io/badge/Next.js-15%20App%20Router-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
  [![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)](https://clerk.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20SSR-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
  [![Redis](https://img.shields.io/badge/ioredis-Queue%20%26%20Cache-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
  [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Framer Motion](https://img.shields.io/badge/Framer_Motion-Smooth_UX-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://framer.com/motion)

  [Live Demo](https://briefmail.vercel.app) · [Architecture](#-system-architecture) · [Workflows](#-automated-workflow-pipelines) · [Quick Start](#-quick-start)
</div>

---

## 📌 Overview

**BriefMail** is an intelligent, high-performance email client and background automation system designed for executives, founders, and knowledge workers drowning in email fatigue. 

Unlike conventional mail clients that treat emails as passive text messages, BriefMail ingests messages into a **reactive task queue**, performs multi-tier categorization (Urgent, Action Required, Newsletter, Transactional), generates context-aware draft responses via LLMs, and compiles an automated morning executive briefing.

---

## ✨ Key Features

- **📬 Real-time Ingestion & Classification:** Background webhooks ingest incoming Gmail messages, categorize priority, and extract core action items.
- **🤖 Contextual AI Draft Generation:** Evaluates sender history and message context to draft personalized, professional 1-click responses.
- **📊 Kanban & Priority Workflow Board:** Interactive drag-and-drop (`@dnd-kit`) triage board for converting emails into kanban tasks with dead-simple status transitions.
- **🌅 7:00 AM Daily Executive Digest:** Scheduled cron dispatcher synthesizes overnight correspondence into a 2-minute actionable summary.
- **⚡ Optimistic UI & Micro-interactions:** Built with TanStack Query and Framer Motion + GSAP for instant 60fps keyboard-driven navigation.
- **🔒 Enterprise Auth & Secure Sync:** Powered by Clerk OAuth and Supabase Row Level Security (RLS) with encrypted token rotation.

---

## 🏗 System Architecture

```
[ Gmail API / Webhooks ]
           │
           ▼
[ n8n Workflow Pipelines / Redis BullMQ ]
   ├── 01: Ingestion & Metadata Normalizer
   ├── 02: AI Intent & Entity Extraction (Gemini / LLM)
   ├── 03: Action Dispatcher & Auto-Drafter
   └── 04: Scheduled 7AM Executive Briefing
           │
           ▼
[ Supabase PostgreSQL + pgvector ] ─── (Realtime Subscriptions)
           │
           ▼
[ Next.js 15 App Router Frontend ]
   ├── Clerk Authentication & Session Guard
   ├── DnD-Kit Interactive Task Board
   ├── TanStack Query Optimistic State
   └── GSAP / Framer Motion Micro-UX
```

---

## 🔄 Automated Workflow Pipelines (`/workflows`)

BriefMail includes 5 pre-configured enterprise workflow engines:

1. **`Workflow 1: Email Ingest`** — Validates incoming webhook payload, strips tracking pixels, sanitizes HTML, and extracts thread headers.
2. **`Workflow 2: Startup Catchup`** — Synchronizes unread messages upon account connection or after disconnect recovery.
3. **`Workflow 3: Gmail Action Dispatcher`** — Executes authorized outbound actions (archive, mark read, create draft, star).
4. **`Workflow 4: Daily Digest (7am IST)`** — Autonomous cron pipeline aggregating key updates into an executive brief.
5. **`Workflow 5: Historical Batch Processor`** — Parallel worker processing historical inbox archives with Redis rate limiting.

---

## 🛠 Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Frontend Framework** | Next.js 15 (App Router), React 18, TypeScript (Strict) |
| **Styling & Animation** | Tailwind CSS, Framer Motion, GSAP, Lenis Smooth Scroll |
| **State & Drag-and-Drop** | TanStack React Query, `@dnd-kit/core`, `@dnd-kit/sortable` |
| **Authentication** | Clerk Auth (`@clerk/nextjs`) with Google OAuth Gmail scopes |
| **Database & Realtime** | Supabase PostgreSQL, Supabase SSR (`@supabase/ssr`) |
| **Queue & Cache Worker** | Redis (`ioredis`), Node.js Worker Container (`Docker`) |
| **Automation Engine** | Modular JSON Workflow Specs (n8n / webhook-compatible) |

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Anubhx/BriefMail.git
cd BriefMail
npm install
```

### 2. Environment Variables
Create a `.env.local` file with the following keys:
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI & LLM Keys
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...

# Redis
REDIS_URL=redis://localhost:6379
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 💼 Resume Highlights (Google XYZ Formula)

- **Engineered an autonomous AI email triage platform** using Next.js 15, Redis queues, and Supabase, reducing daily inbox processing time by ~65% via automated categorization and drafting.
- **Architected 5 asynchronous event-driven workflow pipelines** capable of batch ingestion, rate-limited processing, and scheduled morning executive briefings.
- **Implemented a high-performance optimistic UI** with TanStack Query and `@dnd-kit`, achieving zero-latency drag-and-drop task state transitions.

---

## 📄 License
MIT License © Anubhav Raj
