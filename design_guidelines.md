# StayMap Design Guidelines

## Design Approach
**Reference-Based**: Drawing inspiration from Airbnb (trust-building, neighborhood focus), Booking.com (hotel discovery), and Spotify (personalized recommendations). This travel discovery platform requires visual appeal to inspire while maintaining clarity for decision-making.

## Core Design Principles
1. **Inspire First, Guide Second**: Beautiful destination imagery builds excitement before practical details
2. **Progressive Disclosure**: Questionnaire → Map → Recommendations → Hotels in natural flow
3. **Trust Through Transparency**: Visible scoring breakdowns, clear methodology, authentic neighborhood character
4. **Mobile-First Planning**: 70% of travel research happens on mobile devices

---

## Typography
- **Primary Font**: Inter (Google Fonts) - clean, modern, excellent at all sizes
- **Accent Font**: Playfair Display for city/neighborhood names - adds sophistication
- **Hierarchy**:
  - Hero Headlines: text-5xl md:text-6xl font-bold
  - Section Headers: text-3xl md:text-4xl font-semibold
  - Neighborhood Names: text-2xl font-serif (Playfair)
  - Body: text-base md:text-lg leading-relaxed
  - UI Labels: text-sm font-medium uppercase tracking-wide

---

## Layout System
**Spacing Units**: Consistent use of 4, 6, 8, 12, 16, 20, 24 (p-4, gap-6, mb-8, py-12, etc.)

**Container Strategy**:
- Full-width sections with `max-w-7xl mx-auto px-6` inner containers
- Map sections: Full viewport width, no padding
- Content sections: `max-w-4xl` for readability
- Card grids: `max-w-6xl`

**Vertical Rhythm**: 
- Section padding: py-16 md:py-24
- Component spacing: space-y-8 md:space-y-12
- Card gaps: gap-6 md:gap-8

---

## Component Library

### Navigation
- Sticky header with blur backdrop (backdrop-blur-lg)
- Logo + City selector dropdown + Sign In CTA
- Mobile: Hamburger menu with slide-in drawer
- Height: 16 (h-16)

### Hero Section
- **Height**: 80vh minimum for impact
- **Layout**: Centered content overlay on full-width background image
- **Content Stack**:
  - Main headline + subheadline
  - Quick questionnaire entry CTA (large button with backdrop blur)
  - Trust indicator: "50,000+ travelers found their perfect neighborhood"
- **Image Treatment**: Dark gradient overlay (40% opacity) for text readability

### Questionnaire Module
- **Card-based steps** with progress indicator at top
- **Layout**: Centered card (max-w-2xl) on subtle background
- **Question Format**:
  - Large question text (text-2xl)
  - Multiple choice: Grid of selectable cards (2-3 columns)
  - Slider inputs: Full-width with value display
  - Visual indicators: Icons for each option
- **Navigation**: Previous/Next buttons, step counter (e.g., "2 of 5")

### Interactive Map Component
- **Full-width section** with 60vh minimum height
- **Neighborhood overlays**: Clickable polygons with hover states
- **Info Cards**: Slide-in panel (right side, 400px width) showing:
  - Neighborhood name + hero image
  - Score bars (walkability, transit, safety, etc.)
  - Quick stats grid
  - "See Hotels" CTA
- **Legend**: Bottom-left corner with scoring key

### Recommendation Cards (Top 3 Results)
- **Layout**: 3-column grid (stacks to 1 on mobile)
- **Card Structure** (each):
  - Large neighborhood image (16:9 ratio, rounded corners)
  - Badge: "#1 Match" / "#2 Match" / "#3 Match"
  - Neighborhood name (text-2xl serif)
  - Match percentage (text-4xl bold)
  - Score breakdown: Horizontal bars with labels
  - 2-3 sentence AI description
  - "View Hotels" button (prominent)
  - "Explore on Map" link (subtle)

### Hotel Listing Cards
- **Layout**: Stacked list within each recommended neighborhood
- **Card Format**:
  - Left: Square hotel image (150x150px)
  - Right: Hotel name, star rating, price range, affiliate CTA
  - Compact design, 3-4 hotels per neighborhood

### Scoring Visualization
- **Horizontal bar charts** (0-100 scale)
- **Categories**: 6-8 scores per neighborhood
- **Visual treatment**: Colored bars with percentage labels, icons for each category

### City Landing Pages (SEO)
- **Hero**: City skyline image + targeted headline
- **Section 1**: "How to Choose" guide (2-column: text + supporting illustration)
- **Section 2**: Neighborhood comparison table (4-5 neighborhoods, scrollable on mobile)
- **Section 3**: "Start Your Search" CTA + questionnaire entry
- **Section 4**: FAQ accordion
- **Footer**: Rich with quick links, city index, affiliate disclosure

### Footer
- **Layout**: 4-column grid (stacks on mobile)
- **Columns**: Cities, Resources, Company, Newsletter signup
- **Height**: Generous (py-16)
- **Bottom bar**: Affiliate disclosure + social links + copyright

---

## Animations
**Minimal and Purposeful**:
- Questionnaire: Smooth slide transitions between steps (300ms ease)
- Map: Subtle zoom on neighborhood hover
- Cards: Gentle lift on hover (translate-y-1)
- Loading states: Skeleton screens, no spinners
- **Avoid**: Scroll-triggered animations, parallax, auto-playing elements

---

## Images

**Hero Section**:
- **Image**: Wide aerial city view showing diverse neighborhoods, golden hour lighting
- **Treatment**: 40% dark gradient overlay from bottom to top
- **Aspect Ratio**: 21:9 for cinematic feel

**Neighborhood Cards**:
- **Images**: Street-level photography capturing neighborhood character
- **Treatment**: Slight vignette, 8px rounded corners
- **Quantity**: 1 hero image per recommended neighborhood (3 total on results)

**City Landing Pages**:
- **Hero**: Iconic city landmark or skyline
- **Supporting**: 2-3 inline images showing different neighborhood types

**Hotel Cards**:
- **Images**: Standard hotel exterior/lobby shots from affiliate APIs
- **Size**: Thumbnail (150x150px), square crop

**Map Section**:
- No static images - Mapbox renders live, but use placeholder during load

---

## Responsive Breakpoints
- **Mobile** (base): Single column, full-width cards, simplified map controls
- **Tablet** (md: 768px): 2-column grids, expanded map panel
- **Desktop** (lg: 1024px): 3-column grids, full layout complexity
- **Wide** (xl: 1280px): Max-width containers prevent over-stretching