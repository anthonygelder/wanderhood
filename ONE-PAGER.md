# Wanderhood — One-Pager

**The car-free traveler's neighborhood matchmaker**

---

## The Problem

Most travel apps tell you *where to stay in a city*. None tell you *which neighborhood actually fits you*. A digital nomad and a honeymooning couple both searching "Paris hotels" get the same results — even though one needs fast Wi-Fi and cheap cafés and the other needs candlelit streets and boutique wine bars.

---

## What Wanderhood Does

Wanderhood asks five questions — budget, vibe, travel style, trip purpose, city — and returns your top three neighborhood matches, scored and ranked. Every result includes an AI-written description tailored to your preferences, an interactive map, hotel bookings, local experiences, and a photo gallery. No account required to get a recommendation.

---

## Scale

- **65 cities** across Europe, Asia, the Americas, and beyond
- **300+ neighborhoods** — each hand-scored on 7 dimensions: walkability, transit, safety, food density, nightlife, tourist-friendliness, and local character
- **Comparison pages** for any two neighborhoods in a city
- **18 trip-type landing pages** — "Top neighborhoods for digital nomads", "Best neighborhoods for couples", etc.
- **City guides** — "Digital nomad guide to Lisbon", "Romantic weekend in Paris" — 6 guide types × 65 cities

---

## Monetization

| Stream | Status | Notes |
|--------|--------|-------|
| Hotel bookings (Awin/Booking.com) | **Live** | Commission on every hotel booking |
| Experience bookings (Viator) | **Live** | Commission on tours and activities |
| Short-term rentals (Airbnb, Vrbo) | Framework ready | Pending affiliate approval |
| Flights (Skyscanner) | Framework ready | Pending affiliate approval |
| Travel insurance (World Nomads, Cover Genius) | Framework ready | Pending affiliate approval |
| eSIM (Airalo) | Framework ready | Pending affiliate approval |
| **Wanderhood Pro** ($4.99/mo) | Roadmap | Unlimited favorites, PDF guides, no rate limits |
| PDF city guides ($2.99 each) | Roadmap | Auto-generated from existing neighborhood data |
| Newsletter sponsorships | Roadmap | Activates at 1,000 subscribers |

All affiliate link clicks are tracked in PostgreSQL — providing conversion data to optimize placement and prioritize which programs to activate first.

---

## Who It's For

- **Independent travelers** who explore cities on foot or by transit
- **Digital nomads** picking a base for weeks or months
- **Couples and families** who want to land in the right neighborhood without researching for hours
- **Travel planners** comparing neighborhoods before booking

---

## Why It Works

1. **Specificity** — A scored match beats a generic "top 10 neighborhoods" list every time
2. **Car-free framing** — Walkability and transit are first-class signals, not afterthoughts
3. **SEO moat** — 300+ neighborhood pages + comparison pages + city guides = thousands of long-tail search entry points
4. **Zero friction** — Recommendations in under 60 seconds, no sign-up required
5. **Compounding data** — User reviews + click tracking improve the product over time

---

## Tech

React + TypeScript · Express · PostgreSQL · Drizzle ORM · Google Maps API · OpenAI GPT-5 · Passport.js (Google/GitHub OAuth) · Deployed as a single full-stack app

---

## Traction Signals

- Newsletter signup on every city and neighborhood page — building an owned audience
- Affiliate click tracking live across all hotel and experience links
- Structured data (Schema.org) on every page — eligible for Google rich results
- Sitemap covering all cities, neighborhoods, guides, and comparison pages

---

## What's Next

**Short term:** Activate pending affiliate programs (Airbnb, Vrbo, Skyscanner, World Nomads, Airalo) · Integrate Resend for email drip campaigns · Launch Wanderhood Pro with Stripe

**Medium term:** Shareable recommendation links (viral growth mechanic) · Trip planner (multi-city itinerary) · "Best time to visit" + daily budget estimator per neighborhood

**Long term:** Spanish-language version · B2B white-label API for relocation platforms · Sponsored neighborhood placements for tourism boards

---

*wanderhood.app — find your neighborhood, not just your hotel*
