import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/score-bar";
import { X, MapPin, Train, Footprints, Utensils, ExternalLink } from "lucide-react";
import type { Neighborhood, City } from "@shared/schema";

interface InteractiveMapProps {
  city: City;
  neighborhoods: Neighborhood[];
  selectedNeighborhood?: string;
  onNeighborhoodSelect: (id: string | undefined) => void;
  onViewHotels: (id: string) => void;
}

export function InteractiveMap({
  city,
  neighborhoods,
  selectedNeighborhood,
  onNeighborhoodSelect,
  onViewHotels,
}: InteractiveMapProps) {
  const selected = neighborhoods.find((n) => n.id === selectedNeighborhood);

  const getColorForScore = (score: number) => {
    if (score >= 85) return "bg-chart-3/70";
    if (score >= 70) return "bg-chart-1/70";
    if (score >= 55) return "bg-chart-2/70";
    return "bg-chart-5/70";
  };

  return (
    <section 
      className="relative min-h-[60vh] bg-muted/30" 
      id="map-section"
      data-testid="interactive-map"
    >
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-semibold">
            Explore {city.name} Neighborhoods
          </h2>
          <p className="text-muted-foreground mt-2">
            Click on a neighborhood to see details and scores
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div 
              className="relative aspect-[16/10] rounded-md overflow-hidden bg-cover bg-center"
              style={{
                backgroundImage: `url(https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${city.coordinates.lng},${city.coordinates.lat},11,0/800x500?access_token=pk.placeholder)`,
                backgroundColor: "hsl(var(--muted))",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
              
              <div className="absolute inset-0 p-4">
                <div className="relative w-full h-full">
                  {neighborhoods.map((neighborhood, index) => {
                    const positions = [
                      { top: "15%", left: "25%" },
                      { top: "35%", left: "55%" },
                      { top: "55%", left: "30%" },
                      { top: "25%", left: "70%" },
                      { top: "65%", left: "60%" },
                      { top: "45%", left: "15%" },
                    ];
                    const pos = positions[index % positions.length];
                    const avgScore = Math.round(
                      (neighborhood.scores.walkability + neighborhood.scores.transitConnectivity) / 2
                    );
                    
                    return (
                      <button
                        key={neighborhood.id}
                        onClick={() => onNeighborhoodSelect(
                          selectedNeighborhood === neighborhood.id ? undefined : neighborhood.id
                        )}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${
                          selectedNeighborhood === neighborhood.id
                            ? "scale-110 z-20"
                            : "hover:scale-105 z-10"
                        }`}
                        style={{ top: pos.top, left: pos.left }}
                        data-testid={`map-pin-${neighborhood.slug}`}
                      >
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center border-3 border-white shadow-lg ${getColorForScore(avgScore)} ${
                            selectedNeighborhood === neighborhood.id
                              ? "ring-4 ring-primary ring-offset-2"
                              : ""
                          }`}
                        >
                          <div className="text-center">
                            <span className="text-white font-bold text-lg drop-shadow-md">
                              {avgScore}
                            </span>
                          </div>
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 whitespace-nowrap">
                          <span className="text-xs font-semibold bg-background/90 px-2 py-1 rounded shadow-sm">
                            {neighborhood.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-md p-3 text-xs space-y-1">
                <p className="font-semibold mb-2">Walkability + Transit Score</p>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-chart-3/70" />
                  <span>85+ Excellent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-chart-1/70" />
                  <span>70-84 Good</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-chart-2/70" />
                  <span>55-69 Moderate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-chart-5/70" />
                  <span>&lt;55 Limited</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-[400px]">
            {selected ? (
              <Card className="p-6 animate-in slide-in-from-right-4 duration-300" data-testid="map-info-panel">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-serif font-semibold">{selected.name}</h3>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                      <MapPin className="w-3 h-3" />
                      <span>{selected.highlights[0]}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onNeighborhoodSelect(undefined)}
                    data-testid="button-close-info-panel"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div 
                  className="aspect-video rounded-md bg-cover bg-center mb-4"
                  style={{ backgroundImage: `url(${selected.heroImage})` }}
                />

                <div className="flex flex-wrap gap-2 mb-4">
                  {selected.vibe.map((v) => (
                    <Badge key={v} variant="secondary" size="sm">
                      {v}
                    </Badge>
                  ))}
                </div>

                <div className="space-y-3 mb-4">
                  <ScoreBar 
                    label="Walkability" 
                    score={selected.scores.walkability} 
                    icon={<Footprints className="w-4 h-4" />}
                    size="sm"
                  />
                  <ScoreBar 
                    label="Transit" 
                    score={selected.scores.transitConnectivity} 
                    icon={<Train className="w-4 h-4" />}
                    size="sm"
                  />
                  <ScoreBar 
                    label="Food & Coffee" 
                    score={selected.scores.foodCoffeeDensity} 
                    icon={<Utensils className="w-4 h-4" />}
                    size="sm"
                  />
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {selected.description}
                </p>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Transit Hubs:</p>
                  <div className="flex flex-wrap gap-1">
                    {selected.transitHubs.map((hub) => (
                      <Badge key={hub} variant="outline" size="sm">
                        {hub}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button 
                  className="w-full mt-4"
                  onClick={() => onViewHotels(selected.id)}
                  data-testid="button-map-view-hotels"
                >
                  View Hotels
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </Card>
            ) : (
              <Card className="p-6 flex flex-col items-center justify-center min-h-[400px] text-center">
                <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Neighborhood</h3>
                <p className="text-sm text-muted-foreground">
                  Click on any neighborhood marker on the map to see detailed scores, 
                  transit information, and available hotels.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
