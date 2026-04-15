# Never 86'd — Deploy Guide

## Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: Neon Postgres + Drizzle ORM
- **AI**: Claude API (invoice + Z-report parsing)
- **Email**: Resend
- **Hosting**: Vercel (free tier)
- **Total cost**: $0/month (all free tiers)

---

## Step 1: Neon Postgres (2 min)

1. Go to [neon.tech](https://neon.tech) → Sign up (free)
2. Create a new project → name it `never86`
3. Copy the connection string — looks like:
   ```
   postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Save this — it's your `DATABASE_URL`

---

## Step 2: Resend Email (3 min)

1. Go to [resend.com](https://resend.com) → Sign up (free)
2. Add your domain: `never86.ai`
3. Add the DNS records Resend gives you (usually 3 TXT records)
4. Copy your API key — starts with `re_`
5. Save this — it's your `RESEND_API_KEY`

---

## Step 3: Anthropic API Key (1 min)

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Save this — it's your `ANTHROPIC_API_KEY`

---

## Step 4: Push to GitHub (done by Claude)

Repo: `github.com/mykemueller1-ctrl/never86`

---

## Step 5: Deploy on Vercel (3 min)

1. Go to [vercel.com](https://vercel.com) → Sign up / Log in
2. Click "Import Project" → Select the `never86` repo from GitHub
3. Add environment variables:
   - `DATABASE_URL` = your Neon connection string
   - `ANTHROPIC_API_KEY` = your Claude API key
   - `RESEND_API_KEY` = your Resend key
   - `CRON_SECRET` = any random string (e.g. `n86-cron-2024`)
   - `OWNER_EMAIL` = `myke@n86.app`
4. Click Deploy

---

## Step 6: Run Database Migration

After first deploy, open the Vercel terminal or run locally:
```bash
npx drizzle-kit push
```

---

## Step 7: Point DNS (2 min)

Add to your domain DNS:
- `A` record → `76.76.21.21` (Vercel)
- `CNAME` → `cname.vercel-dns.com` (for www)

---

## Cron Job

The morning briefing runs automatically at 6 AM CT (11:00 UTC) via Vercel Cron.
Configured in `vercel.json`.

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/waitlist` | POST | Join waitlist → welcome email + notification |
| `/api/invoices` | POST | Upload invoice text → AI parses → stores |
| `/api/z-reports` | POST | Upload Z-report text → AI parses → stores |
| `/api/briefing` | GET | Generate + send morning briefing (cron) |
