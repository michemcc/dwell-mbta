# DWELL — Deployment Guide

This guide covers deploying DWELL to **Vercel** with a custom domain purchased through **AWS Route 53**.

---

## Overview

| Step | Where |
|---|---|
| Buy domain | AWS Route 53 |
| Host the site + API functions | Vercel |
| Point domain to Vercel | AWS Route 53 (DNS records) |
| HTTPS / SSL | Vercel (automatic, free) |

---

## Part 1 — Buy a domain on AWS Route 53

1. Sign in to [console.aws.amazon.com](https://console.aws.amazon.com)
2. Search for **Route 53** and open it
3. Click **Register domains → Register domain**
4. Search for your desired domain (e.g. `dwellmbta.com`)
5. Add to cart and complete checkout (~$12–15/year for `.com`)
6. AWS creates a **Hosted Zone** automatically — you'll use this in Part 3

---

## Part 2 — Deploy to Vercel

### 2a. Push your code to GitHub

```bash
cd dwell
git init
git add .
git commit -m "Initial commit"
```

Create a new repo at [github.com/new](https://github.com/new), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/dwell.git
git push -u origin main
```

### 2b. Import into Vercel

1. Go to [vercel.com](https://vercel.com) and sign up / sign in with GitHub
2. Click **Add New → Project**
3. Select your `dwell` repository
4. Vercel detects Vite automatically. Confirm the settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. Click **Deploy** — Vercel builds and gives you a URL like `dwell.vercel.app`

### 2c. Add environment variables

1. In your Vercel project dashboard go to **Settings → Environment Variables**
2. Add each variable for **Production** (and optionally Preview/Development):

| Variable | Value | Notes |
|---|---|---|
| `MBTA_API_KEY` | Your MBTA v3 key | Get free at api-v3.mbta.com |
| `RESEND_API_KEY` | `re_xxxx...` | Get free at resend.com |
| `FEEDBACK_TO_EMAIL` | `you@email.com` | Where feedback lands |
| `FEEDBACK_FROM_EMAIL` | `onboarding@resend.dev` | Or your verified Resend domain |

3. After adding variables, go to **Deployments** and click **Redeploy** so the functions pick them up.

> **Important:** Do NOT set `VITE_MBTA_API_KEY` on Vercel — that would bake the key into the browser bundle. The `MBTA_API_KEY` (no `VITE_` prefix) is only readable by the serverless functions.

### 2d. How the serverless functions work

DWELL has two files in the `/api` folder that Vercel automatically deploys as serverless functions:

- **`/api/mbta.js`** — proxies all MBTA API requests. The browser calls `/api/mbta?path=/stops?filter[route]=Red` and the function appends your `MBTA_API_KEY` server-side before forwarding to `api-v3.mbta.com`. The key is never in the browser.
- **`/api/send-feedback.js`** — accepts feedback form submissions and sends them via Resend. `RESEND_API_KEY` stays on the server.

---

## Part 3 — Point your Route 53 domain to Vercel

### 3a. Add domain in Vercel

1. In your project go to **Settings → Domains**
2. Type your domain (e.g. `dwellmbta.com`) and click **Add**
3. Also add `www.dwellmbta.com` — Vercel will offer to redirect www → apex or vice versa
4. Vercel shows you the DNS records to add

### 3b. Add records in Route 53

1. In AWS console open **Route 53 → Hosted zones → your domain**
2. Add these two records:

**Apex domain (`dwellmbta.com`):**
- Click **Create record**
- Record name: *(leave blank)*
- Record type: **A**
- Value: `76.76.21.21` *(Vercel's IP — always verify in Vercel's domain UI)*
- TTL: `300`

**www subdomain:**
- Record name: `www`
- Record type: **CNAME**
- Value: `cname.vercel-dns.com`
- TTL: `300`

> Vercel's exact IPs and CNAME target are shown in **Settings → Domains** — always use those values rather than hardcoding from documentation, as they can change.

### 3c. Verify in Vercel

1. Back in **Settings → Domains**, Vercel checks DNS every few minutes
2. Once detected, it automatically provisions a free **Let's Encrypt SSL certificate**
3. The domain shows a green ✓ when everything is working
4. DNS propagation can take up to 60 minutes — you can check at [dnschecker.org](https://dnschecker.org)

---

## Part 4 — Automatic deploys (CI/CD)

Every `git push` to `main` triggers an automatic Vercel build and deploy. Pull requests automatically get preview URLs at `dwell-git-branch-name.vercel.app` — useful for testing changes before they go live.

---

## Part 5 — Resend setup (feedback form)

1. Sign up at [resend.com](https://resend.com) — free tier: 100 emails/day
2. **API Keys → Create API Key** — copy the key starting with `re_`
3. Add it as `RESEND_API_KEY` in Vercel environment variables
4. **Sender address options:**
   - Use `onboarding@resend.dev` (Resend's shared sender) — works immediately, no setup
   - Or add your own domain under **Domains** in Resend, verify via a TXT record in Route 53, then use `dwell@yourdomain.com`
5. Redeploy after adding the variable

---

## Part 6 — Local development

```bash
# Standard local dev — calls MBTA directly using VITE_MBTA_API_KEY
cp .env.example .env
# edit .env and add your MBTA key to VITE_MBTA_API_KEY
npm install
npm run dev
```

To test the serverless functions locally (optional):

```bash
npm i -g vercel
vercel dev   # runs Vite + /api functions together on localhost:3000
```

When using `vercel dev`, add `MBTA_API_KEY` (no VITE_ prefix) to your `.env` and the proxy path is used end-to-end exactly as in production.

---

## Part 7 — SEO checklist after going live

1. **Update your domain** — `index.html`, `public/robots.txt`, and `public/sitemap.xml` all reference `dwellmbta.com`. Replace with your actual domain before deploying.

2. **Create an OG image** — social link previews need `/public/og-image.png` (1200×630px). Design one in Canva or Figma with the DWELL wordmark on a dark background and drop it in `/public/`.

3. **Submit to Google Search Console**
   - Go to [search.google.com/search-console](https://search.google.com/search-console)
   - Add your domain and verify ownership via a DNS TXT record in Route 53
   - Submit `https://yourdomain.com/sitemap.xml`
   - Use **URL Inspection** to request indexing of your homepage

4. **Verify structured data** — paste your live URL into [search.google.com/test/rich-results](https://search.google.com/test/rich-results) to confirm the WebApplication schema is recognised.

---

## Troubleshooting

**Site shows 404 on page refresh**
→ Check `vercel.json` has the `rewrites` rule pointing `/*` → `/index.html`. Make sure `/api/*` is excluded from the rewrite (the current rule `/((?!api/).*)`  handles this correctly).

**API calls failing in production**
→ Check that `MBTA_API_KEY` is set in Vercel environment variables and a redeploy has run since you added it. Functions only pick up env vars at deploy time.

**Env vars not taking effect**
→ After adding or changing any environment variable in Vercel, you must trigger a new deployment. Go to **Deployments → ⋯ → Redeploy**.

**DNS not propagating**
→ Wait up to 60 minutes and check at [dnschecker.org](https://dnschecker.org). Verify the A record with `dig dwellmbta.com A` in your terminal.

**SSL certificate pending**
→ Vercel can only issue the cert once DNS resolves correctly. The domain status in Vercel will show the specific error if something is misconfigured.

**Feedback form errors in production**
→ Check `RESEND_API_KEY`, `FEEDBACK_TO_EMAIL`, and `FEEDBACK_FROM_EMAIL` are all set in Vercel. Open **Functions** in the Vercel dashboard to see serverless function logs in real time.

---

## Summary

```
AWS Route 53                   Vercel
─────────────                  ──────────────────────────
Domain registrar         →     Hosts built site + API functions
Hosted Zone              →     Receives DNS records
A record → 76.76.21.21   →     Vercel load balancer
CNAME (www) → vercel-dns →     Vercel CDN edge
```

Total cost: ~$12–15/year (domain) + $0 (Vercel Hobby tier) + $0 (Resend free tier).
