import { NeighborhoodCard } from "@/components/neighborhood-card";
import { HotelCard } from "@/components/hotel-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, RefreshCw } from "lucide-react";
import type { Recommendation, Hotel } from "@shared/schema";
import { useState } from "react";

interface RecommendationsSectionProps {
  recommendations: Recommendation[];
  hotels: Record<string, Hotel[]>;
  isLoading?: boolean;
  onStartOver: () => void;
}

export function RecommendationsSection({ 
  recommendations, 
  hotels,
  isLoading,
  onStartOver 
}: RecommendationsSectionProps) {
  const [expandedHotels, setExpandedHotels] = useState<string | null>(null);

  const handleViewHotels = (neighborhoodId: string) => {
    setExpandedHotels(expandedHotels === neighborhoodId ? null : neighborhoodId);
  };

  const handleExploreMap = (neighborhoodId: string) => {
    const section = document.getElementById("map-section");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (isLoading) {
    return (
      <section className="py-16 md:py-24 bg-background" data-testid="recommendations-loading">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-video rounded-md" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) {
    return (
      <section className="py-16 md:py-24 bg-background" data-testid="recommendations-empty">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-semibold mb-4">No matches found</h2>
          <p className="text-muted-foreground mb-8">
            We couldn't find neighborhoods matching your criteria. Try adjusting your preferences.
          </p>
          <Button onClick={onStartOver} data-testid="button-start-over-empty">
            <RefreshCw className="w-4 h-4 mr-2" />
            Start Over
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 bg-background" data-testid="recommendations-section">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold">Your Top Matches</h2>
            <p className="text-muted-foreground mt-2">
              Based on your preferences, here are the best neighborhoods for you
            </p>
          </div>
          <Button variant="outline" onClick={onStartOver} data-testid="button-start-over">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Start Over
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recommendations.map((rec) => (
            <div key={rec.neighborhood.id} className="space-y-4">
              <NeighborhoodCard
                recommendation={rec}
                onViewHotels={handleViewHotels}
                onExploreMap={handleExploreMap}
              />
              
              {expandedHotels === rec.neighborhood.id && hotels[rec.neighborhood.id] && (
                <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Hotels in {rec.neighborhood.name}
                  </h4>
                  {hotels[rec.neighborhood.id].map((hotel) => (
                    <HotelCard key={hotel.id} hotel={hotel} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
