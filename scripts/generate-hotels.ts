/**
 * scripts/generate-hotels.ts
 *
 * Phase 1 — Overpass API: fetches real hotel names/data for every neighborhood.
 * Phase 2 — Google Places API: enriches each hotel with a real photo reference.
 *
 * Photo references (places/.../photos/...) are stored in cities.ts and resolved
 * to full CDN URLs at runtime by storage.ts using the server-side API key.
 *
 * Caches:
 *   scripts/.hotel-cache.json  — OSM results, 7-day TTL
 *   scripts/.photo-cache.json  — Google Places photo names, permanent until --force
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/generate-hotels.ts            # Normal run
 *   npx tsx --env-file=.env scripts/generate-hotels.ts --force    # Re-fetch everything
 *   npx tsx --env-file=.env scripts/generate-hotels.ts --dry-run  # Preview only
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { cities, neighborhoods } from "../server/data/cities.js";
import { hotelSchema } from "../shared/schema.js";
import type { Hotel, Neighborhood, City } from "../shared/schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOTEL_CACHE_FILE = path.join(__dirname, ".hotel-cache.json");
const PHOTO_CACHE_FILE = path.join(__dirname, ".photo-cache.json");
const CITIES_FILE = path.join(__dirname, "..", "server", "data", "cities.ts");
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_HOTELS = 2;
const OSM_DELAY_MS = 1100;
const OSM_RETRY_WAIT_MS = 30_000;
const PLACES_DELAY_MS = 200;

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");

const GOOGLE_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY ?? "";

// ── Caches ─────────────────────────────────────────────────────────────────

interface HotelCacheEntry {
  hotels: Hotel[];
  fetchedAt: number;
}

function loadJSON<T>(file: string, fallback: T): T {
  if (fs.existsSync(file)) {
    try { return JSON.parse(fs.readFileSync(file, "utf-8")); } catch { /* ignore */ }
  }
  return fallback;
}

function writeJSON(file: string, data: unknown) {
  if (!DRY_RUN) fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ── Mapping helpers ────────────────────────────────────────────────────────

const PRICE_TO_STARS: Record<string, number> = {
  budget: 2, moderate: 3, upscale: 4, luxury: 5,
};

const STARS_TO_RATING: Record<number, number> = {
  1: 6.5, 2: 7.5, 3: 8.0, 4: 8.5, 5: 9.0,
};

const PRICE_TO_RANGE: Record<string, string> = {
  budget: "$35-80/night",
  moderate: "$80-160/night",
  upscale: "$150-300/night",
  luxury: "$280-600/night",
};

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80",
  "https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=400&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80",
  "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&q=80",
  "https://images.unsplash.com/photo-1496417321479-59f35a7b6487?w=400&q=80",
  "https://images.unsplash.com/photo-1455587734955-081b22074882?w=400&q=80",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80",
  "https://images.unsplash.com/photo-1578683994043-72fea0e87e82?w=400&q=80",
  "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=400&q=80",
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&q=80",
];

function fallbackImage(name: string): string {
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return FALLBACK_IMAGES[hash % FALLBACK_IMAGES.length];
}

function starsToAmenities(stars: number): string[] {
  const a = ["Free WiFi"];
  if (stars >= 3) a.push("Restaurant", "Breakfast");
  if (stars >= 4) a.push("Gym", "Room Service");
  if (stars >= 5) a.push("Spa", "Pool", "Concierge");
  return a.slice(0, 5);
}

function toKebabCase(str: string): string {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Phase 1: Overpass (OSM) ────────────────────────────────────────────────

interface OSMElement { tags?: Record<string, string>; }

async function overpassRequest(query: string): Promise<{ elements: OSMElement[] } | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    let resp: Response;
    try {
      resp = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
    } catch (err) {
      console.warn(`\n  Network error: ${err}`);
      return null;
    }
    if (resp.ok) return resp.json() as Promise<{ elements: OSMElement[] }>;
    if (resp.status === 429) {
      process.stdout.write(`\n  Rate limited — waiting ${OSM_RETRY_WAIT_MS / 1000}s...`);
      await new Promise((r) => setTimeout(r, OSM_RETRY_WAIT_MS));
      continue;
    }
    if (resp.status >= 500) {
      process.stdout.write(`\n  Server error ${resp.status} — retrying in 5s...`);
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }
    console.warn(`\n  Overpass HTTP ${resp.status}`);
    return null;
  }
  return null;
}

async function fetchOSMHotels(nbhd: Neighborhood, city: City): Promise<Hotel[]> {
  const { lat, lng } = nbhd.coordinates;
  for (const radius of [600, 1200]) {
    const query =
      `[out:json][timeout:25];` +
      `(node["tourism"="hotel"](around:${radius},${lat},${lng});` +
      `way["tourism"="hotel"](around:${radius},${lat},${lng});` +
      `relation["tourism"="hotel"](around:${radius},${lat},${lng}););` +
      `out center tags;`;
    const data = await overpassRequest(query);
    if (!data) return [];
    const hotels = mapOSMToHotels(data.elements, nbhd, city);
    if (hotels.length > 0) return hotels;
    if (radius === 600) process.stdout.write(" (widening to 1200m...)");
  }
  return [];
}

function mapOSMToHotels(elements: OSMElement[], nbhd: Neighborhood, city: City): Hotel[] {
  const results: Hotel[] = [];
  const seen = new Set<string>();
  for (const el of elements) {
    const name = el.tags?.name?.trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    const osmStars = parseInt(el.tags?.stars ?? el.tags?.["tourism:stars"] ?? "0", 10);
    const starRating = osmStars >= 1 && osmStars <= 5 ? osmStars : (PRICE_TO_STARS[nbhd.priceLevel] ?? 3);
    const candidate: Hotel = {
      id: `${toKebabCase(name)}-${nbhd.id}`.slice(0, 64),
      neighborhoodId: nbhd.id,
      name,
      starRating,
      rating: STARS_TO_RATING[starRating] ?? 8.0,
      priceRange: PRICE_TO_RANGE[nbhd.priceLevel] ?? "$80-160/night",
      image: fallbackImage(name),
      description: `${name} offers ${starRating}-star accommodation in ${nbhd.name}, ${city.name}.`,
      distanceToTransit: nbhd.transitHubs[0] ? `5 min walk to ${nbhd.transitHubs[0]}` : "10 min walk to city transit",
      amenities: starsToAmenities(starRating),
    };
    const parsed = hotelSchema.safeParse(candidate);
    if (parsed.success) {
      results.push(parsed.data);
      if (results.length >= MAX_HOTELS) break;
    }
  }
  return results;
}

// ── Phase 2: Google Places photos ─────────────────────────────────────────

async function fetchGooglePhotoName(hotelName: string, cityName: string): Promise<string | null> {
  if (!GOOGLE_API_KEY) return null;
  try {
    const resp = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.photos",
      },
      body: JSON.stringify({ textQuery: `${hotelName} ${cityName}`, maxResultCount: 1 }),
    });
    if (!resp.ok) return null;
    const data = await resp.json() as { places?: Array<{ photos?: Array<{ name: string }> }> };
    return data.places?.[0]?.photos?.[0]?.name ?? null;
  } catch {
    return null;
  }
}

// ── Phase 3: Geocoding ─────────────────────────────────────────────────────

const GEOCODE_CACHE_FILE = path.join(__dirname, ".geocode-cache.json");

function placeIdFromImage(image: string): string | null {
  // image is either "places/{placeId}/photos/{photoRef}" or a full URL
  if (!image.startsWith("places/")) return null;
  return image.split("/")[1] ?? null;
}

async function fetchPlaceCoordinates(placeId: string): Promise<{ lat: number; lng: number } | null> {
  if (!GOOGLE_API_KEY) return null;
  try {
    const resp = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        headers: {
          "X-Goog-Api-Key": GOOGLE_API_KEY,
          "X-Goog-FieldMask": "location",
        },
      }
    );
    if (!resp.ok) return null;
    const data = await resp.json() as { location?: { latitude: number; longitude: number } };
    if (!data.location) return null;
    return { lat: data.location.latitude, lng: data.location.longitude };
  } catch {
    return null;
  }
}

// ── File writer ────────────────────────────────────────────────────────────

function hotelToTs(h: Hotel): string {
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const amenities = h.amenities.map((a) => `"${esc(a)}"`).join(", ");
  const coords = h.coordinates
    ? `, coordinates: { lat: ${h.coordinates.lat}, lng: ${h.coordinates.lng} }`
    : "";
  return (
    `  { id: "${esc(h.id)}", neighborhoodId: "${esc(h.neighborhoodId)}", ` +
    `name: "${esc(h.name)}", starRating: ${h.starRating}, rating: ${h.rating}, ` +
    `priceRange: "${esc(h.priceRange)}", image: "${esc(h.image)}", ` +
    `description: "${esc(h.description)}", ` +
    `distanceToTransit: "${esc(h.distanceToTransit)}", amenities: [${amenities}]${coords} }`
  );
}

function rewriteHotelsSection(allHotels: Hotel[]) {
  const source = fs.readFileSync(CITIES_FILE, "utf-8");
  const lines: string[] = [];
  for (const city of cities) {
    for (const nbhd of neighborhoods.filter((n) => n.cityId === city.id)) {
      const nbhdHotels = allHotels.filter((h) => h.neighborhoodId === nbhd.id);
      if (nbhdHotels.length === 0) continue;
      lines.push(`  // ${city.name} - ${nbhd.name}`);
      for (const hotel of nbhdHotels) lines.push(`${hotelToTs(hotel)},`);
    }
  }
  const newSection = `export const hotels: Hotel[] = [\n${lines.join("\n")}\n];`;
  const sectionStart = source.indexOf("\nexport const hotels: Hotel[] = [");
  if (sectionStart === -1) throw new Error("Could not locate hotels array in cities.ts");
  fs.writeFileSync(CITIES_FILE, source.slice(0, sectionStart + 1) + newSection);
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`🏨 Hotel generator — ${DRY_RUN ? "DRY RUN" : "LIVE"} | ${FORCE ? "force re-fetch" : "cache-enabled"}`);
  if (!GOOGLE_API_KEY) console.warn("⚠ VITE_GOOGLE_MAPS_API_KEY not set — skipping photo phase");

  // ── Phase 1: OSM ──
  const hotelCache = FORCE ? {} : loadJSON<Record<string, HotelCacheEntry>>(HOTEL_CACHE_FILE, {});
  const now = Date.now();
  const cityMap = new Map(cities.map((c) => [c.id, c]));
  const nbhdMap = new Map(neighborhoods.map((n) => [n.id, n]));
  const allHotels: Hotel[] = [];
  let osm_fetched = 0, osm_cached = 0;
  const missing: string[] = [];

  for (let i = 0; i < neighborhoods.length; i++) {
    const nbhd = neighborhoods[i];
    const city = cityMap.get(nbhd.cityId);
    if (!city) continue;

    const cached = hotelCache[nbhd.id];
    if (cached && now - cached.fetchedAt <= CACHE_TTL_MS) {
      allHotels.push(...cached.hotels);
      osm_cached++;
      continue;
    }

    process.stdout.write(`[${String(i + 1).padStart(3)}/${neighborhoods.length}] ${city.name} / ${nbhd.name} ... `);
    const hotels = await fetchOSMHotels(nbhd, city);

    if (hotels.length === 0) {
      console.log("⚠ none found");
      missing.push(`${city.name} / ${nbhd.name}`);
    } else {
      console.log(`✓ ${hotels.map((h) => h.name).join(", ")}`);
    }

    hotelCache[nbhd.id] = { hotels, fetchedAt: now };
    allHotels.push(...hotels);
    osm_fetched++;
    writeJSON(HOTEL_CACHE_FILE, hotelCache);
    await new Promise((r) => setTimeout(r, OSM_DELAY_MS));
  }

  console.log(`\n── OSM: ${osm_cached} cached | ${osm_fetched} fetched | ${missing.length} missing | ${allHotels.length} hotels total`);

  // ── Phase 2: Google Places photos ──
  if (GOOGLE_API_KEY) {
    console.log("\n📸 Enriching with Google Places photos...");
    const photoCache = FORCE ? {} : loadJSON<Record<string, string>>(PHOTO_CACHE_FILE, {});
    let ph_cached = 0, ph_fetched = 0, ph_fallback = 0;

    for (let i = 0; i < allHotels.length; i++) {
      const hotel = allHotels[i];
      const city = cityMap.get(nbhdMap.get(hotel.neighborhoodId)?.cityId ?? "");
      if (!city) continue;

      const key = `${hotel.name}|${city.name}`;

      if (photoCache[key] !== undefined) {
        allHotels[i] = { ...hotel, image: photoCache[key] };
        ph_cached++;
        continue;
      }

      process.stdout.write(`  [${i + 1}/${allHotels.length}] ${hotel.name} ... `);
      const photoName = await fetchGooglePhotoName(hotel.name, city.name);

      if (photoName) {
        console.log("✓");
        photoCache[key] = photoName;
        allHotels[i] = { ...hotel, image: photoName };
        ph_fetched++;
      } else {
        console.log("⚠ no photo — using fallback");
        const fb = fallbackImage(hotel.name);
        photoCache[key] = fb;
        allHotels[i] = { ...hotel, image: fb };
        ph_fallback++;
      }

      writeJSON(PHOTO_CACHE_FILE, photoCache);
      await new Promise((r) => setTimeout(r, PLACES_DELAY_MS));
    }

    console.log(`── Photos: ${ph_cached} cached | ${ph_fetched} fetched | ${ph_fallback} fallback`);
  }

  // ── Phase 3: Geocoding ──
  if (GOOGLE_API_KEY) {
    console.log("\n📍 Geocoding hotel coordinates...");
    const geocodeCache = FORCE ? {} : loadJSON<Record<string, { lat: number; lng: number } | null>>(GEOCODE_CACHE_FILE, {});
    let geo_cached = 0, geo_fetched = 0, geo_missing = 0;

    for (let i = 0; i < allHotels.length; i++) {
      const hotel = allHotels[i];
      const placeId = placeIdFromImage(hotel.image);
      if (!placeId) { geo_missing++; continue; }

      if (geocodeCache[placeId] !== undefined) {
        if (geocodeCache[placeId]) allHotels[i] = { ...hotel, coordinates: geocodeCache[placeId]! };
        geo_cached++;
        continue;
      }

      const coords = await fetchPlaceCoordinates(placeId);
      geocodeCache[placeId] = coords;
      if (coords) allHotels[i] = { ...hotel, coordinates: coords };
      else geo_missing++;
      geo_fetched++;

      writeJSON(GEOCODE_CACHE_FILE, geocodeCache);
      await new Promise((r) => setTimeout(r, 100));
    }

    console.log(`── Geocoding: ${geo_cached} cached | ${geo_fetched} fetched | ${geo_missing} no coords`);
  }

  if (DRY_RUN) {
    console.log("\n[DRY RUN] Would write", allHotels.length, "hotels to cities.ts");
    return;
  }

  rewriteHotelsSection(allHotels);
  console.log("\n✅ cities.ts updated");
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
