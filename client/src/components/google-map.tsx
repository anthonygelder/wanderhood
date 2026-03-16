import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/score-bar";
import { X, MapPin, Train, Footprints, Utensils, ExternalLink, Layers, ChevronDown, Star } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import type { Neighborhood, City, Hotel } from "@shared/schema";

interface GoogleMapProps {
  city: City;
  neighborhoods: Neighborhood[];
  selectedNeighborhood?: string;
  onNeighborhoodSelect: (id: string | undefined) => void;
  onViewHotels: (id: string) => void;
  hotels?: Hotel[];
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
  hotels = [],
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const hotelMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const transitStationMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const walkingCircleRef = useRef<google.maps.Circle | null>(null);
  const transitLayerRef = useRef<google.maps.TransitLayer | null>(null);
  const bicyclingLayerRef = useRef<google.maps.BicyclingLayer | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);

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

  // Straight-line distance in metres between two lat/lng points
  const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Estimated walking time (1.3× route factor, 80 m/min average pace)
  const walkingMins = (distM: number) => Math.round((distM * 1.3) / 80);

  const clearTransitOverlays = () => {
    transitStationMarkersRef.current.forEach((m) => (m.map = null));
    transitStationMarkersRef.current = [];
    if (walkingCircleRef.current) {
      walkingCircleRef.current.setMap(null);
      walkingCircleRef.current = null;
    }
  };

  // Zoom + transit stations when a hotel is selected
  useEffect(() => {
    clearTransitOverlays();

    if (!selectedHotel?.coordinates || !mapInstanceRef.current || !mapReady) {
      // Zoom back to neighbourhood level when hotel is deselected
      if (!selectedHotel && selected && mapInstanceRef.current) {
        mapInstanceRef.current.panTo({ lat: selected.coordinates.lat, lng: selected.coordinates.lng });
        mapInstanceRef.current.setZoom(14);
      }
      return;
    }

    const { lat, lng } = selectedHotel.coordinates;
    const map = mapInstanceRef.current;

    // Zoom in to hotel
    map.panTo({ lat, lng });
    map.setZoom(16);

    // Draw 15-min walking radius (~1 200 m)
    walkingCircleRef.current = new google.maps.Circle({
      map,
      center: { lat, lng },
      radius: 1200,
      fillColor: "#7c3aed",
      fillOpacity: 0.07,
      strokeColor: "#7c3aed",
      strokeOpacity: 0.35,
      strokeWeight: 2,
    });

    // Fetch nearby transit stations
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

    fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.displayName,places.location,places.types",
      },
      body: JSON.stringify({
        includedTypes: [
          "transit_station", "subway_station", "bus_station",
          "train_station", "light_rail_station", "ferry_terminal",
        ],
        maxResultCount: 20,
        locationRestriction: {
          circle: { center: { latitude: lat, longitude: lng }, radius: 1200 },
        },
      }),
    })
      .then((r) => r.json())
      .then((data: {
        places?: Array<{
          displayName?: { text: string };
          location: { latitude: number; longitude: number };
          types: string[];
        }>;
      }) => {
        if (!data.places || !mapInstanceRef.current) return;

        for (const place of data.places) {
          const pLat = place.location.latitude;
          const pLng = place.location.longitude;
          const distM = haversineDistance(lat, lng, pLat, pLng);
          const mins = walkingMins(distM);
          if (mins > 15) continue;

          const types = place.types ?? [];
          const isSubway = types.some((t) => ["subway_station", "light_rail_station"].includes(t));
          const isTrain = types.some((t) => t === "train_station");
          const color = isSubway ? "#2563eb" : isTrain ? "#16a34a" : "#d97706";
          const icon = isSubway ? "🚇" : isTrain ? "🚆" : "🚌";

          const name = place.displayName?.text ?? "Station";
          const el = document.createElement("div");
          el.title = name;
          el.style.cssText = `
            background: ${color};
            color: white;
            border-radius: 20px;
            padding: 4px 8px;
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.35);
            border: 2px solid white;
            display: flex;
            align-items: center;
            gap: 4px;
            cursor: default;
          `;
          el.innerHTML = `<span>${icon}</span><span>${mins}min 🚶</span>`;

          const marker = new google.maps.marker.AdvancedMarkerElement({
            map: mapInstanceRef.current,
            position: { lat: pLat, lng: pLng },
            content: el,
            zIndex: 300,
          });

          transitStationMarkersRef.current.push(marker);
        }
      })
      .catch(console.error);
  }, [selectedHotel, mapReady]);

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

  // Hotel markers
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;

    hotelMarkersRef.current.forEach((m) => (m.map = null));
    hotelMarkersRef.current = [];
    setSelectedHotel(null);
    clearTransitOverlays();

    hotels.filter((h) => h.coordinates).forEach((hotel) => {
      const el = document.createElement("div");
      el.style.cssText = `
        background: #7c3aed;
        color: white;
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        border: 2px solid white;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
      `;
      el.innerHTML = `<span>🏨</span><span>${hotel.name.length > 18 ? hotel.name.slice(0, 18) + "…" : hotel.name}</span>`;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstanceRef.current!,
        position: { lat: hotel.coordinates!.lat, lng: hotel.coordinates!.lng },
        content: el,
        zIndex: 500,
      });

      marker.addListener("click", () =>
        setSelectedHotel((prev) => (prev?.id === hotel.id ? null : hotel))
      );
      hotelMarkersRef.current.push(marker);
    });
  }, [hotels, mapReady]);

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

      {selectedHotel && (
        <Card className="absolute bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-72 p-4 z-[10] shadow-lg border-purple-200">
          <div className="flex justify-between items-start gap-2 mb-2">
            <div>
              <h3 className="font-semibold leading-tight">{selectedHotel.name}</h3>
              <div className="flex items-center gap-1 mt-1">
                {Array.from({ length: selectedHotel.starRating }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-xs text-muted-foreground ml-1">{selectedHotel.rating.toFixed(1)}</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => { setSelectedHotel(null); clearTransitOverlays(); }}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
            <Train className="w-3 h-3" />
            <span>{selectedHotel.distanceToTransit}</span>
          </div>
          <div className="text-sm font-medium text-purple-700 mb-3">{selectedHotel.priceRange}</div>
          <Button
            size="sm"
            className="w-full bg-purple-600 hover:bg-purple-700"
            onClick={() => window.open(selectedHotel.affiliateUrl, "_blank")}
          >
            Book on Booking.com
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

      {!selectedHotel && <div className="absolute bottom-4 left-4 z-[10] flex flex-col gap-1">
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
      </div>}
    </div>
  );
}
