# StayMap - Car-Free Travel Neighborhood Finder

## Overview
StayMap is an interactive map and recommendation engine that helps travelers find the perfect car-free neighborhood for their trip. It answers the #1 trip-planning question: "What neighborhood should I stay in, based on how I like to travel?"

## Current State
MVP implementation complete with:
- Interactive questionnaire for travel preferences
- City-based neighborhood recommendations
- AI-powered neighborhood descriptions via OpenAI
- Neighborhood scoring system (walkability, transit, safety, food/coffee, nightlife, local vibes)
- Hotel listings with affiliate links
- SEO-optimized city landing pages
- Dark/light theme toggle

## Tech Stack
- **Frontend**: React + TypeScript, Wouter routing, TanStack Query, Tailwind CSS, shadcn/ui
- **Backend**: Express.js API server
- **AI**: OpenAI GPT-5 for neighborhood descriptions
- **Storage**: In-memory storage with curated city/neighborhood data

## Project Structure
```
├── client/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── ui/          # shadcn/ui primitives
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── hero-section.tsx
│   │   │   ├── questionnaire.tsx
│   │   │   ├── recommendations-section.tsx
│   │   │   ├── neighborhood-card.tsx
│   │   │   ├── hotel-card.tsx
│   │   │   ├── city-card.tsx
│   │   │   ├── city-hero.tsx
│   │   │   ├── features-section.tsx
│   │   │   ├── popular-cities-section.tsx
│   │   │   ├── neighborhood-comparison.tsx
│   │   │   ├── faq-section.tsx
│   │   │   ├── score-bar.tsx
│   │   │   └── theme-toggle.tsx
│   │   ├── pages/           # Route pages
│   │   │   ├── home.tsx
│   │   │   ├── city.tsx
│   │   │   ├── cities.tsx
│   │   │   └── not-found.tsx
│   │   ├── lib/             # Utilities
│   │   │   ├── queryClient.ts
│   │   │   ├── theme.tsx
│   │   │   └── utils.ts
│   │   ├── App.tsx
│   │   └── index.css
├── server/
│   ├── routes.ts            # API endpoints
│   ├── storage.ts           # In-memory data storage
│   └── index.ts
├── shared/
│   └── schema.ts            # TypeScript types and Zod schemas
└── design_guidelines.md     # Frontend design system
```

## API Endpoints
- `GET /api/cities` - List all available cities
- `GET /api/cities/:slug` - Get city details by slug
- `GET /api/cities/:slug/neighborhoods` - Get neighborhoods for a city
- `GET /api/neighborhoods/:id/hotels` - Get hotels for a neighborhood
- `POST /api/recommendations` - Get personalized neighborhood recommendations

## Available Cities
- Tokyo, Japan
- Lisbon, Portugal
- Mexico City, Mexico
- Barcelona, Spain
- Amsterdam, Netherlands
- Singapore

## User Preferences
- Uses Inter font for body text, Playfair Display for headings
- Clean, modern design with travel-focused imagery
- Card-based UI with subtle hover interactions
- Dark mode support

## Recent Changes
- December 17, 2025: Initial MVP implementation
  - Created data models for cities, neighborhoods, hotels
  - Built questionnaire flow with 5 steps
  - Implemented recommendation algorithm
  - Added OpenAI integration for AI descriptions
  - Created responsive UI with shadcn components

## Next Steps (Future Development)
- Integrate live WalkScore API for real-time data
- Add Google Places API for dynamic food/coffee density
- Implement user accounts to save favorites
- Add neighborhood comparison tool
- Create interactive Mapbox map with neighborhood boundaries
