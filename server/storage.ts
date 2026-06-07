import type {
  City,
  Neighborhood,
  Hotel,
  Experience,
  Restaurant,
  Trip,
  TripNeighborhood,
  TripWithNeighborhoods,
  InsertTrip,
  InsertTripNeighborhood,
  QuestionnaireInput,
  Recommendation,
  Favorite,
  InsertFavorite,
  Review,
  InsertReview,
  TripPurposeOption,
} from "@shared/schema";
import { favorites, neighborhoodDescriptions, reviews, trips, tripNeighborhoods } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { cities, neighborhoods, hotels } from "./data/cities";
import { experiences } from "./data/experiences";
import { restaurants } from "./data/restaurants";

const AWIN_AFFILIATE_ID = "2700154";
const AWIN_MID = "6776";

function resolvePlacesImage(image: string, maxHeight = 400): string {
  if (image.startsWith("places/")) {
    const key = process.env.VITE_GOOGLE_MAPS_API_KEY;
    if (key) return `https://places.googleapis.com/v1/${image}/media?maxHeightPx=${maxHeight}&key=${key}`;
  }
  return image;
}

function resolveHotelImage(image: string): string {
  return resolvePlacesImage(image, 400);
}

function buildHotelBookingUrl(hotelName: string, city: City): string {
  const ss = `${hotelName}, ${city.name}`;
  const destinationUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(ss)}`;
  return `https://www.awin1.com/cread.php?awinmid=${AWIN_MID}&awinaffid=${AWIN_AFFILIATE_ID}&ued=${encodeURIComponent(destinationUrl)}`;
}

export interface IStorage {
  init(): Promise<void>;
  getStats(): Promise<{ cities: number; neighborhoods: number; hotels: number }>;
  getCities(): Promise<City[]>;
  getCityBySlug(slug: string): Promise<City | undefined>;
  getCityById(id: string): Promise<City | undefined>;
  getNeighborhoodsByCityId(cityId: string): Promise<Neighborhood[]>;
  getNeighborhoodsByCitySlug(slug: string): Promise<Neighborhood[]>;
  getNeighborhoodById(id: string): Promise<Neighborhood | undefined>;
  getNeighborhoodBySlug(citySlug: string, neighborhoodSlug: string): Promise<Neighborhood | undefined>;
  getHotelsByNeighborhoodId(neighborhoodId: string): Promise<Hotel[]>;
  getExperiencesByCityId(cityId: string): Promise<Experience[]>;
  getRestaurantsByCityId(cityId: string): Promise<Restaurant[]>;
  getRecommendations(input: QuestionnaireInput): Promise<Recommendation[]>;
  updateNeighborhoodDescription(id: string, description: string): Promise<void>;
  getTopNeighborhoodsByPurpose(purpose: TripPurposeOption, limit?: number): Promise<Array<{ neighborhood: Neighborhood; city: City; score: number }>>;

  getReviewsByNeighborhoodId(neighborhoodId: string): Promise<Review[]>;
  addReview(review: InsertReview): Promise<Review>;
  deleteReview(reviewId: number, userId: string): Promise<void>;
  getUserReview(userId: string, neighborhoodId: string): Promise<Review | undefined>;

  getFavoritesByUserId(userId: string): Promise<Favorite[]>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: string, neighborhoodId: string): Promise<void>;
  isFavorite(userId: string, neighborhoodId: string): Promise<boolean>;

  getTripsByUserId(userId: string): Promise<TripWithNeighborhoods[]>;
  getTripById(tripId: number, userId: string): Promise<TripWithNeighborhoods | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  deleteTrip(tripId: number, userId: string): Promise<void>;
  addNeighborhoodToTrip(data: InsertTripNeighborhood): Promise<TripNeighborhood>;
  removeNeighborhoodFromTrip(tripId: number, neighborhoodId: string): Promise<void>;
  isNeighborhoodInTrip(tripId: number, neighborhoodId: string): Promise<boolean>;
  getSimilarNeighborhoods(neighborhoodId: string, limit?: number): Promise<Array<{ neighborhood: Neighborhood; city: City; score: number }>>;
}

export class MemStorage implements IStorage {
  private cities: City[] = cities;
  private neighborhoods: Neighborhood[] = [...neighborhoods];
  private hotels: Hotel[] = hotels;
  private experiences: Experience[] = experiences;
  private restaurants: Restaurant[] = restaurants;

  async getStats(): Promise<{ cities: number; neighborhoods: number; hotels: number }> {
    return {
      cities: this.cities.length,
      neighborhoods: this.neighborhoods.length,
      hotels: this.hotels.length,
    };
  }

  async init(): Promise<void> {
    if (!db) return;
    try {
      const rows = await db.select().from(neighborhoodDescriptions);
      for (const row of rows) {
        const neighborhood = this.neighborhoods.find((n) => n.id === row.neighborhoodId);
        if (neighborhood) {
          neighborhood.aiDescription = row.aiDescription;
        }
      }
    } catch (err) {
      console.error("Failed to load neighborhood descriptions from DB:", err);
    }
  }

  async getFavoritesByUserId(userId: string): Promise<Favorite[]> {
    if (!db) return [];
    return db.select().from(favorites).where(eq(favorites.userId, userId));
  }

  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    if (!db) throw new Error("Database not configured");
    const [newFavorite] = await db.insert(favorites).values(favorite).returning();
    return newFavorite;
  }

  async removeFavorite(userId: string, neighborhoodId: string): Promise<void> {
    if (!db) return;
    await db.delete(favorites).where(
      and(eq(favorites.userId, userId), eq(favorites.neighborhoodId, neighborhoodId))
    );
  }

  async isFavorite(userId: string, neighborhoodId: string): Promise<boolean> {
    if (!db) return false;
    const [favorite] = await db.select().from(favorites).where(
      and(eq(favorites.userId, userId), eq(favorites.neighborhoodId, neighborhoodId))
    );
    return !!favorite;
  }

  async getCities(): Promise<City[]> {
    return this.cities;
  }

  async getCityBySlug(slug: string): Promise<City | undefined> {
    return this.cities.find((c) => c.slug === slug);
  }

  async getCityById(id: string): Promise<City | undefined> {
    return this.cities.find((c) => c.id === id);
  }

  private resolveNeighborhood(n: Neighborhood): Neighborhood {
    return { ...n, heroImage: resolvePlacesImage(n.heroImage, 800) };
  }

  async getNeighborhoodsByCityId(cityId: string): Promise<Neighborhood[]> {
    return this.neighborhoods.filter((n) => n.cityId === cityId).map((n) => this.resolveNeighborhood(n));
  }

  async getNeighborhoodsByCitySlug(slug: string): Promise<Neighborhood[]> {
    const city = await this.getCityBySlug(slug);
    if (!city) return [];
    return this.neighborhoods.filter((n) => n.cityId === city.id).map((n) => this.resolveNeighborhood(n));
  }

  async getNeighborhoodById(id: string): Promise<Neighborhood | undefined> {
    const n = this.neighborhoods.find((n) => n.id === id);
    return n ? this.resolveNeighborhood(n) : undefined;
  }

  async getNeighborhoodBySlug(citySlug: string, neighborhoodSlug: string): Promise<Neighborhood | undefined> {
    const city = await this.getCityBySlug(citySlug);
    if (!city) return undefined;
    const n = this.neighborhoods.find((n) => n.cityId === city.id && n.slug === neighborhoodSlug);
    return n ? this.resolveNeighborhood(n) : undefined;
  }

  async getHotelsByNeighborhoodId(neighborhoodId: string): Promise<Hotel[]> {
    const neighborhood = this.neighborhoods.find((n) => n.id === neighborhoodId);
    const city = neighborhood
      ? this.cities.find((c) => c.id === neighborhood.cityId)
      : undefined;

    return this.hotels
      .filter((h) => h.neighborhoodId === neighborhoodId)
      .map((h) => ({
        ...h,
        image: resolveHotelImage(h.image),
        affiliateUrl:
          h.affiliateUrl || (city
            ? buildHotelBookingUrl(h.name, city)
            : `https://www.awin1.com/cread.php?awinmid=${AWIN_MID}&awinaffid=${AWIN_AFFILIATE_ID}`),
      }));
  }

  async getExperiencesByCityId(cityId: string): Promise<Experience[]> {
    return this.experiences.filter((e) => e.cityId === cityId);
  }

  async getRestaurantsByCityId(cityId: string): Promise<Restaurant[]> {
    return this.restaurants.filter((r) => r.cityId === cityId);
  }

  async updateNeighborhoodDescription(id: string, description: string): Promise<void> {
    const neighborhood = this.neighborhoods.find((n) => n.id === id);
    if (neighborhood) {
      neighborhood.aiDescription = description;
    }
    if (db) {
      try {
        await db
          .insert(neighborhoodDescriptions)
          .values({ neighborhoodId: id, aiDescription: description })
          .onConflictDoUpdate({
            target: neighborhoodDescriptions.neighborhoodId,
            set: { aiDescription: description },
          });
      } catch (err) {
        console.error("Failed to persist AI description to DB:", err);
      }
    }
  }

  async getReviewsByNeighborhoodId(neighborhoodId: string): Promise<Review[]> {
    if (!db) return [];
    return db.select().from(reviews).where(eq(reviews.neighborhoodId, neighborhoodId)).orderBy(desc(reviews.createdAt));
  }

  async addReview(review: InsertReview): Promise<Review> {
    if (!db) throw new Error("Database not configured");
    const [created] = await db.insert(reviews).values(review).returning();
    return created;
  }

  async deleteReview(reviewId: number, userId: string): Promise<void> {
    if (!db) return;
    await db.delete(reviews).where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)));
  }

  async getUserReview(userId: string, neighborhoodId: string): Promise<Review | undefined> {
    if (!db) return undefined;
    const [review] = await db.select().from(reviews).where(
      and(eq(reviews.userId, userId), eq(reviews.neighborhoodId, neighborhoodId))
    );
    return review;
  }

  async getTopNeighborhoodsByPurpose(
    purpose: TripPurposeOption,
    limit = 18
  ): Promise<Array<{ neighborhood: Neighborhood; city: City; score: number }>> {
    const results: Array<{ neighborhood: Neighborhood; city: City; score: number }> = [];
    const perCityLimit = 2;
    const cityCount: Record<string, number> = {};

    const allScoredNeighborhoods = this.neighborhoods.map((n) => {
      const city = this.cities.find((c) => c.id === n.cityId);
      if (!city) return null;

      let score = 0;
      // Mobility baseline (max 20pts)
      score += (n.scores.walkability + n.scores.transitConnectivity) / 10;
      // Safety baseline (max 5pts)
      score += n.scores.safety / 20;
      // Purpose-specific weighting (matches getRecommendations logic)
      switch (purpose) {
        case "solo":
          score += n.scores.safety / 10 + n.scores.localVibes / 10;
          break;
        case "couples":
          score += n.scores.foodCoffeeDensity / 10 + n.scores.safety / 10;
          break;
        case "remote_work":
          score += n.scores.foodCoffeeDensity / 8 + n.scores.walkability / 10;
          break;
        case "foodie_trip":
          score += n.scores.foodCoffeeDensity / 4;
          break;
        case "family":
          score += n.scores.safety / 5 + n.scores.touristFriendliness / 10;
          break;
        case "friends":
          score += n.scores.nightlife / 6 + n.scores.foodCoffeeDensity / 10;
          break;
      }

      return { neighborhood: this.resolveNeighborhood(n), city, score: Math.min(100, Math.round(score)) };
    }).filter(Boolean) as Array<{ neighborhood: Neighborhood; city: City; score: number }>;

    allScoredNeighborhoods.sort((a, b) => b.score - a.score);

    for (const item of allScoredNeighborhoods) {
      if (results.length >= limit) break;
      const count = cityCount[item.city.id] ?? 0;
      if (count >= perCityLimit) continue;
      results.push(item);
      cityCount[item.city.id] = count + 1;
    }

    return results;
  }

  async getRecommendations(input: QuestionnaireInput): Promise<Recommendation[]> {
    const cityNeighborhoods = await this.getNeighborhoodsByCityId(input.cityId);
    
    const scoredNeighborhoods = cityNeighborhoods.map((neighborhood) => {
      let score = 0;
      const matchReasons: string[] = [];

      // Budget match: exact = +20pts, one tier below = +10pts (still walkable area)
      if (neighborhood.priceLevel === input.budget) {
        score += 20;
        matchReasons.push(`Perfect for ${input.budget} budgets.`);
      } else if (
        (input.budget === "moderate" && neighborhood.priceLevel === "budget") ||
        (input.budget === "upscale" && neighborhood.priceLevel === "moderate")
      ) {
        score += 10;
      }

      // Vibe match: +15pts per matching vibe (max 3 vibes = 45pts possible)
      const vibeMatches = input.vibes.filter((v) => neighborhood.vibe.includes(v));
      score += vibeMatches.length * 15;
      if (vibeMatches.length > 0) {
        matchReasons.push(`Matches your ${vibeMatches.join(", ")} vibe preferences.`);
      }

      // Travel style: score/5 = max +20pts from a 100-point score
      if (input.travelStyle === "walk") {
        score += neighborhood.scores.walkability / 5;
        if (neighborhood.scores.walkability >= 85) {
          matchReasons.push("Excellent walkability score for exploring on foot.");
        }
      } else if (input.travelStyle === "transit") {
        score += neighborhood.scores.transitConnectivity / 5;
        if (neighborhood.scores.transitConnectivity >= 85) {
          matchReasons.push("Great transit connections throughout the city.");
        }
      } else {
        // mixed: average both, same max +20pts total
        score += (neighborhood.scores.walkability + neighborhood.scores.transitConnectivity) / 10;
      }

      // Trip purpose: divisors tune how much each metric contributes (max ~10-25pts)
      switch (input.tripPurpose) {
        case "solo":
          // Safety + local feel equally weighted: max ~20pts
          score += neighborhood.scores.safety / 10;
          score += neighborhood.scores.localVibes / 10;
          break;
        case "couples":
          // Good food + safety: max ~20pts
          score += neighborhood.scores.foodCoffeeDensity / 10;
          score += neighborhood.scores.safety / 10;
          break;
        case "remote_work":
          // Heavier food/coffee (cafes to work from): max ~12.5+10=22.5pts
          score += neighborhood.scores.foodCoffeeDensity / 8;
          score += neighborhood.scores.walkability / 10;
          matchReasons.push("Great cafes for remote work.");
          break;
        case "foodie_trip":
          // Highest single-metric weight: food/4 = max 25pts (intentionally dominant)
          score += neighborhood.scores.foodCoffeeDensity / 4;
          if (neighborhood.scores.foodCoffeeDensity >= 85) {
            matchReasons.push("Amazing food and coffee scene.");
          }
          break;
        case "family":
          // Safety matters most: /5 = max 20pts; tourist-friendly a bonus
          score += neighborhood.scores.safety / 5;
          score += neighborhood.scores.touristFriendliness / 10;
          break;
        case "friends":
          // Nightlife primary: /6 ≈ max 16pts; food secondary
          score += neighborhood.scores.nightlife / 6;
          score += neighborhood.scores.foodCoffeeDensity / 10;
          break;
      }

      const normalizedScore = Math.min(100, Math.round(score));

      return {
        neighborhood,
        matchScore: normalizedScore,
        rank: 0,
        matchReasons,
      };
    });

    const sorted = scoredNeighborhoods.sort((a, b) => b.matchScore - a.matchScore);
    const top3 = sorted.slice(0, 3).map((rec, index) => ({
      ...rec,
      rank: index + 1,
    }));

    return top3;
  }

  async getTripsByUserId(userId: string): Promise<TripWithNeighborhoods[]> {
    if (!db) return [];
    const userTrips = await db.select().from(trips).where(eq(trips.userId, userId)).orderBy(desc(trips.createdAt));
    const result: TripWithNeighborhoods[] = [];
    for (const trip of userTrips) {
      const neighborhoods = await db.select().from(tripNeighborhoods).where(eq(tripNeighborhoods.tripId, trip.id)).orderBy(tripNeighborhoods.sortOrder);
      result.push({ ...trip, createdAt: trip.createdAt.toISOString(), neighborhoods: neighborhoods.map(n => ({ ...n, createdAt: n.createdAt.toISOString(), notes: n.notes ?? null })) });
    }
    return result;
  }

  async getTripById(tripId: number, userId: string): Promise<TripWithNeighborhoods | undefined> {
    if (!db) return undefined;
    const [trip] = await db.select().from(trips).where(and(eq(trips.id, tripId), eq(trips.userId, userId)));
    if (!trip) return undefined;
    const neighborhoods = await db.select().from(tripNeighborhoods).where(eq(tripNeighborhoods.tripId, trip.id)).orderBy(tripNeighborhoods.sortOrder);
    return { ...trip, createdAt: trip.createdAt.toISOString(), neighborhoods: neighborhoods.map(n => ({ ...n, createdAt: n.createdAt.toISOString(), notes: n.notes ?? null })) };
  }

  async createTrip(trip: InsertTrip): Promise<Trip> {
    if (!db) throw new Error("Database not configured");
    const [created] = await db.insert(trips).values(trip).returning();
    return created;
  }

  async deleteTrip(tripId: number, userId: string): Promise<void> {
    if (!db) return;
    await db.delete(trips).where(and(eq(trips.id, tripId), eq(trips.userId, userId)));
  }

  async addNeighborhoodToTrip(data: InsertTripNeighborhood): Promise<TripNeighborhood> {
    if (!db) throw new Error("Database not configured");
    const existing = await db.select().from(tripNeighborhoods).where(eq(tripNeighborhoods.tripId, data.tripId));
    const sortOrder = existing.length;
    const [created] = await db.insert(tripNeighborhoods).values({ ...data, sortOrder }).returning();
    return created;
  }

  async removeNeighborhoodFromTrip(tripId: number, neighborhoodId: string): Promise<void> {
    if (!db) return;
    await db.delete(tripNeighborhoods).where(and(eq(tripNeighborhoods.tripId, tripId), eq(tripNeighborhoods.neighborhoodId, neighborhoodId)));
  }

  async isNeighborhoodInTrip(tripId: number, neighborhoodId: string): Promise<boolean> {
    if (!db) return false;
    const [row] = await db.select().from(tripNeighborhoods).where(and(eq(tripNeighborhoods.tripId, tripId), eq(tripNeighborhoods.neighborhoodId, neighborhoodId)));
    return !!row;
  }

  async getSimilarNeighborhoods(neighborhoodId: string, limit = 4): Promise<Array<{ neighborhood: Neighborhood; city: City; score: number }>> {
    const source = this.neighborhoods.find((n) => n.id === neighborhoodId);
    if (!source) return [];

    const PRICE_ORDER = ["budget", "moderate", "upscale", "luxury"];
    const sourcePriceIdx = PRICE_ORDER.indexOf(source.priceLevel);

    const scored = this.neighborhoods
      .filter((n) => n.id !== source.id && n.cityId !== source.cityId)
      .map((n) => {
        let score = 0;

        // Vibe overlap: +12 per shared vibe
        const sharedVibes = source.vibe.filter((v) => n.vibe.includes(v));
        score += sharedVibes.length * 12;

        // Score similarity across 6 dimensions: max 60 pts total
        const dims: Array<keyof typeof source.scores> = [
          "walkability", "foodCoffeeDensity", "safety", "localVibes", "nightlife", "transitConnectivity",
        ];
        for (const dim of dims) {
          score += Math.max(0, 10 - Math.abs(source.scores[dim] - n.scores[dim]) / 10);
        }

        // Price level proximity: +10 exact, +5 one tier away
        const nPriceIdx = PRICE_ORDER.indexOf(n.priceLevel);
        const priceDiff = Math.abs(sourcePriceIdx - nPriceIdx);
        if (priceDiff === 0) score += 10;
        else if (priceDiff === 1) score += 5;

        const city = this.cities.find((c) => c.id === n.cityId);
        return city ? { neighborhood: this.resolveNeighborhood(n), city, score: Math.round(score) } : null;
      })
      .filter(Boolean) as Array<{ neighborhood: Neighborhood; city: City; score: number }>;

    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  }

}

export const storage = new MemStorage();
