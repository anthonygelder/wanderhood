import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Star, Utensils } from "lucide-react";
import { trackClick } from "@/lib/tracking";
import type { Neighborhood, Restaurant } from "@shared/schema";

const CUISINE_LABELS: Record<string, { label: string; emoji: string }> = {
  local:         { label: "Local",         emoji: "🏠" },
  cafe:          { label: "Café & Brunch", emoji: "☕" },
  italian:       { label: "Italian",       emoji: "🍝" },
  french:        { label: "French",        emoji: "🥐" },
  japanese:      { label: "Japanese",      emoji: "🍱" },
  seafood:       { label: "Seafood",       emoji: "🦞" },
  vegetarian:    { label: "Vegetarian",    emoji: "🌿" },
  international: { label: "International", emoji: "🌍" },
  spanish:       { label: "Spanish",       emoji: "🥘" },
  american:      { label: "American",      emoji: "🍔" },
};

const PRICE_SYMBOLS = ["", "$", "$$", "$$$", "$$$$"];

const CUISINE_FILTERS = [
  { value: "all",           label: "All" },
  { value: "local",         label: "🏠 Local" },
  { value: "cafe",          label: "☕ Café" },
  { value: "italian",       label: "🍝 Italian" },
  { value: "french",        label: "🥐 French" },
  { value: "japanese",      label: "🍱 Japanese" },
  { value: "seafood",       label: "🦞 Seafood" },
  { value: "vegetarian",    label: "🌿 Vegetarian" },
  { value: "international", label: "🌍 International" },
  { value: "spanish",       label: "🥘 Spanish" },
  { value: "american",      label: "🍔 American" },
];

interface RestaurantsSectionProps {
  citySlug: string;
  neighborhoods: Neighborhood[];
  selectedNeighborhood?: string;
  onNeighborhoodChange?: (id: string) => void;
}

export function RestaurantsSection({
  citySlug,
  neighborhoods,
  selectedNeighborhood,
  onNeighborhoodChange,
}: RestaurantsSectionProps) {
  const [activeId, setActiveId] = useState<string | undefined>(
    selectedNeighborhood ?? neighborhoods[0]?.id
  );
  const [activeCuisine, setActiveCuisine] = useState("all");

  useEffect(() => {
    if (selectedNeighborhood) setActiveId(selectedNeighborhood);
  }, [selectedNeighborhood]);

  useEffect(() => {
    if (!activeId && neighborhoods.length > 0) setActiveId(neighborhoods[0].id);
  }, [neighborhoods]);

  const { data: allRestaurants = [], isLoading } = useQuery<Restaurant[]>({
    queryKey: ["/api/cities", citySlug, "restaurants"],
    queryFn: async () => {
      const res = await fetch(`/api/cities/${citySlug}/restaurants`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!citySlug,
  });

  const restaurants = allRestaurants.filter(
    (r) =>
      (!r.neighborhoodId || r.neighborhoodId === activeId) &&
      (activeCuisine === "all" || r.cuisine === activeCuisine)
  );

  const platformLabel = (platform: Restaurant["platform"]) =>
    platform === "thefork" ? "TheFork" : "OpenTable";

  return (
    <section className="py-6" data-testid="restaurants-section">
      <div className="max-w-6xl mx-auto px-6">
        {/* Cuisine filter */}
        <div className="relative mb-4">
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            {CUISINE_FILTERS.map((c) => (
              <button
                key={c.value}
                onClick={() => setActiveCuisine(c.value)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  c.value === activeCuisine
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" />
        </div>

        {/* Neighborhood pill selector */}
        <div className="relative mb-8">
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
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
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" />
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-80 rounded-md" />)}
          </div>
        ) : restaurants.length === 0 ? (
          <Card className="p-12 text-center">
            <Utensils className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Restaurants Yet</h3>
            <p className="text-muted-foreground">
              We're adding restaurant listings for more cities and neighborhoods soon.
            </p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((r) => {
              const cuisine = CUISINE_LABELS[r.cuisine];
              return (
                <Card
                  key={r.id}
                  className="overflow-hidden hover-elevate"
                  data-testid={`card-restaurant-${r.id}`}
                >
                  <div
                    className="h-48 bg-cover bg-center"
                    style={{ backgroundImage: `url(${r.image})` }}
                  >
                    <div className="h-full w-full bg-gradient-to-t from-black/60 to-transparent flex items-end justify-between p-4">
                      <Badge variant="secondary" className="bg-background/90">
                        {cuisine?.emoji} {cuisine?.label ?? r.cuisine}
                      </Badge>
                      <Badge variant="secondary" className="bg-background/90 font-mono">
                        {PRICE_SYMBOLS[r.priceLevel]}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-lg line-clamp-1 mb-2">{r.name}</h3>

                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{r.rating.toFixed(1)}</span>
                      <span className="text-xs">({r.reviewCount.toLocaleString()} reviews)</span>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {r.description}
                    </p>

                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        trackClick({ type: "restaurant", url: r.affiliateUrl, neighborhoodId: r.neighborhoodId, cityId: citySlug });
                        window.open(r.affiliateUrl, "_blank");
                      }}
                      data-testid={`button-reserve-restaurant-${r.id}`}
                    >
                      Reserve on {platformLabel(r.platform)}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
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
