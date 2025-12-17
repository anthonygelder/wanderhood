import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { questionnaireInputSchema } from "@shared/schema";
import OpenAI from "openai";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Set up auth first (before other routes)
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // Get all cities
  app.get("/api/cities", async (req, res) => {
    try {
      const cities = await storage.getCities();
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
      res.json(neighborhoods);
    } catch (error) {
      console.error("Error fetching neighborhoods:", error);
      res.status(500).json({ error: "Failed to fetch neighborhoods" });
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

  // Get recommendations based on questionnaire
  app.post("/api/recommendations", async (req, res) => {
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

  // Favorites endpoints (protected)
  app.get("/api/favorites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userFavorites = await storage.getFavoritesByUserId(userId);
      res.json(userFavorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ error: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.delete("/api/favorites/:neighborhoodId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { neighborhoodId } = req.params;
      
      await storage.removeFavorite(userId, neighborhoodId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ error: "Failed to remove favorite" });
    }
  });

  app.get("/api/favorites/:neighborhoodId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [{ role: "user", content: prompt }],
    max_completion_tokens: 200,
  });

  return response.choices[0].message.content || "";
}
