import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/hero-section";
import { Questionnaire } from "@/components/questionnaire";
import { RecommendationsSection } from "@/components/recommendations-section";
import { FeaturesSection } from "@/components/features-section";
import { PopularCitiesSection } from "@/components/popular-cities-section";
import { FAQSection } from "@/components/faq-section";
import { ResultsMapSection } from "@/components/results-map-section";
import { apiRequest } from "@/lib/queryClient";
import type { City, QuestionnaireInput, Recommendation, Hotel } from "@shared/schema";

type ViewState = "home" | "questionnaire" | "results";

export default function Home() {
  const [viewState, setViewState] = useState<ViewState>("home");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [hotels, setHotels] = useState<Record<string, Hotel[]>>({});

  const { data: cities = [], isLoading: citiesLoading } = useQuery<City[]>({
    queryKey: ["/api/cities"],
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
    setViewState("home");
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
        onComplete={handleQuestionnaireComplete}
        onCancel={handleQuestionnaireCancel}
      />
    );
  }

  if (viewState === "results") {
    const cityId = recommendations[0]?.neighborhood.cityId;
    const selectedCity = cities.find(c => c.id === cityId);
    
    return (
      <div className="min-h-screen bg-background">
        <Header cities={cities} />
        <RecommendationsSection
          recommendations={recommendations}
          hotels={hotels}
          isLoading={recommendationMutation.isPending}
          onStartOver={handleStartOver}
        />
        {recommendations.length > 0 && (
          <ResultsMapSection
            city={selectedCity || {
              id: cityId || "unknown",
              name: "Your City",
              country: "",
              slug: "",
              description: "",
              heroImage: "",
              coordinates: { lat: 0, lng: 0 },
              timezone: "",
            }}
            recommendations={recommendations}
            hotels={hotels}
          />
        )}
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="page-home">
      <Header cities={cities} />
      <HeroSection onStartQuestionnaire={handleStartQuestionnaire} />
      <FeaturesSection />
      <PopularCitiesSection cities={cities} isLoading={citiesLoading} />
      <FAQSection />
      <Footer />
    </div>
  );
}
