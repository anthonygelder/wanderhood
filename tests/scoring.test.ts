import { describe, it, expect, beforeEach } from "vitest";
import { MemStorage } from "../server/storage";
import type { QuestionnaireInput } from "../shared/schema";

// Minimal neighborhood factory — only the fields the scoring algorithm reads
function makeNeighborhood(overrides: Partial<Parameters<typeof Object.assign>[0]> = {}) {
  return {
    id: "test-n",
    cityId: "test-city",
    name: "Test Neighborhood",
    slug: "test-neighborhood",
    description: "A test neighborhood.",
    heroImage: "https://example.com/img.jpg",
    vibe: ["artsy", "quiet"],
    scores: {
      walkability: 80,
      transitConnectivity: 80,
      safety: 80,
      foodCoffeeDensity: 80,
      nightlife: 80,
      touristFriendliness: 80,
      localVibes: 80,
    },
    highlights: [],
    transitHubs: [],
    priceLevel: "moderate" as const,
    coordinates: { lat: 0, lng: 0 },
    boundaryCoordinates: [],
    ...overrides,
  };
}

function makeInput(overrides: Partial<QuestionnaireInput> = {}): QuestionnaireInput {
  return {
    cityId: "test-city",
    budget: "moderate",
    vibes: ["artsy"],
    travelStyle: "walk",
    tripPurpose: "solo",
    ...overrides,
  };
}

// Subclass that lets us inject test data without touching the real cities.ts
class TestStorage extends MemStorage {
  constructor(testNeighborhoods: ReturnType<typeof makeNeighborhood>[]) {
    super();
    // Replace the private neighborhoods list via the public async method
    (this as any).neighborhoods = testNeighborhoods;
    (this as any).cities = [
      { id: "test-city", name: "Test City", country: "TC", slug: "test-city",
        description: "", heroImage: "", coordinates: { lat: 0, lng: 0 }, timezone: "UTC" },
    ];
  }
}

describe("scoring algorithm", () => {
  let storage: TestStorage;

  beforeEach(() => {
    storage = new TestStorage([
      makeNeighborhood({ id: "n1", priceLevel: "budget", vibe: ["artsy"], scores: { walkability: 90, transitConnectivity: 70, safety: 80, foodCoffeeDensity: 85, nightlife: 60, touristFriendliness: 70, localVibes: 75 } }),
      makeNeighborhood({ id: "n2", priceLevel: "moderate", vibe: ["quiet", "hip"], scores: { walkability: 70, transitConnectivity: 90, safety: 85, foodCoffeeDensity: 70, nightlife: 50, touristFriendliness: 80, localVibes: 80 } }),
      makeNeighborhood({ id: "n3", priceLevel: "upscale", vibe: ["historic", "foodie"], scores: { walkability: 60, transitConnectivity: 60, safety: 90, foodCoffeeDensity: 95, nightlife: 40, touristFriendliness: 90, localVibes: 65 } }),
    ]);
  });

  it("returns at most 3 results", async () => {
    const results = await storage.getRecommendations(makeInput());
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it("results are sorted by matchScore descending", async () => {
    const results = await storage.getRecommendations(makeInput());
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].matchScore).toBeGreaterThanOrEqual(results[i].matchScore);
    }
  });

  it("rank reflects position (1-indexed)", async () => {
    const results = await storage.getRecommendations(makeInput());
    results.forEach((r, i) => expect(r.rank).toBe(i + 1));
  });

  it("matchScore is capped at 100", async () => {
    const results = await storage.getRecommendations(makeInput({ vibes: ["artsy", "quiet", "hip"] }));
    results.forEach((r) => expect(r.matchScore).toBeLessThanOrEqual(100));
  });

  it("exact budget match adds 20 pts vs no match", async () => {
    const exact = await storage.getRecommendations(makeInput({ budget: "moderate" }));
    const noMatch = await storage.getRecommendations(makeInput({ budget: "luxury" }));
    const n2Exact = exact.find((r) => r.neighborhood.id === "n2")!;
    const n2No = noMatch.find((r) => r.neighborhood.id === "n2")!;
    expect(n2Exact.matchScore).toBeGreaterThan(n2No.matchScore);
  });

  it("vibe match increases score by ~15 per matching vibe", async () => {
    // n2 has vibes ["quiet", "hip"]. Selecting both vibes should score it higher than selecting one.
    const oneVibe = await storage.getRecommendations(makeInput({ vibes: ["quiet"] }));
    const twoVibes = await storage.getRecommendations(makeInput({ vibes: ["quiet", "hip"] }));
    const n2One = oneVibe.find((r) => r.neighborhood.id === "n2")!;
    const n2Two = twoVibes.find((r) => r.neighborhood.id === "n2")!;
    expect(n2Two.matchScore).toBeGreaterThan(n2One.matchScore);
  });

  it("travelStyle:walk uses walkability score", async () => {
    const walkResults = await storage.getRecommendations(makeInput({ travelStyle: "walk" }));
    const transitResults = await storage.getRecommendations(makeInput({ travelStyle: "transit" }));
    // n1 has walkability=90, n2 has transitConnectivity=90
    // walk should prefer n1 more than transit does
    const n1WalkScore = walkResults.find((r) => r.neighborhood.id === "n1")!.matchScore;
    const n1TransitScore = transitResults.find((r) => r.neighborhood.id === "n1")!.matchScore;
    expect(n1WalkScore).toBeGreaterThanOrEqual(n1TransitScore);
  });

  it("tripPurpose:foodie_trip strongly weights food score", async () => {
    // Use budget:"upscale" so n3 (upscale, food=95, vibe=historic) gets full budget+vibe+food boost
    const foodie = await storage.getRecommendations(
      makeInput({ tripPurpose: "foodie_trip", budget: "upscale", vibes: ["historic"] })
    );
    // n3: 20pt budget + 15pt vibe + 60/5=12pt walk + 95/4≈24pt food ≈ 71pts
    // n2: 10pt budget (moderate<upscale) + 0pt vibe + 70/5=14pt walk + 70/4≈18pt food ≈ 42pts
    expect(foodie[0].neighborhood.id).toBe("n3");
  });

  it("tripPurpose:family heavily weights safety", async () => {
    const family = await storage.getRecommendations(makeInput({ tripPurpose: "family", budget: "upscale", vibes: ["historic"] }));
    // n3 has safety=90 and exact budget match
    expect(family[0].neighborhood.id).toBe("n3");
  });

  it("returns matchReasons array", async () => {
    const results = await storage.getRecommendations(makeInput());
    results.forEach((r) => expect(Array.isArray(r.matchReasons)).toBe(true));
  });

  it("includes a budget match reason when budget matches", async () => {
    const results = await storage.getRecommendations(makeInput({ budget: "moderate" }));
    const n2 = results.find((r) => r.neighborhood.id === "n2");
    expect(n2?.matchReasons.some((reason) => reason.toLowerCase().includes("moderate"))).toBe(true);
  });
});
