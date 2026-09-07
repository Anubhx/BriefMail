# Comprehensive Setup & Deployment Guide for BriefMail (Brief Mail)

This document provides a step-by-step operational setup guide for configuring **Supabase**, **Clerk Authentication**, **Vercel Deployment**, **Vercel Cron Jobs**, and **Local Redis** for development.

---

## 1. Creating a Supabase Project (Free Tier)

1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New Project** and enter the following details:
   - **Project Name:** `advanced-mail-prod`
   - **Database Password:** Generate or specify a strong password (store this securely).
   - **Region:** `ap-south-1` (Mumbai - closest region for optimal latency).
   - **Pricing Plan:** Free Tier.
3. Click **Create new project** and allow ~2 minutes for provision.

> [!NOTE]
> **Free Tier Pause Protection:** Supabase free tier projects pause automatically after **7 days of inactivity**. BriefMail handles this automatically via a Vercel cron job running every 48 hours to ping the project endpoint (`/api/cron/keepalive`).

---

## 2. Getting Supabase Credentials & Enabling RLS

### A. Extract Credentials
Navigate to **Project Settings**:

1. **API Keys** (`Project Settings -> API`):
   - **`NEXT_PUBLIC_SUPABASE_URL`**: Found under **Project URL** (e.g., `https://xxxx.supabase.co`).
   - **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Found under **Project API keys** (`anon` `public`).
   - **`SUPABASE_SERVICE_ROLE_KEY`**: Found under **Project API keys** (`service_role` `secret`).

2. **Database Connection String** (`Project Settings -> Database`):
   - Scroll to **Connection string** -> **URI** for backend database connections.

### B. Enable Row Level Security (RLS) Globally
To secure your data access:
1. Navigate to **Table Editor** or **SQL Editor** in the Supabase Dashboard.
2. Ensure Row Level Security is enabled on every table by default:
   ```sql
   ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
   ```
3. Define strict RLS policies allowing authenticated users to read/write only their own records.

---

## 3. Creating a Clerk Application

1. Log in to the [Clerk Dashboard](https://dashboard.clerk.com/).
2. Click **Add application** and specify:
   - **Application Name:** `Brief Mail`
   - **Sign-in options to enable:**
     - [x] **Email address**
     - [x] **Google OAuth**
3. Click **Create application**.

### A. Copy API Keys
Navigate to **API Keys** in the left navigation menu:
- Copy **Publishable key** -> `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- Copy **Secret key** -> `CLERK_SECRET_KEY`

### B. Configure Redirect & Allowed Origins
1. Navigate to **Paths** / **Domains** in Clerk Dashboard.
2. Add your development & production URLs:
   - **Development:** `http://localhost:3000`
   - **Production:** `https://<your-app>.vercel.app`

---

## 4. Setting Up Vercel Project & Cron Jobs

### A. Connect Repository
1. Log in to [Vercel](https://vercel.com/dashboard) and click **Add New... -> Project**.
2. Select your GitHub repository (`BriefMail` / `advanced-mail-prod`).
3. Framework Preset: **Next.js**.

### B. Configure Environment Variables
In the Vercel project deployment settings, add all environment variables listed in `.env.local.example`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_SUPABASE_URL=https://<your-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_KEY_1=...
GEMINI_KEY_2=...
GEMINI_KEY_3=...
GEMINI_KEY_4=...
HF_KEY_1=...
HF_KEY_2=...
HF_KEY_3=...
HF_KEY_4=...
N8N_WEBHOOK_SECRET=...
REDIS_URL=redis://...
CRON_SECRET=your_super_secret_cron_token
```

### C. Vercel Cron Jobs Configuration
BriefMail includes a [`vercel.json`](file:///Users/anubhav/Downloads/BriefMail/vercel.json) file in the root directory that automatically provisions the required Vercel Cron Schedules upon deployment:

```json
{
  "crons": [
    {
      "path": "/api/cron/keepalive",
      "schedule": "0 0 */2 * *"
    },
    {
      "path": "/api/cron/batch-process",
      "schedule": "0 * * * *"
    }
  ]
}
```

* **Keepalive Cron (`/api/cron/keepalive`)**: Runs every **48 hours** (`0 0 */2 * *`) to ping Supabase and prevent free tier project pausing.
* **Batch Processing Cron (`/api/cron/batch-process`)**: Runs **hourly** (`0 * * * *`) for automated email triage and background processing.

---

## 5. Local Redis Setup for Development

For local caching, job queues, and rate-limiting during development, run a local Redis instance via Docker:

```bash
# Pull and start Redis container in detached mode on port 6379
docker run -d --name briefmail-redis -p 6379:6379 redis:alpine
```

Verify that the container is running:
```bash
docker ps
```

In your local `.env` or `.env.local` file, set:
```env
REDIS_URL=redis://localhost:6379
```

---

## 6. Setup Verification Checklist

Use this checklist to confirm all setup steps are complete and functional:

| Verification Task | Requirement / Location | Status |
|---|---|---|
| **Supabase Project** | Created `advanced-mail-prod` in `ap-south-1` (Mumbai) | [ ] Verified |
| **Supabase RLS** | RLS enabled globally on all production database tables | [ ] Verified |
| **Clerk Auth** | App `Brief Mail` created with Email & Google OAuth enabled | [ ] Verified |
| **Clerk Redirects** | Allowed origins set for `localhost:3000` & Vercel domain | [ ] Verified |
| **Environment Variables** | All 16 env vars added to local `.env` & Vercel Project Settings | [ ] Verified |
| **Vercel Cron: Keepalive** | `/api/cron/keepalive` scheduled for every 48 hours (`0 0 */2 * *`) | [ ] Verified |
| **Vercel Cron: Batch** | `/api/cron/batch-process` scheduled for hourly (`0 * * * *`) | [ ] Verified |
| **Local Redis** | Docker container `redis:alpine` running on port `6379` | [ ] Verified |
| **Build & Lint Verification** | `pnpm run build` and `pnpm run lint` pass without errors | [ ] Verified |
