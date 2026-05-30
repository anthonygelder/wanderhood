# Wanderhood — Engineering Onboarding

## What It Is

Wanderhood is a **neighborhood matchmaker for car-free travelers**. Most booking platforms (Booking.com, Google Hotels) tell you hotels in a city — they don't tell you *which neighborhood* fits your style. Wanderhood fills that gap: answer 5 questions, get your top 3 neighborhoods scored and ranked, then book a hotel directly.

The core value proposition: specificity. A digital nomad and a honeymooning couple both searching "Paris hotels" get the same Google results. Wanderhood gives each a different neighborhood.

**Live at:** https://wanderhood.app

---

## Scale (as of May 2026)

- **65 cities** across Europe, Asia, the Americas, Middle East, Africa
- **308 neighborhoods** — each hand-scored on 7 dimensions
- **771 hotels** linked with Awin/Booking.com affiliate URLs
- English + Spanish (i18n via react-i18next)
- Dark/light mode throughout

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, TanStack Query, Wouter (routing) |
| UI | Tailwind CSS v3, shadcn/ui (Radix primitives), Framer Motion |
| Backend | Node.js, Express, TypeScript (tsx/ESM) |
| Database | PostgreSQL via Drizzle ORM (schema in `shared/schema.ts`) |
| Auth | Passport.js + Google OAuth 2.0 (`server/auth.ts`) |
| AI | Anthropic Claude Haiku 4.5 — neighborhood descriptions + personalized match explanations |
| Email | Resend (`server/email.ts`) — welcome email on newsletter subscribe |
| Maps | Google Maps JS API (`@googlemaps/js-api-loader`) |
| Mobile | Capacitor (iOS + Android builds possible — `com.stayzones.app`) |
| Testing | Vitest — scoring algorithm unit tests in `tests/scoring.test.ts` |
| Deployment | Railway (single full-stack Node process) |

---

## Project Structure

```
/
├── client/                  # React frontend (Vite root)
│   └── src/
│       ├── pages/           # Route-level components
│       ├── components/      # Shared UI components
│       ├── hooks/           # useRecommendations, use-toast, etc.
│       ├── i18n/locales/    # en.json, es.json translations
│       └── lib/             # tracking.ts, queryClient.ts, utils.ts
├── server/
│   ├── index.ts             # Express entry point
│   ├── routes.ts            # All API routes + rate limiting
│   ├── storage.ts           # MemStorage class — all data access
│   ├── auth.ts              # Google OAuth, Passport, session setup
│   ├── email.ts             # Resend welcome email
│   ├── db.ts                # Drizzle + pg Pool setup
│   └── data/
│       ├── cities.ts        # All 65 cities, 308 neighborhoods, 771 hotels (static)
│       └── experiences.ts   # Viator experiences per city
├── shared/
│   ├── schema.ts            # Zod schemas + Drizzle table definitions (shared client/server)
│   └── models/auth.ts       # users + sessions tables
├── scripts/                 # One-off data scripts (seed, generate-hotels, generate-images)
├── tests/                   # scoring.test.ts
└── migrations/              # Drizzle migration files
```

---

## How the App Works

### Data Architecture

All city/neighborhood/hotel data lives in **`server/data/cities.ts`** — a large static TypeScript file. `MemStorage` loads it into memory at startup. This means:
- Zero DB reads for core content
- Instant response times for all neighborhood/city queries
- Adding a city = editing `cities.ts` and redeploying

The **PostgreSQL database** (via Drizzle) is used only for:
- User accounts + sessions (`users`, `sessions` tables)
- Favorites (`favorites` table)
- User reviews (`reviews` table)
- Newsletter subscribers (`newsletter_subscribers` table)
- Affiliate click tracking (`affiliate_clicks` table)
- Persisted AI descriptions (`neighborhood_descriptions` — cached so Claude isn't called twice for the same neighborhood)

### Scoring Algorithm (`server/storage.ts` → `getRecommendations`)

When a user completes the questionnaire, the server scores every neighborhood in the chosen city:

| Signal | Points |
|---|---|
| Exact budget match | +20 |
| One tier below budget | +10 |
| Each matching vibe (max 3) | +15 each |
| Travel style (walk/transit/mixed) | score÷5 (max +20) |
| Trip purpose weighting | varies (foodie weights food score, family weights safety, etc.) |

Top 3 results are returned. The algorithm is fully unit-tested in `tests/scoring.test.ts`.

### AI Features

Two Claude calls, both using Haiku 4.5 with prompt caching:

1. **Neighborhood descriptions** — generated once per neighborhood per questionnaire input, then persisted to the DB. Subsequent requests for the same neighborhood skip the API call.
2. **Match explanations** (`/api/ai/explain`) — one sentence per result explaining *why this neighborhood fits this specific traveler*. Rate limited: anonymous = 1/day (IP), authenticated = 20/day (user ID).

### Routing (pages)

| URL | Page |
|---|---|
| `/` | Home — hero, questionnaire flow, popular cities |
| `/cities` | All 65 cities, searchable |
| `/city/:slug` | City guide — map, hotels tab, experiences tab, neighborhood comparison |
| `/city/:slug/:neighborhoodSlug` | Neighborhood detail — scores, hotels, reviews, Airbnb card, insurance card |
| `/compare/:citySlug/:n1Slug/:n2Slug` | Side-by-side neighborhood comparison |
| `/neighborhoods/:purpose` | Trip-type landing pages (remote-work, couples, families, solo, foodie, friends) |
| `/guides/:citySlug/:type` | City guide pages (nomad, romantic, family, food, cultural, budget) |
| `/results` | Shared recommendation URL (deep-linked from share button) |
| `/favorites` | Auth-gated — user's saved neighborhoods |

### Authentication

Google OAuth only (GitHub was removed). Sessions stored in PostgreSQL. `isAuthenticated` middleware guards favorites and review-write endpoints. No account needed to get recommendations.

---

## Environment Variables

```
DATABASE_URL          # PostgreSQL connection string
SESSION_SECRET        # Express session signing key
GOOGLE_CLIENT_ID      # OAuth app credentials
GOOGLE_CLIENT_SECRET
BASE_URL              # https://wanderhood.app (used for OAuth callback + sitemap)
ANTHROPIC_API_KEY     # Claude API
RESEND_API_KEY        # Transactional email
EMAIL_FROM            # Sender address (Wanderhood <hello@wanderhood.app>)
VITE_GOOGLE_MAPS_API_KEY  # Client-side Maps embed
VITE_GYG_PARTNER_ID   # GetYourGuide affiliate ID
```

---

## Running Locally

```bash
npm install
# create a .env file with the vars above (DATABASE_URL optional — app runs without it)
npm run dev         # starts Express + Vite dev server on :3000
npm test            # scoring algorithm unit tests
npm run check       # TypeScript type check
npm run db:push     # push schema to Postgres (requires DATABASE_URL)
```

---

## Monetization

All affiliate links go through `trackClick()` in `client/src/lib/tracking.ts` — fire-and-forget, keepalive-enabled. Every click is stored in `affiliate_clicks` with type, URL, neighborhood, city, and user (if signed in).

| Stream | Status |
|---|---|
| Hotels (Awin/Booking.com) | ✅ Live — commission on bookings |
| Experiences (Viator/GetYourGuide) | ✅ Live |
| Airbnb / Vrbo short-term rentals | 🔲 Framework in `airbnb-card.tsx` — pending affiliate approval |
| Flights (Skyscanner) | 🔲 Framework in `flight-search.tsx` — PLACEHOLDER affiliate ID |
| Travel insurance (World Nomads, Cover Genius) | 🔲 Framework in `travel-insurance-card.tsx` — PLACEHOLDER |
| eSIM (Airalo) | 🔲 Framework in `esim-banner.tsx` — PLACEHOLDER affiliate code |

The three pending streams are implemented and rendering on city pages — they just have `PLACEHOLDER` affiliate codes that need real IDs once approved. Search for `TODO:` in those components to find exactly where to drop them in.

---

## Known Issues & Improvement Areas

### Quick wins (hours)
- **Pending affiliate codes** — Airalo, Skyscanner, World Nomads, Cover Genius all have placeholder IDs. Get the accounts approved and swap 4 strings.
- **Email sender domain** — `server/email.ts` still has `wanderhood.com` in the FROM address. Change to `wanderhood.app`.
- **`cities.tsx` canonical URL** — still says `wanderhood.com/cities`. Same fix needed in `pages/cities.tsx`.
- **Language toggle hidden** — city/neighborhood pages aren't translated yet. The toggle is hidden until they are. Complete the translations and re-enable it.

### Medium (days)
- **No pagination on reviews** — `GET /api/neighborhoods/:id/reviews` returns all reviews unbounded. Add a `limit`/`offset` or cursor.
- **City data is a single 2000-line TS file** — works now but will become painful to maintain. Medium-term: move neighborhood/hotel data into the DB and build an admin interface for editing scores.
- **Mobile app (Capacitor)** — `com.stayzones.app` is configured but never shipped. The iOS/Android build flow works (`npm run cap:ios`, `npm run cap:android`) but needs App Store / Play Store submissions.
- **Shared results URL** — the share button is wired up, but the `/results` page (for recipients) needs the same questionnaire input to reconstruct recommendations. Test the full share → open flow end to end.
- **`SESSION_SECRET` default** — `server/auth.ts` has a `|| "dev-secret-change-in-prod"` fallback. Make it a hard crash if missing in production.

### Longer term (roadmap)
- **Wanderhood Pro** — Stripe subscription ($4.99/mo) for unlimited favorites, PDF guides, no AI rate limits
- **Trip planner** — multi-city itinerary builder
- **Newsletter drip** — Resend is wired up for welcome emails; build out a drip sequence
- **"Best time to visit" + daily budget estimator** per neighborhood
- **B2B white-label API** — sell neighborhood scoring to relocation platforms
- **Sponsored neighborhood placements** for tourism boards
- **Spanish-language version** — translations exist for the home page flow; extend to city/neighborhood pages

---

## SEO Strategy

The site is built to rank on long-tail queries:
- **308 neighborhood pages** (`/city/lisbon/alfama`) targeting "[neighborhood] where to stay" queries
- **Comparison pages** (`/compare/paris/le-marais/saint-germain`) targeting "[neighborhood] vs [neighborhood]"
- **Trip-type landing pages** (`/neighborhoods/remote-work`) targeting "best neighborhoods for digital nomads"
- **City guide pages** (`/guides/lisbon/nomad`) targeting "digital nomad guide to Lisbon"
- Schema.org structured data (TouristDestination, TouristAttraction, LodgingBusiness) on every page
- Sitemap covering all URLs, robots.txt properly configured
- Canonical tags on all pages pointing to `wanderhood.app`

---

## Things to Know Before Touching the Code

1. **All neighborhood data is hand-curated static data** in `server/data/cities.ts`. There's no scraping or live data pipeline. Scores were assigned manually. Treat additions carefully — a bad score silently degrades recommendations.
2. **The scoring algorithm has unit tests** — run `npm test` before touching `getRecommendations`.
3. **Claude API calls have prompt caching** — the `system` block is marked `cache_control: ephemeral`. Don't restructure in ways that break the cache hit.
4. **DB is optional** — the app runs without a `DATABASE_URL`. Auth, favorites, reviews, and email subscription will silently no-op. Useful for local dev.
5. **Capacitor app ID is `com.stayzones.app`** — the old name was Stay Zones. The web app is now Wanderhood (`wanderhood.app`). The bundle ID is frozen for App Store continuity if the mobile app gets submitted.
6. **Affiliate tracking is fire-and-forget** — `trackClick()` uses `keepalive: true` and swallows all errors. It must never throw or block navigation.
