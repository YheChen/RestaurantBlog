# 🍽️ Chen's Toronto Eats

> Chen's **personal** interactive **3D map** of the restaurants I've actually eaten at across
> downtown Toronto — not a finder or a directory. Click a glowing pin to read my own review.

Chen's Toronto Eats blends the feel of **Apple Maps**, **Mapbox**, **Notion**, and **Airbnb** into a
single, polished experience: a full‑bleed, stylized 3D city map with extruded buildings, floating
glassmorphic UI, smooth fly‑to camera animations, and a hand‑curated set of real Toronto restaurants
I've visited and reviewed.

It is built entirely on **free, key‑less** map tiles — no Google Maps, no paid APIs.

---

## ✨ Overview

- **Immersive 3D basemap** — extruded buildings, dark muted palette, blue water, and subtle lighting,
  rendered with MapLibre GL JS over free OpenStreetMap vector tiles.
- **Floating restaurant markers** — custom markers that float, pulse, glow on hover, and scale up.
- **Cinematic camera** — selecting a place flies the camera in with an eased ~1s animation; it never
  jumps.
- **Glassmorphic detail popup** — a blurred, rounded card (bottom sheet on mobile) with the review
  link, description, rating, visit date, and tags.
- **Search, sidebar, and carousel** — three ways to browse: a top‑center search with keyboard
  navigation, a collapsible sidebar of every place, and a hoverable bottom carousel.
- **Filters, favourites & stats** — filter by cuisine and tag, favourite places (persisted locally),
  and view visited statistics.
- **Import / export** — back up or restore your list as validated JSON.
- **2D / 3D toggle** — switch between a pitched 3D city (extruded buildings) and a flat, Google‑Maps‑style
  2D street map; both rendered from the same free vector tiles, with the camera animating between them.
- **Dark / light theme** — dark by default, with a smooth toggle.
- **Responsive & accessible** — desktop‑first, with mobile drawers/sheets, keyboard navigation,
  visible focus states, and ARIA labelling throughout.

---

## 🖼️ Screenshots

> Run the app locally and capture these — the layout is fully responsive.

| Desktop — explore | Restaurant popup | Mobile |
| --- | --- | --- |
| _Full‑bleed 3D map with floating UI_ | _Glassmorphic detail card_ | _Bottom sheet + drawer_ |

_(Place images in `public/screenshots/` and reference them here.)_

---

## 🏗️ Architecture

The app is a single immersive client experience composed of independent, self‑positioning overlays
that float above a full‑bleed map.

```
                         ┌─────────────────────────────────────────┐
   Zustand store ───────▶│  Brand    Search        Controls Toolbar │
   (selection, hover,    │  Sidebar                          Popup  │
    filters, favourites, │            ◀── full-bleed MapView ──▶     │
    theme, map instance) │                                          │
          ▲              │              Bottom Carousel             │
          │              └─────────────────────────────────────────┘
          │                                  │
          └──────────── selectRestaurant(id) ┘
```

**Key ideas**

- **Single source of truth** — a typed Zustand store holds selection, hover, filters, favourites,
  theme, and the live MapLibre `Map` instance. Every surface (markers, sidebar, search, carousel,
  popup) reads/writes the same state, so they stay perfectly in sync.
- **Decoupled camera** — any component focuses a place by calling `selectRestaurant(id)`. A dedicated
  `CameraController` watches the selection and performs the eased fly‑to; markers and the popup react
  to the same state. No component drives the camera directly.
- **Imperative markers, declarative UI** — markers are managed imperatively via the MapLibre API for
  smooth panning, while every other surface is declarative React + Framer Motion.
- **Derived data via hooks** — filtering/search is a memoized selector (`useFilteredRestaurants`),
  keeping components dumb and re‑renders minimal.
- **Resilient by design** — restaurant photos fall back to deterministic gradients; imported JSON is
  validated with Zod before it can touch state.

---

## 📁 Folder Structure

```
app/
  layout.tsx            # Root layout, fonts, metadata, ThemeProvider
  page.tsx              # Composes the map + floating overlays
  icon.svg              # Favicon

components/
  map/
    MapView.tsx         # Creates the MapLibre map, theme swap, loading state
    RestaurantMarker.tsx# Imperative floating/pulsing marker layer
    CameraController.tsx# Eased fly-to on selection
  restaurant/
    RestaurantImage.tsx # Image with gradient fallback
    RatingStars.tsx     # Half-star rating display
    RestaurantPopup.tsx # Glass detail card / bottom sheet
    BottomCarousel.tsx  # Horizontal carousel
    CarouselCard.tsx
  sidebar/
    Sidebar.tsx         # Collapsible list (drawer on mobile)
    SidebarItem.tsx
    SidebarToggle.tsx
  search/
    SearchBar.tsx       # Top-center search with keyboard nav
  controls/
    ControlsToolbar.tsx # Filters / stats / import-export / theme
    FilterPopover.tsx
    StatsPopover.tsx
    ImportExport.tsx
    ThemeToggle.tsx
  layout/
    Brand.tsx
  providers/
    ThemeProvider.tsx
  ui/                   # shadcn/ui primitives

data/
  restaurants.ts        # Curated Toronto restaurants + derived cuisines/tags

hooks/                  # useFilteredRestaurants, useFlyTo, useMediaQuery, useEscapeKey
lib/                    # utils, constants, mapStyle (the 3D dark/light styles)
store/                  # useAppStore (Zustand + persist)
styles/                 # globals.css (tokens, glass utilities, MapLibre overrides)
types/                  # Restaurant type + Zod schemas
public/
```

---

## 🧰 Technology Stack

| Concern | Choice |
| --- | --- |
| Framework | **Next.js 15** (App Router) + **React 19** |
| Language | **TypeScript** (strict, no `any`) |
| Mapping | **MapLibre GL JS** + free **OpenFreeMap** OpenStreetMap vector tiles (3D building extrusion) |
| Styling | **Tailwind CSS**, **shadcn/ui**, **Radix UI** |
| State | **Zustand** (with `persist`) |
| Animation | **Framer Motion** |
| Validation | **Zod** |
| Icons | **Lucide React** |
| Tooling | **ESLint**, **Prettier** |
| Package manager | **npm** |
| Deployment | **Vercel** |

---

## 🚀 Installation

```bash
# 1. Install dependencies
npm install
```

Requirements: **Node 18.18+** (Node 20+ recommended). No environment variables or API keys are
needed — the map tiles are free and key‑less.

---

## 🧑‍💻 Development

```bash
npm run dev        # start the dev server at http://localhost:3000
npm run lint       # ESLint
npm run format     # Prettier (write)
npm run build      # production build
npm run start      # serve the production build
```

---

## ☁️ Deployment

The app deploys to **Vercel** with zero configuration:

1. Push the repository to GitHub.
2. Import the project at [vercel.com/new](https://vercel.com/new).
3. Accept the detected **Next.js** defaults and deploy.

No environment variables are required. (Any static host that supports Next.js works too.)

---

## 🔭 Future Improvements

- **Marker clustering** at low zoom for dense areas.
- **Shareable deep links** (`?place=alo`) that open a restaurant on load.
- **Routing / "near me"** using the browser geolocation API.
- **A CMS or MDX backend** for longer-form reviews and photo galleries.
- **Saved map views** and a "surprise me" random pick.
- **PWA / offline** support and installability.

---

## 📍 Data

The included restaurants are real, well‑regarded Toronto spots (Alo, Sushi Masaki Saito, Prime
Seafood Palace, Bar Isabel, and more). Coordinates are approximate street‑level positions for map
framing, and the reviews are illustrative. Edit `data/restaurants.ts` (or import your own JSON) to
make the map your own.

---

<p align="center"><sub>Built with MapLibre, Next.js, and a lot of good meals. 🧡</sub></p>
