import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/hero-section";
import { Questionnaire } from "@/components/questionnaire";
import { RecommendationsSection } from "@/components/recommendations-section";
import { FeaturesSection } from "@/components/features-section";
import { PopularCitiesSection } from "@/components/popular-cities-section";
import { EmailCapture } from "@/components/email-capture";
import { FAQSection } from "@/components/faq-section";
import { ResultsMapSection } from "@/components/results-map-section";
import { Link } from "wouter";
import { useRecommendations } from "@/hooks/use-recommendations";
import type { City } from "@shared/schema";

type ViewState = "home" | "questionnaire" | "results";

export default function Home() {
  const [viewState, setViewState] = useState<ViewState>("home");

  const { data: cities = [], isLoading: citiesLoading } = useQuery<City[]>({
    queryKey: ["/api/cities"],
  });

  const { mutate, isPending, recommendations, hotels, explanations, isExplaining, explainLimitReached, reset } = useRecommendations(
    () => setViewState("results")
  );

  const handleStartQuestionnaire = () => setViewState("questionnaire");
  const handleQuestionnaireComplete = mutate;
  const handleQuestionnaireCancel = () => setViewState("home");
  const handleStartOver = () => { reset(); setViewState("questionnaire"); };

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
        <Helmet>
          <title>Your Recommendations - Wanderhood</title>
          <meta name="description" content="Your personalized car-free neighborhood recommendations based on your travel preferences." />
        </Helmet>
        <Header cities={cities} />
        <RecommendationsSection
          recommendations={recommendations}
          hotels={hotels}
          isLoading={isPending}
          onStartOver={handleStartOver}
          explanations={explanations}
          isExplaining={isExplaining}
          explainLimitReached={explainLimitReached}
        />
        {selectedCity && (
          <div className="text-center py-4">
            <Link href={`/city/${selectedCity.slug}`}>
              <a className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">
                Explore the full {selectedCity.name} guide →
              </a>
            </Link>
          </div>
        )}
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
      <Helmet>
        <title>Wanderhood - Find Your Perfect Car-Free Neighborhood</title>
        <meta name="description" content="Discover the best walkable neighborhoods for your next trip. Wanderhood helps travelers find car-free areas with great transit, food, and local vibes." />
        <link rel="canonical" href="https://wanderhood.com/" />
        <meta property="og:title" content="Wanderhood - Car-Free Travel Made Easy" />
        <meta property="og:description" content="Find walkable neighborhoods with great transit, food, and local character." />
        <meta property="og:url" content="https://wanderhood.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1200&q=80" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Wanderhood - Car-Free Travel Made Easy" />
        <meta name="twitter:description" content="Find walkable neighborhoods with great transit, food, and local character." />
        <meta name="twitter:image" content="https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1200&q=80" />
      </Helmet>
      <Header cities={cities} />
      <HeroSection onStartQuestionnaire={handleStartQuestionnaire} />
      <FeaturesSection />
      <PopularCitiesSection cities={cities} isLoading={citiesLoading} />
      <EmailCapture />
      <FAQSection />
      <Footer />
    </div>
  );
}
