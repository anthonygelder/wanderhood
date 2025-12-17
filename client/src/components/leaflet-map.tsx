import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/score-bar";
import { X, MapPin, Train, Footprints, Utensils, ExternalLink, Bus, Layers } from "lucide-react";
import type { Neighborhood, City } from "@shared/schema";

interface LeafletMapProps {
  city: City;
  neighborhoods: Neighborhood[];
  selectedNeighborhood?: string;
  onNeighborhoodSelect: (id: string | undefined) => void;
  onViewHotels: (id: string) => void;
}

export function LeafletMap({
  city,
  neighborhoods,
  selectedNeighborhood,
  onNeighborhoodSelect,
  onViewHotels,
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [showTransit, setShowTransit] = useState(true);
  
  const selected = neighborhoods.find((n) => n.id === selectedNeighborhood);

  const getScoreColor = (score: number): string => {
    if (score >= 85) return "#22c55e";
    if (score >= 70) return "#3b82f6";
    if (score >= 55) return "#f59e0b";
    return "#ef4444";
  };

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        center: [city.coordinates.lat, city.coordinates.lng],
        zoom: 12,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    mapInstanceRef.current.setView([city.coordinates.lat, city.coordinates.lng], 12);
  }, [city.coordinates.lat, city.coordinates.lng]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    neighborhoods.forEach((neighborhood) => {
      const avgScore = Math.round(
        (neighborhood.scores.walkability + neighborhood.scores.transitConnectivity) / 2
      );
      const color = getScoreColor(avgScore);
      const isSelected = selectedNeighborhood === neighborhood.id;

      const icon = L.divIcon({
        className: "custom-marker",
        html: `
          <div style="
            width: ${isSelected ? "56px" : "48px"};
            height: ${isSelected ? "56px" : "48px"};
            background: ${color};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: all 0.2s;
            ${isSelected ? "transform: scale(1.1); box-shadow: 0 0 0 4px hsl(var(--primary)), 0 4px 12px rgba(0,0,0,0.3);" : ""}
          ">
            <span style="
              color: white;
              font-weight: bold;
              font-size: ${isSelected ? "16px" : "14px"};
              text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            ">${avgScore}</span>
          </div>
        `,
        iconSize: [isSelected ? 56 : 48, isSelected ? 56 : 48],
        iconAnchor: [isSelected ? 28 : 24, isSelected ? 28 : 24],
      });

      const marker = L.marker([neighborhood.coordinates.lat, neighborhood.coordinates.lng], { icon })
        .addTo(mapInstanceRef.current!)
        .on("click", () => {
          onNeighborhoodSelect(selectedNeighborhood === neighborhood.id ? undefined : neighborhood.id);
        });

      marker.bindTooltip(neighborhood.name, {
        permanent: false,
        direction: "top",
        offset: [0, -24],
        className: "leaflet-tooltip-custom",
      });

      markersRef.current.push(marker);
    });
  }, [neighborhoods, selectedNeighborhood, onNeighborhoodSelect]);

  useEffect(() => {
    if (selectedNeighborhood && mapInstanceRef.current) {
      const neighborhood = neighborhoods.find((n) => n.id === selectedNeighborhood);
      if (neighborhood) {
        mapInstanceRef.current.flyTo(
          [neighborhood.coordinates.lat, neighborhood.coordinates.lng],
          14,
          { duration: 0.5 }
        );
      }
    }
  }, [selectedNeighborhood, neighborhoods]);

  return (
    <section 
      className="relative min-h-[70vh] bg-muted/30" 
      id="map-section"
      data-testid="interactive-map"
    >
      <style>{`
        .leaflet-tooltip-custom {
          background: hsl(var(--background)) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: 6px !important;
          padding: 4px 8px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
        }
        .leaflet-tooltip-custom::before {
          border-top-color: hsl(var(--background)) !important;
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-semibold">
            Explore {city.name} Neighborhoods
          </h2>
          <p className="text-muted-foreground mt-2">
            Click on a neighborhood to see walkability and transit scores
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 relative">
            <div 
              ref={mapRef}
              className="w-full h-[500px] rounded-md overflow-hidden shadow-lg"
              data-testid="map-container"
            />
            
            <div className="absolute bottom-4 left-4 z-[1000] bg-background/95 backdrop-blur-sm rounded-md p-3 text-xs space-y-1">
              <p className="font-semibold mb-2 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Score Legend
              </p>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ background: "#22c55e" }} />
                <span>85+ Excellent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ background: "#3b82f6" }} />
                <span>70-84 Good</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ background: "#f59e0b" }} />
                <span>55-69 Moderate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ background: "#ef4444" }} />
                <span>&lt;55 Limited</span>
              </div>
            </div>

            <div className="absolute top-4 right-4 z-[1000]">
              <Button 
                variant={showTransit ? "default" : "outline"}
                size="sm"
                onClick={() => setShowTransit(!showTransit)}
                className="shadow-lg"
                data-testid="button-toggle-transit"
              >
                <Bus className="w-4 h-4 mr-2" />
                Transit Lines
              </Button>
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

                <div className="space-y-2 mb-4">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Train className="w-3 h-3" />
                    Transit Hubs:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selected.transitHubs.map((hub) => (
                      <Badge key={hub} variant="outline" size="sm">
                        {hub}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button 
                  className="w-full"
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
