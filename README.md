# Wanderhood

A car-free travel neighborhood recommendation engine. Answer a short questionnaire about your travel preferences and get personalized neighborhood recommendations with walkability scores, transit info, hotels, and local experiences.

## What It Does

Users select a destination city, set their budget, pick their travel vibes (artsy, foodie, historic, etc.), and choose their travel style. The app scores every neighborhood in that city against their preferences and surfaces the top 3 matches — complete with an interactive map, hotel listings, and curated experiences.

**Key features:**
- 65 cities, 300+ scored neighborhoods worldwide
- AI-generated neighborhood descriptions (OpenAI)
- Interactive Google Maps with transit/cycling layers and neighborhood polygons
- Hotel listings with Booking.com affiliate links (Awin)
- Tour/experience listings with Viator affiliate links
- User accounts with saved favorites (Replit Auth / OIDC)
- SEO: dynamic sitemap, robots.txt, JSON-LD structured data

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion |
| Routing | Wouter |
| Data Fetching | TanStack React Query |
| Backend | Express.js, TypeScript (tsx) |
| Database | PostgreSQL 16, Drizzle ORM |
| Auth | Passport.js + OpenID Connect (Replit Auth) |
| Maps | Google Maps API (Advanced Markers, Polygons, Transit Layer) |
| AI | OpenAI API (GPT-5 neighborhood descriptions) |
| Hosting | Replit (autoscale deployment) |

## Local Development

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:5000`. It uses `.env` for environment variables.

> **Note:** Replit Auth (`REPL_ID`) is required for login/favorites to work. In local dev without it, auth is skipped gracefully — the rest of the app works fine.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `VITE_GOOGLE_MAPS_API_KEY` | Yes | Google Maps API key (exposed to client) |
| `OPENAI_API_KEY` | No | GPT-5 for AI neighborhood descriptions (falls back to static text) |
| `SESSION_SECRET` | Yes (prod) | Session encryption key |
| `REPL_ID` | Yes (prod) | Replit app ID for OIDC auth |
| `ISSUER_URL` | No | OIDC issuer (defaults to `https://replit.com/oidc`) |
| `BASE_URL` | No | App base URL (defaults to `https://wanderhood.com`) |
| `PORT` | No | Server port (defaults to 5000) |

## Database Setup

```bash
npm run db:push   # push schema to PostgreSQL
```

Tables: `users`, `sessions`, `favorites`, `neighborhood_descriptions`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build (Vite + esbuild) |
| `npm run start` | Run production build |
| `npm run check` | TypeScript type check |
| `npm run db:push` | Push DB schema |
| `npm run hotels:generate` | Generate hotel data (Overpass + Google Places) |
| `npm run hotels:update` | Force-regenerate all hotel data |
| `npm run images:generate` | Generate neighborhood hero images (Google Places) |
| `npm run images:update` | Force-regenerate all neighborhood images |

## Project Structure

```
├── client/src/
│   ├── pages/          # home, city, neighborhood, favorites, 404
│   ├── components/     # UI components (map, questionnaire, hotel cards, etc.)
│   └── hooks/          # use-auth, use-recommendations, use-favorites
├── server/
│   ├── data/           # cities.ts (all city/neighborhood data), experiences.ts
│   ├── replit_integrations/auth/  # OIDC auth setup
│   ├── index.ts        # Express app entry
│   ├── routes.ts       # All API endpoints
│   └── storage.ts      # Data access layer + scoring algorithm
├── shared/
│   └── schema.ts       # Zod schemas and TypeScript types
├── scripts/
│   ├── generate-hotels.ts                 # Hotel data generator
│   └── generate-neighborhood-images.ts    # Neighborhood hero image generator
└── script/
    └── build.ts        # Custom esbuild/Vite build
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cities` | All cities |
| GET | `/api/cities/:slug` | Single city |
| GET | `/api/cities/:slug/neighborhoods` | Neighborhoods for a city |
| GET | `/api/cities/:citySlug/neighborhoods/:neighborhoodSlug` | Single neighborhood |
| GET | `/api/neighborhoods/:id/hotels` | Hotels for a neighborhood |
| GET | `/api/cities/:slug/experiences` | Viator experiences for a city |
| POST | `/api/recommendations` | Get top 3 recommendations (rate limited: 20/15min) |
| POST | `/api/subscribe` | Newsletter email capture |
| GET | `/api/auth/user` | Current user (auth required) |
| GET | `/api/favorites` | User's saved neighborhoods (auth required) |
| POST | `/api/favorites` | Save a neighborhood (auth required) |
| DELETE | `/api/favorites/:neighborhoodId` | Remove from favorites (auth required) |

## Scoring Algorithm

Neighborhoods are scored against questionnaire input (max 100 points):

- **Budget match**: up to 20 pts
- **Vibe match**: up to 15 pts per vibe selected (1-3 vibes)
- **Travel style** (walk/transit/mixed): up to 20 pts
- **Trip purpose** (solo/couples/remote/foodie/family/friends): up to 25 pts

## Affiliate Programs

- **Hotels**: [Awin](https://www.awin.com/) — Booking.com (MID: 6776)
- **Experiences**: [Viator](https://www.viator.com/) — Partner ID: P00293051

## Deployment

Deployed on Replit autoscale. Build: `npm run build` → `node ./dist/index.cjs`.
