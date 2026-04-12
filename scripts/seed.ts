/**
 * Seed script — populates hotels_data, experiences_data, and neighborhood_descriptions
 * from the in-memory TypeScript data files.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/seed.ts           # skip rows that already exist
 *   npx tsx --env-file=.env scripts/seed.ts --force   # truncate and re-seed everything
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { sql } from "drizzle-orm";
import { hotelsTable, experiencesTable, neighborhoodDescriptions } from "../shared/schema";
import { hotels as allHotels, neighborhoods } from "../server/data/cities";
import { experiences as allExperiences } from "../server/data/experiences";

const force = process.argv.includes("--force");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Aborting.");
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  if (force) {
    console.log("--force: truncating existing seed data…");
    await db.execute(sql`TRUNCATE hotels_data, experiences_data RESTART IDENTITY CASCADE`);
  }

  // Seed hotels
  console.log(`Seeding ${allHotels.length} hotels…`);
  const HOTEL_CHUNK = 100;
  for (let i = 0; i < allHotels.length; i += HOTEL_CHUNK) {
    const chunk = allHotels.slice(i, i + HOTEL_CHUNK).map((h) => ({
      id: h.id,
      neighborhoodId: h.neighborhoodId,
      name: h.name,
      starRating: h.starRating,
      rating: String(h.rating),
      priceRange: h.priceRange,
      image: h.image,
      affiliateUrl: h.affiliateUrl ?? null,
      description: h.description,
      distanceToTransit: h.distanceToTransit,
      amenities: h.amenities,
      coordinates: h.coordinates ?? null,
    }));
    await db
      .insert(hotelsTable)
      .values(chunk)
      .onConflictDoNothing();
  }
  console.log("  done.");

  // Seed experiences
  console.log(`Seeding ${allExperiences.length} experiences…`);
  const EXP_CHUNK = 50;
  for (let i = 0; i < allExperiences.length; i += EXP_CHUNK) {
    const chunk = allExperiences.slice(i, i + EXP_CHUNK).map((e) => ({
      id: e.id,
      cityId: e.cityId,
      neighborhoodId: e.neighborhoodId ?? null,
      name: e.name,
      category: e.category,
      duration: e.duration,
      rating: String(e.rating),
      reviewCount: e.reviewCount,
      priceFrom: String(e.priceFrom),
      image: e.image,
      description: e.description,
      affiliateUrl: e.affiliateUrl,
    }));
    await db
      .insert(experiencesTable)
      .values(chunk)
      .onConflictDoNothing();
  }
  console.log("  done.");

  // Seed any neighborhood descriptions already present in the source data
  const withDescriptions = neighborhoods.filter((n) => n.aiDescription);
  if (withDescriptions.length > 0) {
    console.log(`Seeding ${withDescriptions.length} pre-existing AI descriptions…`);
    await db
      .insert(neighborhoodDescriptions)
      .values(withDescriptions.map((n) => ({
        neighborhoodId: n.id,
        aiDescription: n.aiDescription!,
      })))
      .onConflictDoNothing();
    console.log("  done.");
  }

  const [{ hotels: hotelCount }] = await db.execute<{ hotels: string }>(
    sql`SELECT COUNT(*)::text AS hotels FROM hotels_data`
  );
  const [{ experiences: expCount }] = await db.execute<{ experiences: string }>(
    sql`SELECT COUNT(*)::text AS experiences FROM experiences_data`
  );
  console.log(`\nSeed complete. DB totals: ${hotelCount} hotels, ${expCount} experiences.`);

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
