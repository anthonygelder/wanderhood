import type { Express } from "express";
import { createServer, type Server } from "http";
import { rateLimit } from "express-rate-limit";
import { storage } from "./storage";
import { questionnaireInputSchema } from "@shared/schema";
import OpenAI from "openai";

import { setupAuth, isAuthenticated, registerAuthRoutes } from "./auth";
import type { User, TripPurposeOption } from "@shared/schema";
import { affiliateClicks } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const BASE_URL = process.env.BASE_URL || "https://wanderhood.com";

// In-memory email list (replace with a real DB or email service later)
const subscribedEmails: { email: string; createdAt: string }[] = [];

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Set up auth first (before other routes)
  await setupAuth(app);
  registerAuthRoutes(app);

  // Preload persisted AI descriptions into memory
  await storage.init();

  // robots.txt
  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send(
      `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${BASE_URL}/sitemap.xml`
    );
  });

  // sitemap.xml — all city and neighborhood pages
  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const cities = await storage.getCities();
      const now = new Date().toISOString().split("T")[0];

      const TRIP_PURPOSES = ["remote-work", "couples", "families", "solo", "foodie", "friends"];
      const staticUrls = [
        { loc: `${BASE_URL}/`, priority: "1.0", changefreq: "weekly" },
        { loc: `${BASE_URL}/cities`, priority: "0.9", changefreq: "weekly" },
        ...TRIP_PURPOSES.map((p) => ({ loc: `${BASE_URL}/neighborhoods/${p}`, priority: "0.8", changefreq: "weekly" })),
      ];

      const cityUrls = cities.map((c) => ({
        loc: `${BASE_URL}/city/${c.slug}`,
        priority: "0.8",
        changefreq: "weekly",
      }));

      const neighborhoodUrls: { loc: string; priority: string; changefreq: string }[] = [];
      for (const city of cities) {
        const neighborhoods = await storage.getNeighborhoodsByCitySlug(city.slug);
        for (const n of neighborhoods) {
          neighborhoodUrls.push({
            loc: `${BASE_URL}/city/${city.slug}/${n.slug}`,
            priority: "0.7",
            changefreq: "monthly",
          });
        }
      }

      const allUrls = [...staticUrls, ...cityUrls, ...neighborhoodUrls];
      const urlEntries = allUrls
        .map(
          (u) =>
            `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
        )
        .join("\n");

      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>`;
      res.type("application/xml").send(xml);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  // Newsletter subscribe
  app.post("/api/subscribe", async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "Valid email required" });
    }
    const normalised = email.toLowerCase().trim();
    if (subscribedEmails.some((s) => s.email === normalised)) {
      return res.json({ message: "Already subscribed" });
    }
    subscribedEmails.push({ email: normalised, createdAt: new Date().toISOString() });
    console.log(`[subscribe] New subscriber: ${normalised} (total: ${subscribedEmails.length})`);
    res.json({ message: "Subscribed successfully" });
  });
  
  // Get all cities
  app.get("/api/cities", async (req, res) => {
    try {
      const cities = await storage.getCities();
      res.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
      res.json(cities);
    } catch (error) {
      console.error("Error fetching cities:", error);
      res.status(500).json({ error: "Failed to fetch cities" });
    }
  });

  // Get city by slug
  app.get("/api/cities/:slug", async (req, res) => {
    try {
      const city = await storage.getCityBySlug(req.params.slug);
      if (!city) {
        return res.status(404).json({ error: "City not found" });
      }
      res.json(city);
    } catch (error) {
      console.error("Error fetching city:", error);
      res.status(500).json({ error: "Failed to fetch city" });
    }
  });

  // Get neighborhoods for a city
  app.get("/api/cities/:slug/neighborhoods", async (req, res) => {
    try {
      const neighborhoods = await storage.getNeighborhoodsByCitySlug(req.params.slug);
      res.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
      res.json(neighborhoods);
    } catch (error) {
      console.error("Error fetching neighborhoods:", error);
      res.status(500).json({ error: "Failed to fetch neighborhoods" });
    }
  });

  // Get a single neighborhood by city slug + neighborhood slug
  app.get("/api/cities/:citySlug/neighborhoods/:neighborhoodSlug", async (req, res) => {
    try {
      const neighborhood = await storage.getNeighborhoodBySlug(
        req.params.citySlug,
        req.params.neighborhoodSlug
      );
      if (!neighborhood) return res.status(404).json({ error: "Neighborhood not found" });
      res.json(neighborhood);
    } catch (error) {
      console.error("Error fetching neighborhood:", error);
      res.status(500).json({ error: "Failed to fetch neighborhood" });
    }
  });

  // Get hotels for a neighborhood
  app.get("/api/neighborhoods/:id/hotels", async (req, res) => {
    try {
      const hotels = await storage.getHotelsByNeighborhoodId(req.params.id);
      res.json(hotels);
    } catch (error) {
      console.error("Error fetching hotels:", error);
      res.status(500).json({ error: "Failed to fetch hotels" });
    }
  });

  const recommendationsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 20,
    message: { error: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => {
      // Use authenticated user ID when available so logged-in users aren't penalised on shared IPs
      return req.user?.id || req.ip || "unknown";
    },
  });

  // Get experiences for a city
  app.get("/api/cities/:slug/experiences", async (req, res) => {
    try {
      const city = await storage.getCityBySlug(req.params.slug);
      if (!city) return res.status(404).json({ error: "City not found" });
      const exps = await storage.getExperiencesByCityId(city.id);
      res.json(exps);
    } catch (error) {
      console.error("Error fetching experiences:", error);
      res.status(500).json({ error: "Failed to fetch experiences" });
    }
  });

  // Get recommendations based on questionnaire
  app.post("/api/recommendations", recommendationsLimiter, async (req, res) => {
    try {
      const parseResult = questionnaireInputSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid input", 
          details: parseResult.error.errors 
        });
      }

      const input = parseResult.data;
      const recommendations = await storage.getRecommendations(input);

      // Generate AI descriptions for recommendations
      for (const rec of recommendations) {
        if (!rec.neighborhood.aiDescription) {
          try {
            const city = await storage.getCityById(rec.neighborhood.cityId);
            const aiDescription = await generateNeighborhoodDescription(
              rec.neighborhood.name,
              city?.name || "",
              rec.neighborhood.vibe,
              rec.neighborhood.scores,
              input
            );
            rec.neighborhood.aiDescription = aiDescription;
            await storage.updateNeighborhoodDescription(rec.neighborhood.id, aiDescription);
          } catch (aiError) {
            console.error("Error generating AI description:", aiError);
            rec.neighborhood.aiDescription = rec.neighborhood.description;
          }
        }
      }

      res.json(recommendations);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });

  // Affiliate click tracking — fire-and-forget, always returns 200
  app.post("/api/track/click", async (req: any, res) => {
    res.json({ ok: true }); // respond immediately, don't block the user
    const { type, url, neighborhoodId, cityId } = req.body;
    if (!type || !url) return;
    try {
      const { db } = await import("./db");
      if (db) {
        await db.insert(affiliateClicks).values({
          type: String(type).slice(0, 50),
          url: String(url).slice(0, 2048),
          neighborhoodId: neighborhoodId ? String(neighborhoodId) : null,
          cityId: cityId ? String(cityId) : null,
          userId: req.user ? (req.user as User).id : null,
        });
      }
    } catch {
      // silent — tracking should never break the user experience
    }
  });

  // Neighborhood comparison
  app.get("/api/compare/:citySlug/:n1Slug/:n2Slug", async (req, res) => {
    try {
      const { citySlug, n1Slug, n2Slug } = req.params;
      const [city, n1, n2] = await Promise.all([
        storage.getCityBySlug(citySlug),
        storage.getNeighborhoodBySlug(citySlug, n1Slug),
        storage.getNeighborhoodBySlug(citySlug, n2Slug),
      ]);
      if (!city || !n1 || !n2) return res.status(404).json({ error: "Not found" });
      res.set("Cache-Control", "public, max-age=3600");
      res.json({ city, n1, n2 });
    } catch (error) {
      console.error("Error fetching comparison:", error);
      res.status(500).json({ error: "Failed to fetch comparison" });
    }
  });

  // Top neighborhoods globally by trip purpose
  const VALID_PURPOSES = new Set(["solo", "couples", "remote_work", "foodie_trip", "family", "friends"]);
  app.get("/api/top/:purpose", async (req, res) => {
    try {
      const purpose = req.params.purpose as TripPurposeOption;
      if (!VALID_PURPOSES.has(purpose)) return res.status(400).json({ error: "Invalid purpose" });
      const results = await storage.getTopNeighborhoodsByPurpose(purpose);
      res.set("Cache-Control", "public, max-age=3600");
      res.json(results);
    } catch (error) {
      console.error("Error fetching top neighborhoods:", error);
      res.status(500).json({ error: "Failed to fetch top neighborhoods" });
    }
  });

  // Reviews (public read, auth write)
  app.get("/api/neighborhoods/:id/reviews", async (req, res) => {
    try {
      const reviewList = await storage.getReviewsByNeighborhoodId(req.params.id);
      res.json(reviewList);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.post("/api/neighborhoods/:id/reviews", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as User).id;
      const neighborhoodId = req.params.id;
      const { cityId, rating, tip } = req.body;
      if (!cityId || typeof rating !== "number" || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "cityId and rating (1-5) are required" });
      }
      const existing = await storage.getUserReview(userId, neighborhoodId);
      if (existing) return res.status(409).json({ error: "You have already reviewed this neighborhood" });
      const review = await storage.addReview({ userId, neighborhoodId, cityId, rating, tip: tip || null });
      res.status(201).json(review);
    } catch (error) {
      console.error("Error adding review:", error);
      res.status(500).json({ error: "Failed to add review" });
    }
  });

  app.delete("/api/reviews/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as User).id;
      await storage.deleteReview(Number(req.params.id), userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ error: "Failed to delete review" });
    }
  });

  // Favorites endpoints (protected)
  app.get("/api/favorites", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as User).id;
      const userFavorites = await storage.getFavoritesByUserId(userId);
      res.json(userFavorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ error: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as User).id;
      const { neighborhoodId, cityId } = req.body;
      
      if (!neighborhoodId || !cityId) {
        return res.status(400).json({ error: "neighborhoodId and cityId are required" });
      }

      const exists = await storage.isFavorite(userId, neighborhoodId);
      if (exists) {
        return res.status(400).json({ error: "Already in favorites" });
      }

      const favorite = await storage.addFavorite({
        userId,
        neighborhoodId,
        cityId,
      });
      res.status(201).json(favorite);
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ error: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites/:neighborhoodId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as User).id;
      const { neighborhoodId } = req.params;
      
      await storage.removeFavorite(userId, neighborhoodId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ error: "Failed to remove favorite" });
    }
  });

  app.get("/api/favorites/:neighborhoodId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as User).id;
      const { neighborhoodId } = req.params;
      
      const isFav = await storage.isFavorite(userId, neighborhoodId);
      res.json({ isFavorite: isFav });
    } catch (error) {
      console.error("Error checking favorite:", error);
      res.status(500).json({ error: "Failed to check favorite" });
    }
  });

  return httpServer;
}

async function generateNeighborhoodDescription(
  neighborhoodName: string,
  cityName: string,
  vibes: string[],
  scores: {
    walkability: number;
    transitConnectivity: number;
    safety: number;
    foodCoffeeDensity: number;
    nightlife: number;
    touristFriendliness: number;
    localVibes: number;
  },
  userPreferences: {
    budget: string;
    vibes: string[];
    travelStyle: string;
    tripPurpose: string;
  }
): Promise<string> {
  const prompt = `Write a brief, engaging 2-3 sentence description of ${neighborhoodName} in ${cityName} for a car-free traveler. 

The neighborhood has these characteristics:
- Vibes: ${vibes.join(", ")}
- Walkability: ${scores.walkability}/100
- Transit: ${scores.transitConnectivity}/100
- Food/Coffee density: ${scores.foodCoffeeDensity}/100
- Nightlife: ${scores.nightlife}/100
- Local feel: ${scores.localVibes}/100

The traveler's preferences:
- Budget: ${userPreferences.budget}
- Looking for: ${userPreferences.vibes.join(", ")}
- Travel style: ${userPreferences.travelStyle}
- Trip type: ${userPreferences.tripPurpose}

Focus on what makes this neighborhood great for car-free exploration. Be specific about walking/transit options and local character. Keep it conversational and helpful.`;

  if (!openai) {
    return `${neighborhoodName} is a vibrant neighborhood in ${cityName} known for its ${vibes.join(", ")} vibes.`;
  }

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [{ role: "user", content: prompt }],
    max_completion_tokens: 200,
  });

  return response.choices[0].message.content || "";
}
