import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CityHero } from "@/components/city-hero";
import { Questionnaire } from "@/components/questionnaire";
import { RecommendationsSection } from "@/components/recommendations-section";
import { NeighborhoodComparison } from "@/components/neighborhood-comparison";
import { GoogleMap } from "@/components/google-map";
import { HotelsSection } from "@/components/hotels-section";
import { ExperiencesSection } from "@/components/experiences-section";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ResultsMapSection } from "@/components/results-map-section";
import { FAQSection } from "@/components/faq-section";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import type { City, Neighborhood, QuestionnaireInput, Recommendation, Hotel } from "@shared/schema";

type ViewState = "city" | "questionnaire" | "results";

export default function CityPage() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const [viewState, setViewState] = useState<ViewState>("city");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [hotels, setHotels] = useState<Record<string, Hotel[]>>({});
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | undefined>();

  const { data: mapHotels = [] } = useQuery<Hotel[]>({
    queryKey: ["/api/neighborhoods", selectedNeighborhood, "hotels"],
    queryFn: async () => {
      if (!selectedNeighborhood) return [];
      const res = await fetch(`/api/neighborhoods/${selectedNeighborhood}/hotels`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedNeighborhood,
  });

  const { data: cities = [] } = useQuery<City[]>({
    queryKey: ["/api/cities"],
  });

  const { data: city, isLoading: cityLoading } = useQuery<City>({
    queryKey: ["/api/cities", slug],
    queryFn: async () => {
      const res = await fetch(`/api/cities/${slug}`);
      if (!res.ok) throw new Error("City not found");
      return res.json();
    },
  });

  const { data: neighborhoods = [], isLoading: neighborhoodsLoading } = useQuery<Neighborhood[]>({
    queryKey: ["/api/cities", slug, "neighborhoods"],
    queryFn: async () => {
      const res = await fetch(`/api/cities/${slug}/neighborhoods`);
      if (!res.ok) throw new Error("Failed to fetch neighborhoods");
      return res.json();
    },
    enabled: !!city,
  });

  const recommendationMutation = useMutation({
    mutationFn: async (input: QuestionnaireInput) => {
      const res = await apiRequest("POST", "/api/recommendations", input);
      return res.json() as Promise<Recommendation[]>;
    },
    onSuccess: async (data) => {
      setRecommendations(data);
      setViewState("results");

      const entries = await Promise.all(
        data.map(async (rec) => {
          try {
            const res = await fetch(`/api/neighborhoods/${rec.neighborhood.id}/hotels`);
            if (res.ok) return [rec.neighborhood.id, await res.json()] as const;
          } catch (e) {
            console.error("Failed to fetch hotels", e);
          }
          return null;
        })
      );
      setHotels(Object.fromEntries(entries.filter(Boolean) as [string, Hotel[]][]));
    },
  });

  const handleStartQuestionnaire = () => {
    setViewState("questionnaire");
  };

  const handleQuestionnaireComplete = (data: QuestionnaireInput) => {
    recommendationMutation.mutate(data);
  };

  const handleQuestionnaireCancel = () => {
    setViewState("city");
  };

  const handleStartOver = () => {
    setRecommendations([]);
    setHotels({});
    setViewState("questionnaire");
  };

  if (viewState === "questionnaire") {
    return (
      <Questionnaire
        cities={cities}
        defaultCityId={city?.id}
        onComplete={handleQuestionnaireComplete}
        onCancel={handleQuestionnaireCancel}
      />
    );
  }

  if (viewState === "results") {
    const cityId = recommendations[0]?.neighborhood.cityId;
    const matchedCity = cities.find(c => c.id === cityId) || city;

    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>Your Recommendations in {city?.name || "City"} - Wanderhood</title>
        </Helmet>
        <Header cities={cities} />
        <RecommendationsSection
          recommendations={recommendations}
          hotels={hotels}
          isLoading={recommendationMutation.isPending}
          onStartOver={handleStartOver}
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

  if (cityLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header cities={cities} />
        <div className="min-h-[60vh] flex items-center justify-center">
          <Skeleton className="w-full h-[60vh]" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!city) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>City Not Found - Wanderhood</title>
        </Helmet>
        <Header cities={cities} />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-2">City Not Found</h1>
            <p className="text-muted-foreground">
              We couldn't find the city you're looking for.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleMapViewHotels = (neighborhoodId: string) => {
    setSelectedNeighborhood(neighborhoodId);
    const section = document.getElementById("hotels-section");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  const neighborhoodNames = neighborhoods.slice(0, 3).map(n => n.name).join(", ");

  return (
    <div className="min-h-screen bg-background" data-testid={`page-city-${slug}`}>
      <Helmet>
        <title>{city.name} Car-Free Travel Guide - Wanderhood</title>
        <meta name="description" content={`Explore walkable neighborhoods in ${city.name}, ${city.country}. ${city.description}`} />
        <link rel="canonical" href={`https://wanderhood.com/city/${city.slug}`} />
        <meta property="og:title" content={`${city.name} Car-Free Travel Guide - Wanderhood`} />
        <meta property="og:description" content={`Explore walkable neighborhoods in ${city.name}. ${city.description}`} />
        <meta property="og:url" content={`https://wanderhood.com/city/${city.slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={city.heroImage} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TouristDestination",
            "name": `${city.name} - Car-Free Travel Guide`,
            "description": city.description,
            "url": `https://wanderhood.com/city/${city.slug}`,
            "image": city.heroImage,
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": city.coordinates.lat,
              "longitude": city.coordinates.lng,
            },
            "containedInPlace": {
              "@type": "Country",
              "name": city.country,
            },
            ...(neighborhoodNames ? {
              "containsPlace": neighborhoods.slice(0, 5).map(n => ({
                "@type": "TouristDestination",
                "name": n.name,
                "description": n.description,
              })),
            } : {}),
          })}
        </script>
      </Helmet>
      <Header cities={cities} />
      <CityHero city={city} onStartQuestionnaire={handleStartQuestionnaire} />
      <GoogleMap
        city={city}
        neighborhoods={neighborhoods}
        selectedNeighborhood={selectedNeighborhood}
        onNeighborhoodSelect={setSelectedNeighborhood}
        onViewHotels={handleMapViewHotels}
        hotels={mapHotels}
      />
      <section id="hotels-section">
        <div className="max-w-6xl mx-auto px-6 pt-8">
          <Tabs defaultValue="hotels">
            <TabsList>
              <TabsTrigger value="hotels">🏨 Hotels</TabsTrigger>
              <TabsTrigger value="experiences">🎟️ Experiences</TabsTrigger>
            </TabsList>
            <TabsContent value="hotels">
              <HotelsSection
                cityId={city.id}
                neighborhoods={neighborhoods}
                selectedNeighborhood={selectedNeighborhood}
                onNeighborhoodChange={setSelectedNeighborhood}
              />
            </TabsContent>
            <TabsContent value="experiences">
              <ExperiencesSection
                citySlug={city.slug}
                neighborhoods={neighborhoods}
                selectedNeighborhood={selectedNeighborhood}
                onNeighborhoodChange={setSelectedNeighborhood}
              />
            </TabsContent>
          </Tabs>
        </div>
      </section>
      <NeighborhoodComparison neighborhoods={neighborhoods} />
      <FAQSection />
      <Footer />
    </div>
  );
}
