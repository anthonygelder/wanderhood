import type { Express } from "express";
import { createServer, type Server } from "http";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { storage } from "./storage";
import { questionnaireInputSchema } from "@shared/schema";
import Anthropic from "@anthropic-ai/sdk";

import { setupAuth, isAuthenticated, registerAuthRoutes } from "./auth";
import type { User, TripPurposeOption } from "@shared/schema";
import { affiliateClicks, newsletterSubscribers } from "@shared/schema";
import { sendWelcomeEmail } from "./email";

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const BASE_URL = process.env.BASE_URL || "https://wanderhood.app";


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

  // Stats — city/neighborhood/hotel counts for hero section
  app.get("/api/stats", async (_req, res) => {
    try {
      const stats = await storage.getStats();
      res.set("Cache-Control", "public, max-age=86400");
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Newsletter subscribe
  app.post("/api/subscribe", async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "Valid email required" });
    }
    const normalised = email.toLowerCase().trim();
    try {
      const { db } = await import("./db");
      if (db) {
        const result = await db
          .insert(newsletterSubscribers)
          .values({ email: normalised })
          .onConflictDoNothing()
          .returning({ id: newsletterSubscribers.id });
        if (result.length > 0) {
          sendWelcomeEmail(normalised).catch((e) =>
            console.error("[email] welcome failed:", e)
          );
        }
      }
      console.log(`[subscribe] ${normalised}`);
      res.json({ message: "Subscribed successfully" });
    } catch (error) {
      console.error("Error saving subscriber:", error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
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
      return req.user?.id || ipKeyGenerator(req) || "unknown";
    },
  });

  // Anonymous users: 1 AI explain per day (IP-keyed)
  const aiExplainLimiterAnon = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    limit: 1,
    message: { error: "Free AI limit reached. Sign in to continue.", code: "AI_LIMIT_REACHED" },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => ipKeyGenerator(req) || "unknown",
    skip: (req: any) => !!req.user,
  });

  // Authenticated users: 20 AI explains per day (user-keyed)
  const aiExplainLimiterAuth = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    limit: 20,
    message: { error: "Daily AI limit reached.", code: "AI_LIMIT_REACHED" },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => req.user?.id || "unknown",
    skip: (req: any) => !req.user,
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
  // Get restaurants for a city
  app.get("/api/cities/:slug/restaurants", async (req, res) => {
    try {
      const city = await storage.getCityBySlug(req.params.slug);
      if (!city) return res.status(404).json({ error: "City not found" });
      const restaurants = await storage.getRestaurantsByCityId(city.id);
      res.json(restaurants);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      res.status(500).json({ error: "Failed to fetch restaurants" });
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

      // Generate AI descriptions in parallel for all neighborhoods missing one
      await Promise.all(
        recommendations
          .filter((rec) => !rec.neighborhood.aiDescription)
          .map(async (rec) => {
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
          })
      );

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


  // Trip endpoints (protected)
  app.get("/api/trips", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const userTrips = await storage.getTripsByUserId(userId);
      res.json(userTrips);
    } catch (error) {
      console.error("Error fetching trips:", error);
      res.status(500).json({ error: "Failed to fetch trips" });
    }
  });

  app.post("/api/trips", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { name } = req.body;
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ error: "Trip name required" });
      }
      const trip = await storage.createTrip({ userId, name: name.trim() });
      res.status(201).json(trip);
    } catch (error) {
      console.error("Error creating trip:", error);
      res.status(500).json({ error: "Failed to create trip" });
    }
  });

  app.get("/api/trips/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const tripId = parseInt(req.params.id, 10);
      if (isNaN(tripId)) return res.status(400).json({ error: "Invalid trip ID" });
      const trip = await storage.getTripById(tripId, userId);
      if (!trip) return res.status(404).json({ error: "Trip not found" });
      res.json(trip);
    } catch (error) {
      console.error("Error fetching trip:", error);
      res.status(500).json({ error: "Failed to fetch trip" });
    }
  });

  app.delete("/api/trips/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const tripId = parseInt(req.params.id, 10);
      if (isNaN(tripId)) return res.status(400).json({ error: "Invalid trip ID" });
      await storage.deleteTrip(tripId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting trip:", error);
      res.status(500).json({ error: "Failed to delete trip" });
    }
  });

  app.post("/api/trips/:id/neighborhoods", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const tripId = parseInt(req.params.id, 10);
      if (isNaN(tripId)) return res.status(400).json({ error: "Invalid trip ID" });
      const trip = await storage.getTripById(tripId, userId);
      if (!trip) return res.status(404).json({ error: "Trip not found" });
      const { neighborhoodId, cityId, notes } = req.body;
      if (!neighborhoodId || !cityId) return res.status(400).json({ error: "neighborhoodId and cityId required" });
      const already = await storage.isNeighborhoodInTrip(tripId, neighborhoodId);
      if (already) return res.status(400).json({ error: "Already in trip" });
      const entry = await storage.addNeighborhoodToTrip({ tripId, neighborhoodId, cityId, notes: notes || null, sortOrder: 0 });
      res.status(201).json(entry);
    } catch (error) {
      console.error("Error adding neighborhood to trip:", error);
      res.status(500).json({ error: "Failed to add neighborhood" });
    }
  });

  app.delete("/api/trips/:id/neighborhoods/:neighborhoodId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const tripId = parseInt(req.params.id, 10);
      if (isNaN(tripId)) return res.status(400).json({ error: "Invalid trip ID" });
      const trip = await storage.getTripById(tripId, userId);
      if (!trip) return res.status(404).json({ error: "Trip not found" });
      await storage.removeNeighborhoodFromTrip(tripId, req.params.neighborhoodId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing neighborhood from trip:", error);
      res.status(500).json({ error: "Failed to remove neighborhood" });
    }
  });

  // AI: generate trip narrative
  app.post("/api/trips/:id/ai/narrative", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const tripId = parseInt(req.params.id, 10);
      if (isNaN(tripId)) return res.status(400).json({ error: "Invalid trip ID" });
      const trip = await storage.getTripById(tripId, userId);
      if (!trip) return res.status(404).json({ error: "Trip not found" });
      if (trip.neighborhoods.length === 0) return res.status(400).json({ error: "Trip has no neighborhoods" });
      if (!anthropic) return res.status(503).json({ error: "AI service not configured" });

      // Enrich with neighborhood data
      const enriched = await Promise.all(
        trip.neighborhoods.map(async (tn) => {
          const n = await storage.getNeighborhoodById(tn.neighborhoodId);
          const city = await storage.getCityById(tn.cityId);
          return n && city ? { neighborhood: n, city } : null;
        })
      );
      const valid = enriched.filter(Boolean) as { neighborhood: any; city: any }[];

      const neighborhoodList = valid
        .map((v) => `- ${v.neighborhood.name}, ${v.city.name} (${v.neighborhood.vibe?.join(", ")})`)
        .join("\n");

      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: [
          {
            type: "text",
            text: "You write vivid, practical trip narratives for car-free travelers. 3-4 sentences. Describe the trip as a flowing journey — reference specific neighborhoods, their vibes, and how they connect. Be concrete and inspiring, not generic.",
            cache_control: { type: "ephemeral" },
          },
        ] as any,
        messages: [{
          role: "user",
          content: `Write a trip narrative for a trip called "${trip.name}" with these neighborhoods in order:\n${neighborhoodList}\n\nDescribe the arc of the journey — what makes this sequence of places compelling for a car-free traveler.`,
        }],
      });

      const block = response.content[0];
      const narrative = block.type === "text" ? block.text : "";
      res.json({ narrative });
    } catch (error) {
      console.error("Error generating trip narrative:", error);
      res.status(500).json({ error: "Failed to generate narrative" });
    }
  });

  // AI: suggest 3 trip names
  app.post("/api/ai/trips/suggest-name", isAuthenticated, async (req, res) => {
    try {
      const { neighborhoods } = req.body;
      if (!neighborhoods?.length) return res.status(400).json({ error: "neighborhoods required" });
      if (!anthropic) return res.status(503).json({ error: "AI service not configured" });

      const list = neighborhoods
        .map((n: any) => `${n.neighborhoodName}, ${n.cityName} (${(n.vibes || []).join(", ")})`)
        .join("\n");

      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 100,
        system: [
          {
            type: "text",
            text: "You suggest short, evocative trip names (3-5 words each). Names should capture the mood or theme of the places. Respond with JSON only: {\"names\": [\"Name 1\", \"Name 2\", \"Name 3\"]}",
            cache_control: { type: "ephemeral" },
          },
        ] as any,
        messages: [{
          role: "user",
          content: `Suggest 3 trip names for an itinerary with these neighborhoods:\n${list}`,
        }],
      });

      const block = response.content[0];
      const raw = block.type === "text" ? block.text : '{"names":[]}';
      const { names } = JSON.parse(raw);
      res.json({ names });
    } catch (error) {
      console.error("Error suggesting trip names:", error);
      res.status(500).json({ error: "Failed to suggest names" });
    }
  });

  // AI: suggest missing neighborhood types (gap analysis)
  app.post("/api/trips/:id/ai/suggest-neighborhoods", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const tripId = parseInt(req.params.id, 10);
      if (isNaN(tripId)) return res.status(400).json({ error: "Invalid trip ID" });
      const trip = await storage.getTripById(tripId, userId);
      if (!trip) return res.status(404).json({ error: "Trip not found" });
      if (trip.neighborhoods.length === 0) return res.status(400).json({ error: "Trip has no neighborhoods" });
      if (!anthropic) return res.status(503).json({ error: "AI service not configured" });

      const enriched = await Promise.all(
        trip.neighborhoods.map(async (tn) => {
          const n = await storage.getNeighborhoodById(tn.neighborhoodId);
          const city = await storage.getCityById(tn.cityId);
          return n && city ? { neighborhood: n, city } : null;
        })
      );
      const valid = enriched.filter(Boolean) as { neighborhood: any; city: any }[];

      const neighborhoodList = valid
        .map((v) => `- ${v.neighborhood.name}, ${v.city.name}: vibes=${v.neighborhood.vibe?.join(", ")}, food=${v.neighborhood.scores?.foodCoffeeDensity}, nightlife=${v.neighborhood.scores?.nightlife}, safety=${v.neighborhood.scores?.safety}, localVibes=${v.neighborhood.scores?.localVibes}`)
        .join("\n");

      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        system: [
          {
            type: "text",
            text: "You are a travel advisor who identifies what's missing from a trip itinerary. Analyze the vibes and scores of current neighborhoods and identify 1-2 gaps. Respond with JSON only: {\"suggestions\": [{\"gap\": \"short description of what\'s missing\", \"suggestion\": \"specific neighborhood type or city to add\"}]}",
            cache_control: { type: "ephemeral" },
          },
        ] as any,
        messages: [{
          role: "user",
          content: `Analyze this trip itinerary and identify what experiences are missing:\n${neighborhoodList}\n\nWhat 1-2 neighborhood types or vibes would round out this trip?`,
        }],
      });

      const block = response.content[0];
      const raw = block.type === "text" ? block.text : '{"suggestions":[]}';
      const { suggestions } = JSON.parse(raw);
      res.json({ suggestions });
    } catch (error) {
      console.error("Error generating neighborhood suggestions:", error);
      res.status(500).json({ error: "Failed to generate suggestions" });
    }
  });


  // Similar neighborhoods — cross-city suggestions based on vibe + score similarity
  app.get("/api/neighborhoods/:id/similar", async (req, res) => {
    try {
      const similar = await storage.getSimilarNeighborhoods(req.params.id);
      res.json(similar);
    } catch (error) {
      console.error("Error fetching similar neighborhoods:", error);
      res.status(500).json({ error: "Failed to fetch similar neighborhoods" });
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

  // AI personalized match explanations
  app.post("/api/ai/explain", aiExplainLimiterAnon, aiExplainLimiterAuth, async (req, res) => {
    try {
      const { recommendations, input } = req.body;
      if (!recommendations?.length || !input) {
        return res.status(400).json({ error: "Missing recommendations or input" });
      }

      if (!anthropic) {
        return res.status(503).json({ error: "AI service not configured" });
      }

      const neighborhoodList = recommendations
        .map((rec: any) =>
          `- id: ${rec.neighborhood.id}, name: ${rec.neighborhood.name}, vibes: ${rec.neighborhood.vibe?.join(", ")}, walkability: ${rec.neighborhood.scores?.walkability}, safety: ${rec.neighborhood.scores?.safety}, food: ${rec.neighborhood.scores?.foodCoffeeDensity}, local feel: ${rec.neighborhood.scores?.localVibes}`
        )
        .join("\n");

      const prompt = `A traveler is looking for neighborhoods with these preferences:
- Budget: ${input.budget}
- Vibes wanted: ${input.vibes?.join(", ")}
- Travel style: ${input.travelStyle}
- Trip type: ${input.tripPurpose}

For each neighborhood below, write exactly ONE sentence (max 25 words) explaining why it matches this specific traveler. Be personal and direct — reference their actual preferences, not generic descriptions.

Neighborhoods:
${neighborhoodList}

Respond with JSON only, using neighborhood IDs as keys: {"<id>": "<one sentence>", ...}`;

      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: [
          {
            type: "text",
            text: `You write personalized neighborhood match explanations. For each neighborhood, write exactly ONE sentence (max 25 words) explaining why it matches the traveler's specific preferences. Be personal and direct — reference their actual preferences. Respond with JSON only: {"<id>": "<one sentence>", ...}`,
            cache_control: { type: "ephemeral" },
          },
        ] as any,
        messages: [{ role: "user", content: prompt }],
      });

      const block = response.content[0];
      const raw = block.type === "text" ? block.text : "{}";
      const explanations = JSON.parse(raw);
      res.json({ explanations });
    } catch (error) {
      console.error("Error generating AI explanations:", error);
      res.status(500).json({ error: "Failed to generate explanations" });
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

  if (!anthropic) {
    return `${neighborhoodName} is a vibrant neighborhood in ${cityName} known for its ${vibes.join(", ")} vibes.`;
  }

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    system: [
      {
        type: "text",
        text: "You write brief, engaging neighborhood descriptions for car-free travelers. Focus on walking/transit options and local character. Keep it 2-3 sentences, conversational and specific.",
        cache_control: { type: "ephemeral" },
      },
    ] as any,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content[0];
  return block.type === "text" ? block.text : "";
}
