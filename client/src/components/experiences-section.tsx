import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Star, Clock, Compass } from "lucide-react";
import type { Neighborhood, Experience } from "@shared/schema";

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  tour:       { label: "Tour",       emoji: "🗺️" },
  food:       { label: "Food & Drink", emoji: "🍴" },
  adventure:  { label: "Adventure",  emoji: "🧗" },
  culture:    { label: "Culture",    emoji: "🏛️" },
  wellness:   { label: "Wellness",   emoji: "🧘" },
  nightlife:  { label: "Nightlife",  emoji: "🌙" },
  day_trip:   { label: "Day Trip",   emoji: "🚌" },
};

interface ExperiencesSectionProps {
  citySlug: string;
  neighborhoods: Neighborhood[];
  selectedNeighborhood?: string;
  onNeighborhoodChange?: (id: string) => void;
}

export function ExperiencesSection({
  citySlug,
  neighborhoods,
  selectedNeighborhood,
  onNeighborhoodChange,
}: ExperiencesSectionProps) {
  const [activeId, setActiveId] = useState<string | undefined>(
    selectedNeighborhood ?? neighborhoods[0]?.id
  );

  useEffect(() => {
    if (selectedNeighborhood) setActiveId(selectedNeighborhood);
  }, [selectedNeighborhood]);

  useEffect(() => {
    if (!activeId && neighborhoods.length > 0) setActiveId(neighborhoods[0].id);
  }, [neighborhoods]);

  const { data: allExperiences = [], isLoading } = useQuery<Experience[]>({
    queryKey: ["/api/cities", citySlug, "experiences"],
    queryFn: async () => {
      const res = await fetch(`/api/cities/${citySlug}/experiences`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!citySlug,
  });

  // Show experiences that either match this neighborhood or are city-wide (no neighborhoodId)
  const experiences = allExperiences.filter(
    (e) => !e.neighborhoodId || e.neighborhoodId === activeId
  );

  return (
    <section className="py-6" data-testid="experiences-section">
      <div className="max-w-6xl mx-auto px-6">
        {/* Neighborhood pill selector */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-8 scrollbar-hide">
          {neighborhoods.map((n) => (
            <button
              key={n.id}
              onClick={() => { setActiveId(n.id); onNeighborhoodChange?.(n.id); }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                n.id === activeId
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground"
              }`}
            >
              {n.name}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-80 rounded-md" />)}
          </div>
        ) : experiences.length === 0 ? (
          <Card className="p-12 text-center">
            <Compass className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Experiences Yet</h3>
            <p className="text-muted-foreground">
              We're adding experiences for more cities and neighborhoods soon.
            </p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experiences.map((exp) => {
              const cat = CATEGORY_LABELS[exp.category];
              return (
                <Card
                  key={exp.id}
                  className="overflow-hidden hover-elevate"
                  data-testid={`card-experience-${exp.id}`}
                >
                  <div
                    className="h-48 bg-cover bg-center"
                    style={{ backgroundImage: `url(${exp.image})` }}
                  >
                    <div className="h-full w-full bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                      <Badge variant="secondary" className="bg-background/90">
                        {cat?.emoji} {cat?.label ?? exp.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-lg line-clamp-2 mb-2">{exp.name}</h3>

                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{exp.rating.toFixed(1)}</span>
                        <span className="text-xs">({exp.reviewCount.toLocaleString()})</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {exp.duration}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {exp.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">From ${exp.priceFrom}</span>
                      <Button
                        size="sm"
                        onClick={() => window.open(exp.affiliateUrl, "_blank")}
                        data-testid={`button-book-experience-${exp.id}`}
                      >
                        Book on Viator
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center mt-8">
          We may earn a commission when you book through our links. This helps keep Wanderhood free.
        </p>
      </div>
    </section>
  );
}
