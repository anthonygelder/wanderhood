# Wanderhood — TODO

## Monetization: Quick Wins

- [x] Persist newsletter emails to PostgreSQL — newsletter_subscribers table, survives restarts
- [ ] Integrate email service (Resend) for actual newsletter delivery and drip campaigns
- [ ] Sign up for GetYourGuide affiliate program — GYG links already exist in the codebase but are not tracked (non-affiliate)
- [x] Add travel insurance affiliate links (World Nomads or Cover Genius) — framework in place, swap PLACEHOLDER once approved
- [x] Add Airbnb / Vrbo deeplinks per neighborhood alongside hotel listings — framework in place, swap PLACEHOLDER once approved
- [x] Add eSIM affiliate (Airalo via Travelpayouts) — framework in place, swap PLACEHOLDER once approved
- [x] Add flight search deeplinks (Skyscanner or Google Flights) to each city page — framework in place, swap PLACEHOLDER once approved
- [x] Track affiliate link click-through rates — affiliate_clicks DB table + POST /api/track/click, wired to all new and existing hotel buttons

## Monetization: Subscription / Premium Tier

- [ ] Integrate Stripe for payment processing
- [ ] Design "Wanderhood Pro" tier ($4.99/mo or $39/yr)
  - Free: up to 5 saved neighborhoods, 3 recommendations/day
  - Pro: unlimited favorites, PDF itinerary export, 4+ neighborhood comparison, no rate limiting, early access to new cities
- [ ] One-time purchasable PDF city guides ($2.99 each) — auto-generate from existing neighborhood data

## Monetization: Content & Partnerships

- [ ] Sponsored neighborhood or hotel placements — tourism boards and boutique hotels pay for featured cards
- [ ] Newsletter sponsorships — activate once email list reaches 1,000+
- [ ] B2B white-label API — sell neighborhood scoring data to relocation companies, HR platforms, and travel agencies
- [ ] Blog / SEO content strategy — "Best Barcelona neighborhoods for remote workers", "Most walkable Tokyo neighborhoods for couples" — organic traffic feeds affiliate revenue

## New Features: High Impact

- [x] Share results link — generate a shareable URL encoding a recommendation session (key viral/social growth mechanic)
- [ ] Trip planner — save multiple neighborhoods across different cities into a named trip itinerary
- [ ] "Similar neighborhoods" cross-city suggestions — "You liked Le Marais, you'll love Jordaan"
- [ ] Real-time hotelé affiliate listings per neighborhood (OpenTable, Resy, or TheFork)
- [ ] "Best time to visit" info and daily budget estimator on neighborhood detail pages

## New Features: SEO & Growth

- [x] Auto-generated long-tail landing pages — `/neighborhoods/remote-work`, `/neighborhoods/couples`, etc.
- [x] Dedicated neighborhood vs. neighborhood comparison pages (SEO landing pages, not just the modal)
- [x] City-type guide pages — "Digital nomad guide to Lisbon", "Romantic weekend in Paris"
- [x] Improve JSON-LD structured data — add `TouristAttraction` and `LodgingBusiness` schema types
- [ ] Multilingual support — Spanish first (large addressable market, same codebase)

## New Features: UX & Retention

- [ ] Push notifications / email alerts when new neighborhoods are added in a user's saved cities
- [ ] PWA manifest + service worker for "Add to Home Screen"
- [ ] Real-time hotel pricing via Booking.com API — replace static price range strings with live rates
- [ ] Restaurant / café affiliate listings per neighborhood (OpenTable, Resy, or TheFork)
- [x] User review system — brief star rating + one-line tip per visited neighborhood
- [x] Neighborhood photo gallery — user-submitted or curated additional images via Places API

## Technical Debt / Infrastructure

- [x] Replace Replit OIDC with Google / GitHub OAuth — current auth breaks outside Replit hosting
- [x] Add DB seeding script for hotels and experiences — currently all in-memory only
- [x] Write integration tests for the recommendations scoring algorithm
- [x] Add server-side request logging and error tracking (OpenTelemetry or similar)
- [x] Rate limit by authenticated user ID instead of IP only — logged-in users are unfairly penalized on shared IPs
- [x] Add `robots.txt` disallow rules for `/api/*` — currently allows all crawlers on all paths
- [x] Add `Cache-Control` headers to stable API responses (`/api/cities`, `/api/cities/:slug/neighborhoods`)
