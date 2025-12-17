import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/score-bar";
import { X, MapPin, Train, Footprints, Utensils, ExternalLink, Bus, Ship, Layers, ChevronDown, Bike } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import type { Neighborhood, City } from "@shared/schema";

interface TransitFilters {
  publicTransport: boolean;
  cycling: boolean;
}

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
  const labelsRef = useRef<L.Marker[]>([]);
  const transitLayerRef = useRef<L.TileLayer | null>(null);
  const cyclingLayerRef = useRef<L.TileLayer | null>(null);
  
  const [transitFilters, setTransitFilters] = useState<TransitFilters>({
    publicTransport: true,
    cycling: false,
  });
  
  const selected = neighborhoods.find((n) => n.id === selectedNeighborhood);

  const getScoreColor = (score: number): string => {
    if (score >= 85) return "#22c55e";
    if (score >= 70) return "#3b82f6";
    if (score >= 55) return "#f59e0b";
    return "#ef4444";
  };

  const toggleFilter = (filter: keyof TransitFilters) => {
    setTransitFilters(prev => ({
      ...prev,
      [filter]: !prev[filter],
    }));
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

    if (transitLayerRef.current) {
      mapInstanceRef.current.removeLayer(transitLayerRef.current);
      transitLayerRef.current = null;
    }

    if (transitFilters.publicTransport) {
      transitLayerRef.current = L.tileLayer(
        "https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=6170aad10dfd42a38d4d8c709a536f38",
        {
          attribution: '&copy; <a href="https://www.thunderforest.com/">Thunderforest</a>',
          maxZoom: 18,
          opacity: 0.7,
        }
      ).addTo(mapInstanceRef.current);
    }
  }, [transitFilters.publicTransport]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (cyclingLayerRef.current) {
      mapInstanceRef.current.removeLayer(cyclingLayerRef.current);
      cyclingLayerRef.current = null;
    }

    if (transitFilters.cycling) {
      cyclingLayerRef.current = L.tileLayer(
        "https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=6170aad10dfd42a38d4d8c709a536f38",
        {
          attribution: '&copy; <a href="https://www.thunderforest.com/">Thunderforest</a>',
          maxZoom: 18,
          opacity: 0.7,
        }
      ).addTo(mapInstanceRef.current);
    }
  }, [transitFilters.cycling]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    labelsRef.current.forEach((label) => label.remove());
    labelsRef.current = [];

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
            width: ${isSelected ? "40px" : "32px"};
            height: ${isSelected ? "40px" : "32px"};
            background: ${color};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: all 0.2s;
            ${isSelected ? "transform: scale(1.1); box-shadow: 0 0 0 3px hsl(var(--primary)), 0 2px 8px rgba(0,0,0,0.3);" : ""}
          ">
            <span style="
              color: white;
              font-weight: bold;
              font-size: ${isSelected ? "13px" : "11px"};
              text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            ">${avgScore}</span>
          </div>
        `,
        iconSize: [isSelected ? 40 : 32, isSelected ? 40 : 32],
        iconAnchor: [isSelected ? 20 : 16, isSelected ? 20 : 16],
      });

      const marker = L.marker([neighborhood.coordinates.lat, neighborhood.coordinates.lng], { icon })
        .addTo(mapInstanceRef.current!)
        .on("click", () => {
          onNeighborhoodSelect(selectedNeighborhood === neighborhood.id ? undefined : neighborhood.id);
        });

      markersRef.current.push(marker);

      const labelIcon = L.divIcon({
        className: "neighborhood-label",
        html: `
          <div style="
            white-space: nowrap;
            background: ${isSelected ? "hsl(var(--primary))" : "hsl(var(--background) / 0.95)"};
            color: ${isSelected ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))"};
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            box-shadow: 0 1px 4px rgba(0,0,0,0.2);
            border: 1px solid ${isSelected ? "hsl(var(--primary))" : "hsl(var(--border))"};
            pointer-events: none;
          ">${neighborhood.name}</div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, -20],
      });

      const label = L.marker([neighborhood.coordinates.lat, neighborhood.coordinates.lng], { 
        icon: labelIcon,
        interactive: false,
        zIndexOffset: -1000,
      }).addTo(mapInstanceRef.current!);

      labelsRef.current.push(label);
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

  const activeFilterCount = Object.values(transitFilters).filter(v => v).length;

  return (
    <section 
      className="relative min-h-[70vh] bg-muted/30" 
      id="map-section"
      data-testid="interactive-map"
    >
      <style>{`
        .neighborhood-label {
          background: transparent !important;
          border: none !important;
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
                <div className="w-3 h-3 rounded-full" style={{ background: "#22c55e" }} />
                <span>85+ Excellent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: "#3b82f6" }} />
                <span>70-84 Good</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: "#f59e0b" }} />
                <span>55-69 Moderate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: "#ef4444" }} />
                <span>&lt;55 Limited</span>
              </div>
            </div>

            <div className="absolute top-4 right-4 z-[1000]">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant={activeFilterCount > 0 ? "default" : "outline"}
                    size="sm"
                    className="shadow-lg"
                    data-testid="button-transit-filters"
                  >
                    <Layers className="w-4 h-4 mr-2" />
                    Transit Layers
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" size="sm" className="ml-2">
                        {activeFilterCount}
                      </Badge>
                    )}
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 z-[1100]">
                  <DropdownMenuLabel>Map Layers</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={transitFilters.publicTransport}
                    onCheckedChange={() => toggleFilter("publicTransport")}
                    data-testid="filter-public-transport"
                  >
                    <Train className="w-4 h-4 mr-2" />
                    Public Transport (Metro, Bus, Tram)
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={transitFilters.cycling}
                    onCheckedChange={() => toggleFilter("cycling")}
                    data-testid="filter-cycling"
                  >
                    <Bike className="w-4 h-4 mr-2" />
                    Cycling Infrastructure
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="lg:w-[400px]">
            {selected ? (
              <Card className="p-6 animate-in slide-in-from-right-4 duration-300" data-testid="map-info-panel">
                <div className="flex items-start justify-between gap-2 mb-4">
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
