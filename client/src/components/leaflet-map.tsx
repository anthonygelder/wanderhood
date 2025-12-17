import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/score-bar";
import { X, MapPin, Train, Footprints, Utensils, ExternalLink, Bus, Ship, Layers, ChevronDown, Loader2 } from "lucide-react";
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
  metro: boolean;
  rail: boolean;
  bus: boolean;
  ferry: boolean;
  tram: boolean;
}

interface LeafletMapProps {
  city: City;
  neighborhoods: Neighborhood[];
  selectedNeighborhood?: string;
  onNeighborhoodSelect: (id: string | undefined) => void;
  onViewHotels: (id: string) => void;
}

const ROUTE_TYPE_COLORS: Record<number, string> = {
  0: "#00D4AA",
  1: "#E31837",
  2: "#0066CC",
  3: "#FFB81C",
  4: "#0077BE",
  5: "#8B4513",
  6: "#9370DB",
  7: "#DC143C",
  11: "#32CD32",
  12: "#FF6347",
};

const ROUTE_TYPE_NAMES: Record<number, string> = {
  0: "Tram/Light Rail",
  1: "Metro/Subway",
  2: "Rail",
  3: "Bus",
  4: "Ferry",
  5: "Cable Car",
  6: "Gondola",
  7: "Funicular",
  11: "Trolleybus",
  12: "Monorail",
};

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
  const transitLayerRef = useRef<L.GeoJSON | null>(null);
  const stopsLayerRef = useRef<L.LayerGroup | null>(null);
  
  const [transitFilters, setTransitFilters] = useState<TransitFilters>({
    metro: true,
    rail: true,
    bus: false,
    ferry: true,
    tram: true,
  });
  const [isLoadingTransit, setIsLoadingTransit] = useState(false);
  const [transitError, setTransitError] = useState<string | null>(null);
  
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

  const fetchTransitRoutes = useCallback(async () => {
    if (!mapInstanceRef.current) return;

    const activeTypes: number[] = [];
    if (transitFilters.metro) activeTypes.push(1);
    if (transitFilters.rail) activeTypes.push(2);
    if (transitFilters.bus) activeTypes.push(3);
    if (transitFilters.ferry) activeTypes.push(4);
    if (transitFilters.tram) activeTypes.push(0, 5, 6, 7, 11, 12);

    if (transitLayerRef.current) {
      mapInstanceRef.current.removeLayer(transitLayerRef.current);
      transitLayerRef.current = null;
    }
    if (stopsLayerRef.current) {
      mapInstanceRef.current.removeLayer(stopsLayerRef.current);
      stopsLayerRef.current = null;
    }

    if (activeTypes.length === 0) {
      return;
    }

    setIsLoadingTransit(true);
    setTransitError(null);

    try {
      const routeTypesParam = activeTypes.join(",");
      const response = await fetch(
        `/api/transit/routes?lat=${city.coordinates.lat}&lon=${city.coordinates.lng}&radius=8000&route_type=${routeTypesParam}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch transit data");
      }

      const geojsonData = await response.json();

      if (geojsonData.features && geojsonData.features.length > 0) {
        transitLayerRef.current = L.geoJSON(geojsonData, {
          style: (feature) => {
            const routeType = feature?.properties?.route_type ?? 3;
            const routeColor = feature?.properties?.route_color 
              ? `#${feature.properties.route_color}` 
              : ROUTE_TYPE_COLORS[routeType] || "#888888";
            
            return {
              color: routeColor,
              weight: routeType === 1 || routeType === 2 ? 4 : 3,
              opacity: 0.85,
              lineCap: "round",
              lineJoin: "round",
            };
          },
          onEachFeature: (feature, layer) => {
            const props = feature.properties;
            const routeType = ROUTE_TYPE_NAMES[props?.route_type] || "Transit";
            const routeName = props?.route_long_name || props?.route_short_name || "Unknown Route";
            const agencyName = props?.agency?.agency_name || "";
            
            layer.bindPopup(`
              <div style="min-width: 150px;">
                <strong>${routeName}</strong><br/>
                <span style="color: #666; font-size: 12px;">${routeType}</span>
                ${agencyName ? `<br/><span style="color: #888; font-size: 11px;">${agencyName}</span>` : ""}
              </div>
            `);
          },
        }).addTo(mapInstanceRef.current);
      }
    } catch (error) {
      console.error("Error fetching transit routes:", error);
      setTransitError("Could not load transit data for this city");
    } finally {
      setIsLoadingTransit(false);
    }
  }, [city.coordinates.lat, city.coordinates.lng, transitFilters]);

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
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Transit data from <a href="https://transit.land">Transitland</a>',
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
    fetchTransitRoutes();
  }, [fetchTransitRoutes]);

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

      const marker = L.marker([neighborhood.coordinates.lat, neighborhood.coordinates.lng], {
        icon,
        zIndexOffset: isSelected ? 1000 : 0,
      }).addTo(mapInstanceRef.current!);

      marker.on("click", () => {
        onNeighborhoodSelect(neighborhood.id);
      });

      markersRef.current.push(marker);

      const labelIcon = L.divIcon({
        className: "neighborhood-label",
        html: `
          <div style="
            background: hsl(var(--background) / 0.95);
            color: hsl(var(--foreground));
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            white-space: nowrap;
            box-shadow: 0 1px 4px rgba(0,0,0,0.2);
            border: 1px solid hsl(var(--border));
            pointer-events: none;
          ">
            ${neighborhood.name}
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, -25],
      });

      const label = L.marker([neighborhood.coordinates.lat, neighborhood.coordinates.lng], {
        icon: labelIcon,
        zIndexOffset: isSelected ? 999 : -1,
        interactive: false,
      }).addTo(mapInstanceRef.current!);

      labelsRef.current.push(label);
    });
  }, [neighborhoods, selectedNeighborhood, onNeighborhoodSelect]);

  useEffect(() => {
    if (selected && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        [selected.coordinates.lat, selected.coordinates.lng],
        14,
        { duration: 0.5 }
      );
    }
  }, [selectedNeighborhood, neighborhoods]);

  const activeFilterCount = Object.values(transitFilters).filter(v => v).length;

  return (
    <div className="relative w-full h-[500px] md:h-[600px] lg:h-[700px]">
      <div ref={mapRef} className="h-full w-full rounded-lg" />
      
      {selected && (
        <Card className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 p-4 z-[1000] shadow-lg">
          <div className="flex justify-between items-start gap-2 mb-3">
            <div>
              <h3 className="font-semibold text-lg">{selected.name}</h3>
              <p className="text-sm text-muted-foreground">{city.name}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNeighborhoodSelect(undefined)}
              data-testid="button-close-popup"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-1 mb-3">
            {selected.vibe.slice(0, 3).map((v) => (
              <Badge key={v} variant="secondary" size="sm">
                {v}
              </Badge>
            ))}
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <Footprints className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <ScoreBar score={selected.scores.walkability} label="Walk" size="sm" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Train className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <ScoreBar score={selected.scores.transitConnectivity} label="Transit" size="sm" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <ScoreBar score={selected.scores.foodCoffeeDensity} label="Food" size="sm" />
              </div>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={() => onViewHotels(selected.id)}
            data-testid="button-view-hotels"
          >
            <MapPin className="w-4 h-4 mr-2" />
            View Hotels
            <ExternalLink className="w-3 h-3 ml-2" />
          </Button>
        </Card>
      )}

      <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-start gap-2 pointer-events-none">
        <div className="pointer-events-auto">
          {isLoadingTransit && (
            <Badge variant="secondary" className="shadow-md">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Loading transit...
            </Badge>
          )}
          {transitError && (
            <Badge variant="outline" className="shadow-md bg-background">
              {transitError}
            </Badge>
          )}
        </div>
        
        <div className="pointer-events-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={activeFilterCount > 0 ? "default" : "outline"}
                size="sm"
                className="shadow-lg"
                data-testid="button-transit-filters"
              >
                <Layers className="w-4 h-4 mr-2" />
                Transit
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" size="sm" className="ml-2">
                    {activeFilterCount}
                  </Badge>
                )}
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 z-[1100]">
              <DropdownMenuLabel>Transit Types (Transitland)</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={transitFilters.metro}
                onCheckedChange={() => toggleFilter("metro")}
                data-testid="filter-metro"
              >
                <div className="w-3 h-3 rounded-full mr-2" style={{ background: ROUTE_TYPE_COLORS[1] }} />
                Metro / Subway
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={transitFilters.rail}
                onCheckedChange={() => toggleFilter("rail")}
                data-testid="filter-rail"
              >
                <div className="w-3 h-3 rounded-full mr-2" style={{ background: ROUTE_TYPE_COLORS[2] }} />
                Rail / Commuter
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={transitFilters.tram}
                onCheckedChange={() => toggleFilter("tram")}
                data-testid="filter-tram"
              >
                <div className="w-3 h-3 rounded-full mr-2" style={{ background: ROUTE_TYPE_COLORS[0] }} />
                Tram / Light Rail
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={transitFilters.bus}
                onCheckedChange={() => toggleFilter("bus")}
                data-testid="filter-bus"
              >
                <div className="w-3 h-3 rounded-full mr-2" style={{ background: ROUTE_TYPE_COLORS[3] }} />
                Bus Routes
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={transitFilters.ferry}
                onCheckedChange={() => toggleFilter("ferry")}
                data-testid="filter-ferry"
              >
                <div className="w-3 h-3 rounded-full mr-2" style={{ background: ROUTE_TYPE_COLORS[4] }} />
                Ferry
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-1">
        <Badge variant="outline" className="text-xs bg-background/90">
          <div className="w-2 h-2 rounded-full mr-1" style={{ background: "#22c55e" }} />
          85+ Excellent
        </Badge>
        <Badge variant="outline" className="text-xs bg-background/90">
          <div className="w-2 h-2 rounded-full mr-1" style={{ background: "#3b82f6" }} />
          70+ Good
        </Badge>
        <Badge variant="outline" className="text-xs bg-background/90">
          <div className="w-2 h-2 rounded-full mr-1" style={{ background: "#f59e0b" }} />
          55+ Fair
        </Badge>
      </div>
    </div>
  );
}
