# DWELL

**Real-time MBTA transit intelligence for Greater Boston.**

DWELL is a fast, terminal-aesthetic web app that lets you select a transit mode, route, and stop — then shows live arrival predictions for that stop, refreshing automatically every 20 seconds. Save your most-used stops as favorites for instant one-tap access.

> *"Dwell time"* — the period a vehicle spends stationary at a stop. DWELL is built around that moment.

---

## Features

- **Cascading selector** — choose Mode → Route → Stop in a clean, searchable interface
- **Live arrivals board** — real-time predictions with per-second countdown timers
- **Favorite stops** — star any stop/route pair and jump back to it instantly from the home screen
- **Service alerts** — active disruptions surface automatically on the arrivals board
- **Terminal aesthetic** — IBM Plex Mono + Syne display type, phosphor-amber accents, scanline texture
- **Auto-refresh** — predictions update every 20 seconds; manual refresh available at any time
- **Mobile responsive** — works cleanly on any screen size

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 |
| Build tool | Vite 5 |
| Fonts | IBM Plex Mono, IBM Plex Sans, Syne (Google Fonts) |
| Data | [MBTA API v3](https://api-v3.mbta.com/) |
| Storage | `localStorage` (favorites only) |
| Dependencies | Zero runtime deps beyond React |

---

## Getting Started

### 1. Get an MBTA API Key

Register for a free key at [https://api-v3.mbta.com/](https://api-v3.mbta.com/).  
The API is free and requires no billing information.

### 2. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/dwell.git
cd dwell
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment

```bash
cp .env.example .env
```

Open `.env` and replace the placeholder:

```env
VITE_MBTA_API_KEY=your_actual_key_here
```

### 5. Run locally

```bash
npm run dev
```

Opens at `http://localhost:3000`.

---

## Project Structure

```
dwell/
├── index.html                  # HTML entry point
├── vite.config.js              # Vite configuration
├── .env.example                # Environment variable template
├── .gitignore
├── package.json
└── src/
    ├── main.jsx                # React root
    ├── App.jsx                 # Page routing + favorites state
    ├── index.css               # Global styles & design tokens
    ├── hooks/
    │   └── index.js            # useRoutes, useStops, usePredictions, useFavorites, useClock
    ├── utils/
    │   └── mbta.js             # API client, constants, color maps, formatters
    └── components/
        ├── Primitives.jsx      # Shared UI atoms (Spinner, LiveDot, Pill, etc.)
        ├── SelectorPanel.jsx   # Mode → Route → Stop cascade with search
        ├── FavoritesPanel.jsx  # Saved stops grid
        └── ArrivalsBoard.jsx   # Live arrivals table + alerts
```

---

## Deployment

### Vercel (recommended — zero config)

```bash
npm install -g vercel
vercel
```

When prompted, set the environment variable:
- **Key:** `VITE_MBTA_API_KEY`
- **Value:** your MBTA API key

Or set it via the Vercel dashboard: **Project → Settings → Environment Variables**.

### Netlify

```bash
npm run build
```

Drag and drop the `dist/` folder into [app.netlify.com/drop](https://app.netlify.com/drop), then add the environment variable in **Site settings → Environment variables**.

For CI/CD deploys, add a `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### GitHub Pages

```bash
npm install --save-dev gh-pages
```

Add to `package.json` scripts:

```json
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"
```

Add to `vite.config.js`:

```js
base: '/dwell/',   // replace with your repo name
```

Then:

```bash
npm run deploy
```

> ⚠️ GitHub Pages doesn't support environment variables natively. For this platform, you can hardcode the key directly in `src/utils/mbta.js` — just be careful not to commit it to a public repo.

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_MBTA_API_KEY
ENV VITE_MBTA_API_KEY=$VITE_MBTA_API_KEY
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

Build and run:

```bash
docker build --build-arg VITE_MBTA_API_KEY=your_key -t dwell .
docker run -p 8080:80 dwell
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_MBTA_API_KEY` | Yes | Your MBTA API v3 key from [api-v3.mbta.com](https://api-v3.mbta.com/) |

Vite exposes only variables prefixed with `VITE_` to the browser bundle.

---

## API Reference

DWELL uses three MBTA v3 endpoints:

| Endpoint | Used for |
|---|---|
| `GET /routes?filter[type]=...` | Load routes by mode |
| `GET /stops?filter[route]=...` | Load stops for a route |
| `GET /predictions?filter[stop]=...&filter[route]=...` | Live arrival predictions |
| `GET /alerts?filter[stop]=...` | Active service alerts |

Full API docs: [https://api-v3.mbta.com/docs/swagger/index.html](https://api-v3.mbta.com/docs/swagger/index.html)

---

## License

MIT — see [LICENSE](LICENSE).

---

*Built with the MBTA API. Not affiliated with or endorsed by the MBTA.*
