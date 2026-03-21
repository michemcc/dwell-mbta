# DWELL — Deployment Guide

This guide covers deploying DWELL to **Netlify** with a custom domain purchased through **AWS Route 53**.

---

## Overview

| Step | Where |
|---|---|
| Buy domain | AWS Route 53 |
| Host the site | Netlify |
| Point domain to Netlify | AWS Route 53 (DNS records) |
| HTTPS / SSL | Netlify (automatic, free) |

---

## Part 1 — Buy a domain on AWS Route 53

1. Sign in to [console.aws.amazon.com](https://console.aws.amazon.com)
2. Search for **Route 53** and open it
3. Click **Register domains → Register domain**
4. Search for your desired domain (e.g. `dwellmbta.com`)
5. Add to cart and complete checkout (~$12–15/year for `.com`)
6. AWS will create a **Hosted Zone** for your domain automatically — you'll need this in Part 3

---

## Part 2 — Deploy to Netlify

### 2a. Push your code to GitHub first

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

### 2b. Connect to Netlify

1. Go to [app.netlify.com](https://app.netlify.com) and sign up / log in
2. Click **Add new site → Import an existing project**
3. Choose **GitHub** and authorise Netlify to access your repos
4. Select your `dwell` repository
5. Netlify will detect Vite automatically. Confirm these settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. Click **Deploy site** — Netlify builds and gives you a URL like `hungry-shannon-abc123.netlify.app`

### 2c. Add environment variables in Netlify

1. In your Netlify site dashboard go to **Site configuration → Environment variables**
2. Click **Add a variable** for each of the following:

| Key | Value |
|---|---|
| `VITE_MBTA_API_KEY` | Your MBTA API v3 key |
| `VITE_RESEND_API_KEY` | Your Resend API key (optional) |
| `VITE_FEEDBACK_TO_EMAIL` | Email that receives feedback |
| `VITE_FEEDBACK_FROM_EMAIL` | Verified sender in Resend |

3. After adding variables, go to **Deploys → Trigger deploy** to rebuild with the new env vars

### 2d. Add a netlify.toml (already included, but verify)

The repo includes `netlify.toml` at the root. If it's missing, create it:

```toml
[build]
  command   = "npm run build"
  publish   = "dist"

[[redirects]]
  from   = "/*"
  to     = "/index.html"
  status = 200
```

The `[[redirects]]` rule is critical — it makes React routing work correctly (so refreshing a page or navigating directly to a URL doesn't return a 404).

---

## Part 3 — Point your Route 53 domain to Netlify

### 3a. Get Netlify's DNS values

1. In your Netlify dashboard go to **Domain management → Add a domain**
2. Enter your custom domain (e.g. `dwellmbta.com`) and click **Verify**
3. Netlify will show you DNS records to add. You'll need the **Netlify load balancer IP** for the apex domain — it's `75.2.60.5` (Netlify's current value, but always verify in their UI)

### 3b. Add records in Route 53

1. In AWS console, open **Route 53 → Hosted zones**
2. Click your domain's hosted zone
3. You'll add two records:

**Apex domain (`dwellmbta.com`):**
- Click **Create record**
- Record name: *(leave blank)*
- Record type: **A**
- Value: `75.2.60.5` *(Netlify load balancer — confirm in Netlify's domain UI)*
- TTL: `300`
- Click **Create records**

**www subdomain (`www.dwellmbta.com`):**
- Click **Create record**
- Record name: `www`
- Record type: **CNAME**
- Value: `your-netlify-subdomain.netlify.app` *(the URL Netlify gave you in step 2b)*
- TTL: `300`
- Click **Create records**

### 3c. Finalise in Netlify

1. Back in Netlify **Domain management**, click **Verify DNS configuration**
2. Once Netlify detects the records (can take 1–60 minutes for DNS propagation), it will automatically provision a free **Let's Encrypt SSL certificate**
3. Enable **Force HTTPS** in **Domain management → HTTPS**

---

## Part 4 — Automatic deploys (CI/CD)

Once connected, every `git push` to your `main` branch triggers an automatic Netlify build and deploy. No manual steps needed.

To deploy a preview for a branch or pull request, Netlify automatically creates preview URLs at `deploy-preview-N--yoursite.netlify.app`.

---

## Part 5 — Resend setup (for feedback form)

1. Sign up at [resend.com](https://resend.com) — free tier is 100 emails/day
2. Go to **API Keys → Create API Key**, copy the key starting with `re_`
3. Add your domain under **Domains** and follow the DNS verification steps (adds a TXT record in Route 53)
   - Or skip domain verification and use `onboarding@resend.dev` as the `FROM` address (Resend's shared sender — works on the free tier with no setup)
4. Add `VITE_RESEND_API_KEY` to Netlify environment variables (Part 2c above)

---

## Troubleshooting

**Site shows 404 on page refresh**
→ Missing or incorrect `[[redirects]]` in `netlify.toml`. Add it and redeploy.

**Env vars not working after adding them**
→ Trigger a new deploy: Netlify → Deploys → Trigger deploy. Vite bakes env vars at build time, so a rebuild is required after any change.

**DNS not propagating**
→ Wait up to 60 minutes. Check propagation at [dnschecker.org](https://dnschecker.org).

**SSL certificate pending**
→ DNS must resolve correctly before Netlify can issue the cert. Verify the A record with `dig dwellmbta.com A` in your terminal.

**MBTA predictions show API error**
→ Confirm `VITE_MBTA_API_KEY` is set in Netlify environment variables and a fresh deploy has run.

---

## Summary

```
AWS Route 53           Netlify
─────────────          ────────────────────
Domain registrar  →    Hosts built site
Hosted Zone       →    Receives DNS records
A record          →    75.2.60.5 (load balancer)
CNAME (www)       →    yoursite.netlify.app
```

Total cost: ~$12–15/year (domain) + $0 (Netlify free tier) + $0 (Resend free tier).


## Part 6 — SEO checklist after going live

1. **Update your domain** — `index.html`, `robots.txt`, and `sitemap.xml` all reference `dwellmbta.com`. Replace that with your actual domain before deploying.

2. **Create an OG image** — social link previews need `/public/og-image.png` (1200×630px). Without it, link previews will have no image. Design one in Canva or Figma with the DWELL wordmark on a dark background.

3. **Submit to Google Search Console**
   - Go to [search.google.com/search-console](https://search.google.com/search-console)
   - Add your domain property and verify via the DNS TXT record in Route 53
   - Submit `https://yourdomain.com/sitemap.xml`
   - Use "URL Inspection" to request indexing of your homepage

4. **Verify structured data** — paste your live URL into [search.google.com/test/rich-results](https://search.google.com/test/rich-results) to confirm the WebApplication schema is picked up correctly.

