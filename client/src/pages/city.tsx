import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CityHero } from "@/components/city-hero";
import { Questionnaire } from "@/components/questionnaire";
import { RecommendationsSection } from "@/components/recommendations-section";
import { NeighborhoodComparison } from "@/components/neighborhood-comparison";
import { InteractiveMap } from "@/components/interactive-map";
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
      
      const hotelData: Record<string, Hotel[]> = {};
      for (const rec of data) {
        try {
          const res = await fetch(`/api/neighborhoods/${rec.neighborhood.id}/hotels`);
          if (res.ok) {
            hotelData[rec.neighborhood.id] = await res.json();
          }
        } catch (e) {
          console.error("Failed to fetch hotels", e);
        }
      }
      setHotels(hotelData);
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

  return (
    <div className="min-h-screen bg-background" data-testid={`page-city-${slug}`}>
      <Header cities={cities} />
      <CityHero city={city} onStartQuestionnaire={handleStartQuestionnaire} />
      <InteractiveMap
        city={city}
        neighborhoods={neighborhoods}
        selectedNeighborhood={selectedNeighborhood}
        onNeighborhoodSelect={setSelectedNeighborhood}
        onViewHotels={handleMapViewHotels}
      />
      <NeighborhoodComparison neighborhoods={neighborhoods} />
      <FAQSection />
      <Footer />
    </div>
  );
}
