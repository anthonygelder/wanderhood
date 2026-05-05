import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { RecommendationsSection } from "@/components/recommendations-section";
import { ResultsMapSection } from "@/components/results-map-section";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRecommendations } from "@/hooks/use-recommendations";
import { useToast } from "@/hooks/use-toast";
import type { City } from "@shared/schema";
import {
  budgetOptionsSchema,
  vibeOptionsSchema,
  travelStyleOptionsSchema,
  tripPurposeOptionsSchema,
} from "@shared/schema";

function parseShareParams(search: string) {
  const params = new URLSearchParams(search);
  const citySlug = params.get("city");
  const budget = params.get("budget");
  const vibesRaw = params.get("vibes");
  const style = params.get("style");
  const purpose = params.get("purpose");

  if (!citySlug || !budget || !vibesRaw || !style || !purpose) return null;

  const budgetParsed = budgetOptionsSchema.safeParse(budget);
  const styleParsed = travelStyleOptionsSchema.safeParse(style);
  const purposeParsed = tripPurposeOptionsSchema.safeParse(purpose);
  const vibesParsed = vibesRaw
    .split(",")
    .map((v) => vibeOptionsSchema.safeParse(v))
    .filter((r) => r.success)
    .map((r) => (r as { success: true; data: string }).data);

  if (!budgetParsed.success || !styleParsed.success || !purposeParsed.success || vibesParsed.length === 0) return null;

  return {
    citySlug,
    budget: budgetParsed.data,
    vibes: vibesParsed as any,
    travelStyle: styleParsed.data,
    tripPurpose: purposeParsed.data,
  };
}

export default function SharedResultsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const hasFired = useRef(false);

  const search = typeof window !== "undefined" ? window.location.search : "";
  const parsed = parseShareParams(search);

  const { data: cities = [] } = useQuery<City[]>({
    queryKey: ["/api/cities"],
  });

  const { mutate, isPending, recommendations, hotels, lastInput, explanations, isExplaining, explainLimitReached } = useRecommendations();

  useEffect(() => {
    if (hasFired.current || !parsed || cities.length === 0) return;

    const city = cities.find((c) => c.slug === parsed.citySlug);
    if (!city) {
      toast({ title: "City not found", description: "This shared link may be outdated.", variant: "destructive" });
      navigate("/");
      return;
    }

    hasFired.current = true;
    mutate({
      cityId: city.id,
      budget: parsed.budget,
      vibes: parsed.vibes,
      travelStyle: parsed.travelStyle,
      tripPurpose: parsed.tripPurpose,
    });
  }, [parsed?.citySlug, cities.length]);

  if (!parsed) {
    return (
      <div className="min-h-screen bg-background">
        <Header cities={cities} />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-2">Invalid link</h1>
            <p className="text-muted-foreground mb-6">This shared link is missing required parameters.</p>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const cityObj = cities.find((c) => c.slug === parsed.citySlug);
  const cityId = recommendations[0]?.neighborhood.cityId;
  const matchedCity = cities.find((c) => c.id === cityId) || cityObj;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Shared Neighborhood Recommendations - Wanderhood</title>
        <meta name="description" content="Someone shared their Wanderhood neighborhood recommendations with you." />
        <meta name="robots" content="noindex" />
      </Helmet>
      <Header cities={cities} />
      <div className="max-w-6xl mx-auto px-6 pt-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(cityObj ? `/city/${cityObj.slug}` : "/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {cityObj ? `Back to ${cityObj.name}` : "Go Home"}
        </Button>
      </div>
      <RecommendationsSection
        recommendations={recommendations}
        hotels={hotels}
        isLoading={isPending}
        onStartOver={() => navigate(cityObj ? `/city/${cityObj.slug}` : "/")}
        shareInput={lastInput}
        cities={cities}
        explanations={explanations}
        isExplaining={isExplaining}
        explainLimitReached={explainLimitReached}
      />
      {recommendations.length > 0 && matchedCity && (
        <ResultsMapSection
          city={matchedCity}
          recommendations={recommendations}
          hotels={hotels}
        />
      )}
      <Footer />
    </div>
  );
}
