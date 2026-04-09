/**
 * scripts/generate-neighborhood-images.ts
 *
 * Fetches a Google Places photo for every neighborhood using the neighborhood
 * name, city, and top highlight as the search query. Photo references are stored
 * as "places/.../photos/..." in cities.ts and resolved to full CDN URLs at
 * runtime by storage.ts (same pattern as hotel images).
 *
 * Cache:
 *   scripts/.neighborhood-image-cache.json — permanent until --force
 *
 * Usage:
 *   npm run images:generate              # skip already-cached
 *   npm run images:update                # --force re-fetches everything
 *   npm run images:generate -- --dry-run # preview only, no file writes
 *   npm run images:generate -- --city tokyo  # single city
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { cities, neighborhoods } from "../server/data/cities.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.join(__dirname, ".neighborhood-image-cache.json");
const CITIES_FILE = path.join(__dirname, "..", "server", "data", "cities.ts");
const PLACES_DELAY_MS = 250;

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");
const CITY_FILTER = (() => {
  const idx = process.argv.indexOf("--city");
  return idx !== -1 ? process.argv[idx + 1]?.toLowerCase() : null;
})();

const GOOGLE_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY ?? "";

// ── Cache helpers ──────────────────────────────────────────────────────────

function loadCache(): Record<string, string> {
  if (FORCE) return {};
  if (fs.existsSync(CACHE_FILE)) {
    try { return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8")); } catch { /* ignore */ }
  }
  return {};
}

function saveCache(cache: Record<string, string>) {
  if (!DRY_RUN) fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

// ── Google Places text search ──────────────────────────────────────────────

async function fetchPhotoName(query: string): Promise<string | null> {
  if (!GOOGLE_API_KEY) return null;
  try {
    const resp = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.photos",
      },
      body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
    });
    if (!resp.ok) {
      console.warn(`  Places API error: ${resp.status}`);
      return null;
    }
    const data = await resp.json() as {
      places?: Array<{ photos?: Array<{ name: string }> }>;
    };
    return data.places?.[0]?.photos?.[0]?.name ?? null;
  } catch (err) {
    console.warn(`  Network error: ${err}`);
    return null;
  }
}

// ── Build search query for a neighborhood ──────────────────────────────────

function buildQuery(neighborhoodName: string, cityName: string, highlights: string[], vibes: string[]): string {
  const hint = highlights[0] ?? vibes[0] ?? "neighborhood";
  return `${neighborhoodName} ${cityName} ${hint}`;
}

// ── Rewrite heroImage values in cities.ts ──────────────────────────────────

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function rewriteNeighborhoodImages(updates: Map<string, string>) {
  let content = fs.readFileSync(CITIES_FILE, "utf-8");
  let changed = 0;

  for (const [neighborhoodId, newImage] of updates) {
    // Match the neighborhood's id field, then within the next 600 chars find heroImage
    const pattern = new RegExp(
      `(id: "${escapeRegex(neighborhoodId)}"[\\s\\S]{1,600}?heroImage: )"[^"]*"`,
    );
    const prev = content;
    content = content.replace(pattern, `$1"${newImage}"`);
    if (content !== prev) changed++;
  }

  if (!DRY_RUN) fs.writeFileSync(CITIES_FILE, content);
  return changed;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`🖼  Neighborhood image generator — ${DRY_RUN ? "DRY RUN" : "LIVE"} | ${FORCE ? "force re-fetch" : "cache-enabled"}${CITY_FILTER ? ` | city: ${CITY_FILTER}` : ""}`);

  if (!GOOGLE_API_KEY) {
    console.error("✗ VITE_GOOGLE_MAPS_API_KEY not set — aborting");
    process.exit(1);
  }

  const cityMap = new Map(cities.map((c) => [c.id, c]));
  const cache = loadCache();
  const updates = new Map<string, string>();

  const targets = CITY_FILTER
    ? neighborhoods.filter((n) => {
        const city = cityMap.get(n.cityId);
        return city?.slug === CITY_FILTER || city?.name.toLowerCase() === CITY_FILTER;
      })
    : neighborhoods;

  console.log(`Processing ${targets.length} neighborhoods...\n`);

  let cached = 0, fetched = 0, failed = 0;

  for (let i = 0; i < targets.length; i++) {
    const nbhd = targets[i];
    const city = cityMap.get(nbhd.cityId);
    if (!city) continue;

    const query = buildQuery(nbhd.name, city.name, nbhd.highlights, nbhd.vibe);
    const label = `[${String(i + 1).padStart(3)}/${targets.length}] ${city.name} / ${nbhd.name}`;

    if (cache[nbhd.id] !== undefined) {
      updates.set(nbhd.id, cache[nbhd.id]);
      process.stdout.write(`${label} → cached\n`);
      cached++;
      continue;
    }

    process.stdout.write(`${label} → searching "${query}" ... `);
    const photoName = await fetchPhotoName(query);

    if (photoName) {
      process.stdout.write(`✓\n`);
      cache[nbhd.id] = photoName;
      updates.set(nbhd.id, photoName);
      fetched++;
    } else {
      process.stdout.write(`⚠ no result — keeping existing\n`);
      failed++;
    }

    saveCache(cache);
    await new Promise((r) => setTimeout(r, PLACES_DELAY_MS));
  }

  console.log(`\n── Results: ${cached} cached | ${fetched} fetched | ${failed} no result`);

  if (updates.size === 0) {
    console.log("No updates to write.");
    return;
  }

  if (DRY_RUN) {
    console.log(`[DRY RUN] Would update heroImage for ${updates.size} neighborhoods`);
    return;
  }

  const changed = rewriteNeighborhoodImages(updates);
  console.log(`✅ Updated ${changed}/${updates.size} heroImage values in cities.ts`);
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
