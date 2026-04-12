import { z } from "zod";
import { pgTable, serial, text, timestamp, varchar, integer, numeric, jsonb } from "drizzle-orm/pg-core";
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

// Hotels table — mirrors in-memory hotel data, kept in sync by scripts/seed.ts
export const hotelsTable = pgTable("hotels_data", {
  id: varchar("id", { length: 255 }).primaryKey(),
  neighborhoodId: varchar("neighborhood_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 500 }).notNull(),
  starRating: integer("star_rating").notNull(),
  rating: numeric("rating", { precision: 3, scale: 1 }).notNull(),
  priceRange: varchar("price_range", { length: 100 }).notNull(),
  image: text("image").notNull(),
  affiliateUrl: text("affiliate_url"),
  description: text("description").notNull(),
  distanceToTransit: varchar("distance_to_transit", { length: 100 }).notNull(),
  amenities: jsonb("amenities").notNull().$type<string[]>(),
  coordinates: jsonb("coordinates").$type<{ lat: number; lng: number }>(),
});

// Experiences table — mirrors in-memory experience data, kept in sync by scripts/seed.ts
export const experiencesTable = pgTable("experiences_data", {
  id: varchar("id", { length: 255 }).primaryKey(),
  cityId: varchar("city_id", { length: 255 }).notNull(),
  neighborhoodId: varchar("neighborhood_id", { length: 255 }),
  name: varchar("name", { length: 500 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  duration: varchar("duration", { length: 100 }).notNull(),
  rating: numeric("rating", { precision: 3, scale: 1 }).notNull(),
  reviewCount: integer("review_count").notNull(),
  priceFrom: numeric("price_from", { precision: 10, scale: 2 }).notNull(),
  image: text("image").notNull(),
  description: text("description").notNull(),
  affiliateUrl: text("affiliate_url").notNull(),
});

// AI descriptions table — persists OpenAI-generated neighborhood descriptions
export const neighborhoodDescriptions = pgTable("neighborhood_descriptions", {
  neighborhoodId: varchar("neighborhood_id", { length: 255 }).primaryKey(),
  aiDescription: text("ai_description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User reviews — star rating + optional one-line tip per neighborhood
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  neighborhoodId: varchar("neighborhood_id", { length: 255 }).notNull(),
  cityId: varchar("city_id", { length: 255 }).notNull(),
  rating: integer("rating").notNull(), // 1–5
  tip: varchar("tip", { length: 280 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

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
  photos: z.array(z.string()).optional(),
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
  affiliateUrl: z.string().optional(),
  description: z.string(),
  distanceToTransit: z.string(),
  amenities: z.array(z.string()),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
});

export type Hotel = z.infer<typeof hotelSchema>;

// Viator affiliate partner ID — swap when approved
export const VIATOR_PID = "P00293051";

// Experience schema
export const experienceCategorySchema = z.enum([
  "tour",
  "food",
  "adventure",
  "culture",
  "wellness",
  "nightlife",
  "day_trip",
]);
export type ExperienceCategory = z.infer<typeof experienceCategorySchema>;

export const experienceSchema = z.object({
  id: z.string(),
  cityId: z.string(),
  neighborhoodId: z.string().optional(),
  name: z.string(),
  category: experienceCategorySchema,
  duration: z.string(),
  rating: z.number().min(0).max(5),
  reviewCount: z.number(),
  priceFrom: z.number(),
  image: z.string(),
  description: z.string(),
  affiliateUrl: z.string(),
});
export type Experience = z.infer<typeof experienceSchema>;

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
