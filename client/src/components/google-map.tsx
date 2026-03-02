import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/score-bar";
import { X, MapPin, Train, Footprints, Utensils, ExternalLink, Layers, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import type { Neighborhood, City } from "@shared/schema";

interface GoogleMapProps {
  city: City;
  neighborhoods: Neighborhood[];
  selectedNeighborhood?: string;
  onNeighborhoodSelect: (id: string | undefined) => void;
  onViewHotels: (id: string) => void;
}

setOptions({
  key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  v: "weekly",
});

export function GoogleMap({
  city,
  neighborhoods,
  selectedNeighborhood,
  onNeighborhoodSelect,
  onViewHotels,
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const transitLayerRef = useRef<google.maps.TransitLayer | null>(null);
  const bicyclingLayerRef = useRef<google.maps.BicyclingLayer | null>(null);

  const [showTransit, setShowTransit] = useState(true);
  const [showBicycling, setShowBicycling] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const selected = neighborhoods.find((n) => n.id === selectedNeighborhood);

  const getScoreColor = (score: number): string => {
    if (score >= 85) return "#22c55e";
    if (score >= 70) return "#3b82f6";
    if (score >= 55) return "#f59e0b";
    return "#ef4444";
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    let cancelled = false;

    (async () => {
      const { Map } = await importLibrary("maps");
      await importLibrary("marker");

      if (cancelled || !mapRef.current) return;

      mapInstanceRef.current = new Map(mapRef.current, {
        center: { lat: city.coordinates.lat, lng: city.coordinates.lng },
        zoom: 12,
        mapId: "wanderhood-map",
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      // Initialize transit layer (on by default)
      transitLayerRef.current = new google.maps.TransitLayer();
      transitLayerRef.current.setMap(mapInstanceRef.current);

      // Initialize bicycling layer (off by default)
      bicyclingLayerRef.current = new google.maps.BicyclingLayer();

      setMapReady(true);
    })();

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => (m.map = null));
      markersRef.current = [];
      if (transitLayerRef.current) transitLayerRef.current.setMap(null);
      if (bicyclingLayerRef.current) bicyclingLayerRef.current.setMap(null);
      mapInstanceRef.current = null;
      setMapReady(false);
    };
  }, []);

  // Update center when city changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setCenter({ lat: city.coordinates.lat, lng: city.coordinates.lng });
    mapInstanceRef.current.setZoom(12);
  }, [city.coordinates.lat, city.coordinates.lng]);

  // Toggle transit layer
  useEffect(() => {
    if (!transitLayerRef.current || !mapInstanceRef.current) return;
    transitLayerRef.current.setMap(showTransit ? mapInstanceRef.current : null);
  }, [showTransit, mapReady]);

  // Toggle bicycling layer
  useEffect(() => {
    if (!bicyclingLayerRef.current || !mapInstanceRef.current) return;
    bicyclingLayerRef.current.setMap(showBicycling ? mapInstanceRef.current : null);
  }, [showBicycling, mapReady]);

  // Create/update neighborhood markers
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;

    // Clear existing markers
    markersRef.current.forEach((m) => (m.map = null));
    markersRef.current = [];

    neighborhoods.forEach((neighborhood) => {
      const avgScore = Math.round(
        (neighborhood.scores.walkability + neighborhood.scores.transitConnectivity) / 2
      );
      const color = getScoreColor(avgScore);
      const isSelected = selectedNeighborhood === neighborhood.id;

      // Score circle marker
      const markerEl = document.createElement("div");
      markerEl.style.cssText = `
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
        ${isSelected ? "transform: scale(1.1); box-shadow: 0 0 0 3px hsl(210 100% 50%), 0 2px 8px rgba(0,0,0,0.3);" : ""}
      `;

      const scoreSpan = document.createElement("span");
      scoreSpan.textContent = String(avgScore);
      scoreSpan.style.cssText = `
        color: white;
        font-weight: bold;
        font-size: ${isSelected ? "13px" : "11px"};
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
      `;
      markerEl.appendChild(scoreSpan);

      // Container with label
      const container = document.createElement("div");
      container.style.cssText = "display: flex; flex-direction: column; align-items: center;";
      container.appendChild(markerEl);

      const label = document.createElement("div");
      label.textContent = neighborhood.name;
      label.style.cssText = `
        background: rgba(255,255,255,0.95);
        color: #1a1a1a;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
        box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        border: 1px solid #e5e5e5;
        margin-top: 4px;
        pointer-events: none;
      `;
      container.appendChild(label);

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstanceRef.current!,
        position: { lat: neighborhood.coordinates.lat, lng: neighborhood.coordinates.lng },
        content: container,
        zIndex: isSelected ? 1000 : 0,
      });

      marker.addListener("click", () => {
        onNeighborhoodSelect(neighborhood.id);
      });

      markersRef.current.push(marker);
    });
  }, [neighborhoods, selectedNeighborhood, onNeighborhoodSelect, mapReady]);

  // Pan to selected neighborhood
  useEffect(() => {
    if (selected && mapInstanceRef.current) {
      mapInstanceRef.current.panTo({
        lat: selected.coordinates.lat,
        lng: selected.coordinates.lng,
      });
      mapInstanceRef.current.setZoom(14);
    }
  }, [selectedNeighborhood, neighborhoods]);

  const activeLayerCount = [showTransit, showBicycling].filter(Boolean).length;

  const clearAllLayers = () => {
    setShowTransit(false);
    setShowBicycling(false);
  };

  return (
    <div className="relative w-full h-[500px] md:h-[600px] lg:h-[700px]">
      <div ref={mapRef} className="h-full w-full rounded-lg" />

      {selected && (
        <Card className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 p-4 z-[10] shadow-lg">
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

      <div className="absolute top-4 right-4 z-[10] flex items-center gap-2">
        {activeLayerCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="shadow-lg bg-background hover:bg-muted"
            onClick={clearAllLayers}
            data-testid="button-clear-layers"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={activeLayerCount > 0 ? "default" : "outline"}
              size="sm"
              className={`shadow-lg ${activeLayerCount === 0 ? "bg-background hover:bg-muted" : ""}`}
              data-testid="button-layer-toggle"
            >
              <Layers className="w-4 h-4 mr-2" />
              Layers
              {activeLayerCount > 0 && (
                <Badge variant="secondary" size="sm" className="ml-2">
                  {activeLayerCount}
                </Badge>
              )}
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 z-[10]">
            <DropdownMenuLabel>Map Layers</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={showTransit}
              onCheckedChange={() => setShowTransit((v) => !v)}
              data-testid="layer-transit"
            >
              <Train className="w-4 h-4 mr-2" />
              Transit
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={showBicycling}
              onCheckedChange={() => setShowBicycling((v) => !v)}
              data-testid="layer-bicycling"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="5.5" cy="17.5" r="3.5" />
                <circle cx="18.5" cy="17.5" r="3.5" />
                <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2" />
              </svg>
              Bicycling
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="absolute bottom-4 left-4 z-[10] flex flex-col gap-1">
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
