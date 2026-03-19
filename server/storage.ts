import type {
  City,
  Neighborhood,
  Hotel,
  Experience,
  QuestionnaireInput,
  Recommendation,
  Favorite,
  InsertFavorite
} from "@shared/schema";
import { favorites } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { cities, neighborhoods, hotels } from "./data/cities";
import { experiences } from "./data/experiences";

const AWIN_AFFILIATE_ID = "2700154";
const AWIN_MID = "6776";

function resolveHotelImage(image: string): string {
  if (image.startsWith("places/")) {
    const key = process.env.VITE_GOOGLE_MAPS_API_KEY;
    if (key) return `https://places.googleapis.com/v1/${image}/media?maxHeightPx=400&key=${key}`;
  }
  return image;
}

function buildHotelBookingUrl(hotelName: string, city: City): string {
  const ss = `${hotelName}, ${city.name}`;
  const destinationUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(ss)}`;
  return `https://www.awin1.com/cread.php?awinmid=${AWIN_MID}&awinaffid=${AWIN_AFFILIATE_ID}&ued=${encodeURIComponent(destinationUrl)}`;
}

export interface IStorage {
  getCities(): Promise<City[]>;
  getCityBySlug(slug: string): Promise<City | undefined>;
  getCityById(id: string): Promise<City | undefined>;
  getNeighborhoodsByCityId(cityId: string): Promise<Neighborhood[]>;
  getNeighborhoodsByCitySlug(slug: string): Promise<Neighborhood[]>;
  getNeighborhoodById(id: string): Promise<Neighborhood | undefined>;
  getHotelsByNeighborhoodId(neighborhoodId: string): Promise<Hotel[]>;
  getExperiencesByCityId(cityId: string): Promise<Experience[]>;
  getRecommendations(input: QuestionnaireInput): Promise<Recommendation[]>;
  updateNeighborhoodDescription(id: string, description: string): Promise<void>;
  
  getFavoritesByUserId(userId: string): Promise<Favorite[]>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: string, neighborhoodId: string): Promise<void>;
  isFavorite(userId: string, neighborhoodId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private cities: City[] = cities;
  private neighborhoods: Neighborhood[] = [...neighborhoods];
  private hotels: Hotel[] = hotels;
  private experiences: Experience[] = experiences;

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

  async getNeighborhoodsByCityId(cityId: string): Promise<Neighborhood[]> {
    return this.neighborhoods.filter((n) => n.cityId === cityId);
  }

  async getNeighborhoodsByCitySlug(slug: string): Promise<Neighborhood[]> {
    const city = await this.getCityBySlug(slug);
    if (!city) return [];
    return this.neighborhoods.filter((n) => n.cityId === city.id);
  }

  async getNeighborhoodById(id: string): Promise<Neighborhood | undefined> {
    return this.neighborhoods.find((n) => n.id === id);
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

  async updateNeighborhoodDescription(id: string, description: string): Promise<void> {
    const neighborhood = this.neighborhoods.find((n) => n.id === id);
    if (neighborhood) {
      neighborhood.aiDescription = description;
    }
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
}

export const storage = new MemStorage();
