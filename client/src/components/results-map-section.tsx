import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/score-bar";
import { HotelCard } from "@/components/hotel-card";
import { MapPin, Train, Footprints, Utensils, ChevronDown, ChevronUp } from "lucide-react";
import type { Recommendation, Hotel, City } from "@shared/schema";

interface ResultsMapSectionProps {
  city: City;
  recommendations: Recommendation[];
  hotels: Record<string, Hotel[]>;
}

export function ResultsMapSection({ city, recommendations, hotels }: ResultsMapSectionProps) {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | undefined>(
    recommendations[0]?.neighborhood.id
  );
  const [showHotels, setShowHotels] = useState<string | undefined>();

  const selected = recommendations.find((r) => r.neighborhood.id === selectedNeighborhood);

  const getColorForScore = (score: number) => {
    if (score >= 85) return "bg-chart-3";
    if (score >= 70) return "bg-chart-1";
    if (score >= 55) return "bg-chart-2";
    return "bg-chart-5";
  };

  return (
    <section 
      className="py-16 md:py-24 bg-muted/30" 
      id="map-section"
      data-testid="results-map-section"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold">
            Your Recommended Neighborhoods in {city.name}
          </h2>
          <p className="text-muted-foreground mt-2">
            Explore your matches and find hotels
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div 
              className="relative aspect-[16/10] rounded-md overflow-hidden"
              style={{ backgroundColor: "hsl(var(--muted))" }}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-30"
                style={{
                  backgroundImage: `url(${city.heroImage})`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/40" />
              
              <div className="absolute inset-0 p-6">
                <div className="relative w-full h-full flex flex-wrap items-center justify-center gap-4">
                  {recommendations.map((rec, index) => {
                    const avgScore = Math.round(
                      (rec.neighborhood.scores.walkability + rec.neighborhood.scores.transitConnectivity) / 2
                    );
                    const isSelected = selectedNeighborhood === rec.neighborhood.id;
                    
                    return (
                      <button
                        key={rec.neighborhood.id}
                        onClick={() => setSelectedNeighborhood(rec.neighborhood.id)}
                        className={`transition-all duration-200 ${
                          isSelected ? "scale-110 z-20" : "hover:scale-105 z-10"
                        }`}
                        data-testid={`map-pin-${rec.neighborhood.slug}`}
                      >
                        <div
                          className={`w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 border-white shadow-lg ${getColorForScore(avgScore)} ${
                            isSelected ? "ring-4 ring-primary ring-offset-2" : ""
                          }`}
                        >
                          <span className="text-white font-bold text-2xl drop-shadow-md">
                            #{rec.rank}
                          </span>
                          <span className="text-white/90 text-xs font-medium drop-shadow-md">
                            {rec.matchScore}% match
                          </span>
                        </div>
                        <div className="mt-2 text-center">
                          <span className="text-sm font-semibold bg-background/90 px-3 py-1 rounded shadow-sm">
                            {rec.neighborhood.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-md p-3 text-xs space-y-1">
                <p className="font-semibold mb-2">Average Score</p>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-chart-3" />
                  <span>85+ Excellent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-chart-1" />
                  <span>70-84 Good</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-chart-2" />
                  <span>55-69 Moderate</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-[400px]">
            {selected ? (
              <Card className="p-6" data-testid="results-info-panel">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={
                      selected.rank === 1 ? "bg-chart-5 text-black" :
                      selected.rank === 2 ? "bg-muted text-foreground" :
                      "bg-chart-2 text-white"
                    }>
                      #{selected.rank} Match
                    </Badge>
                    <span className="text-primary font-bold">{selected.matchScore}%</span>
                  </div>
                  <h3 className="text-2xl font-serif font-semibold">{selected.neighborhood.name}</h3>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                    <MapPin className="w-3 h-3" />
                    <span>{selected.neighborhood.highlights[0]}</span>
                  </div>
                </div>

                <div 
                  className="aspect-video rounded-md bg-cover bg-center mb-4"
                  style={{ backgroundImage: `url(${selected.neighborhood.heroImage})` }}
                />

                <div className="flex flex-wrap gap-2 mb-4">
                  {selected.neighborhood.vibe.map((v) => (
                    <Badge key={v} variant="secondary" size="sm">
                      {v}
                    </Badge>
                  ))}
                </div>

                <div className="space-y-3 mb-4">
                  <ScoreBar 
                    label="Walkability" 
                    score={selected.neighborhood.scores.walkability} 
                    icon={<Footprints className="w-4 h-4" />}
                    size="sm"
                  />
                  <ScoreBar 
                    label="Transit" 
                    score={selected.neighborhood.scores.transitConnectivity} 
                    icon={<Train className="w-4 h-4" />}
                    size="sm"
                  />
                  <ScoreBar 
                    label="Food & Coffee" 
                    score={selected.neighborhood.scores.foodCoffeeDensity} 
                    icon={<Utensils className="w-4 h-4" />}
                    size="sm"
                  />
                </div>

                {selected.neighborhood.aiDescription && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {selected.neighborhood.aiDescription}
                  </p>
                )}

                <Button 
                  className="w-full"
                  onClick={() => setShowHotels(
                    showHotels === selected.neighborhood.id ? undefined : selected.neighborhood.id
                  )}
                  data-testid="button-toggle-hotels"
                >
                  {showHotels === selected.neighborhood.id ? "Hide Hotels" : "View Hotels"}
                  {showHotels === selected.neighborhood.id ? (
                    <ChevronUp className="w-4 h-4 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-2" />
                  )}
                </Button>
              </Card>
            ) : (
              <Card className="p-6 flex flex-col items-center justify-center min-h-[400px] text-center">
                <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Neighborhood</h3>
                <p className="text-sm text-muted-foreground">
                  Click on any neighborhood above to see details and hotels.
                </p>
              </Card>
            )}
          </div>
        </div>

        {showHotels && hotels[showHotels] && hotels[showHotels].length > 0 && (
          <div className="mt-8" id="hotels-section" data-testid="hotels-section">
            <h3 className="text-2xl font-semibold mb-6">
              Hotels in {recommendations.find(r => r.neighborhood.id === showHotels)?.neighborhood.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotels[showHotels].map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          </div>
        )}

        {showHotels && (!hotels[showHotels] || hotels[showHotels].length === 0) && (
          <div className="mt-8 text-center py-12" id="hotels-section">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Hotels Available</h3>
            <p className="text-sm text-muted-foreground">
              We're still adding hotels for this neighborhood. Check back soon!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
