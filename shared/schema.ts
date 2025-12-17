import { z } from "zod";
import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { users } from "./models/auth";

// Favorites table - linked to auth users
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  neighborhoodId: varchar("neighborhood_id", { length: 255 }).notNull(),
  cityId: varchar("city_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
}));

// Insert schema for favorites
export const insertFavoriteSchema = createInsertSchema(favorites).omit({ id: true, createdAt: true });
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

// City schema
export const citySchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  slug: z.string(),
  description: z.string(),
  heroImage: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  timezone: z.string(),
});

export type City = z.infer<typeof citySchema>;

// Neighborhood scores
export const neighborhoodScoresSchema = z.object({
  walkability: z.number().min(0).max(100),
  transitConnectivity: z.number().min(0).max(100),
  safety: z.number().min(0).max(100),
  foodCoffeeDensity: z.number().min(0).max(100),
  nightlife: z.number().min(0).max(100),
  touristFriendliness: z.number().min(0).max(100),
  localVibes: z.number().min(0).max(100),
});

export type NeighborhoodScores = z.infer<typeof neighborhoodScoresSchema>;

// Neighborhood schema
export const neighborhoodSchema = z.object({
  id: z.string(),
  cityId: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  aiDescription: z.string().optional(),
  heroImage: z.string(),
  vibe: z.array(z.string()),
  scores: neighborhoodScoresSchema,
  highlights: z.array(z.string()),
  transitHubs: z.array(z.string()),
  priceLevel: z.enum(["budget", "moderate", "upscale", "luxury"]),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  boundaryCoordinates: z.array(z.array(z.number())),
});

export type Neighborhood = z.infer<typeof neighborhoodSchema>;

// Hotel schema
export const hotelSchema = z.object({
  id: z.string(),
  neighborhoodId: z.string(),
  name: z.string(),
  starRating: z.number().min(1).max(5),
  rating: z.number().min(0).max(10),
  priceRange: z.string(),
  image: z.string(),
  affiliateUrl: z.string(),
  description: z.string(),
  distanceToTransit: z.string(),
  amenities: z.array(z.string()),
});

export type Hotel = z.infer<typeof hotelSchema>;

// Questionnaire types
export const budgetOptionsSchema = z.enum(["budget", "moderate", "upscale", "luxury"]);
export type BudgetOption = z.infer<typeof budgetOptionsSchema>;

export const vibeOptionsSchema = z.enum([
  "quiet",
  "artsy",
  "hip",
  "historic",
  "foodie",
  "party",
  "waterfront",
  "family",
]);
export type VibeOption = z.infer<typeof vibeOptionsSchema>;

export const travelStyleOptionsSchema = z.enum(["walk", "transit", "mixed"]);
export type TravelStyleOption = z.infer<typeof travelStyleOptionsSchema>;

export const tripPurposeOptionsSchema = z.enum([
  "solo",
  "couples",
  "remote_work",
  "foodie_trip",
  "family",
  "friends",
]);
export type TripPurposeOption = z.infer<typeof tripPurposeOptionsSchema>;

// Questionnaire input schema
export const questionnaireInputSchema = z.object({
  cityId: z.string(),
  budget: budgetOptionsSchema,
  vibes: z.array(vibeOptionsSchema).min(1).max(3),
  travelStyle: travelStyleOptionsSchema,
  tripPurpose: tripPurposeOptionsSchema,
});

export type QuestionnaireInput = z.infer<typeof questionnaireInputSchema>;

// Recommendation result schema
export const recommendationSchema = z.object({
  neighborhood: neighborhoodSchema,
  matchScore: z.number().min(0).max(100),
  rank: z.number(),
  matchReasons: z.array(z.string()),
});

export type Recommendation = z.infer<typeof recommendationSchema>;

// API response schemas
export const citiesResponseSchema = z.array(citySchema);
export const neighborhoodsResponseSchema = z.array(neighborhoodSchema);
export const hotelsResponseSchema = z.array(hotelSchema);
export const recommendationsResponseSchema = z.array(recommendationSchema);

// Re-export auth models
export * from "./models/auth";
