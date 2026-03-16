import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Star, MapPin, Wifi, Coffee, Dumbbell, Tv, Car, Bath } from "lucide-react";
import type { Neighborhood, Hotel } from "@shared/schema";

interface HotelsSectionProps {
  cityId: string;
  neighborhoods: Neighborhood[];
  selectedNeighborhood?: string;
  onNeighborhoodChange?: (id: string) => void;
}

export function HotelsSection({ cityId, neighborhoods, selectedNeighborhood, onNeighborhoodChange }: HotelsSectionProps) {
  const [activeId, setActiveId] = useState<string | undefined>(
    selectedNeighborhood ?? neighborhoods[0]?.id
  );

  // Sync when the map sets a neighborhood externally
  useEffect(() => {
    if (selectedNeighborhood) setActiveId(selectedNeighborhood);
  }, [selectedNeighborhood]);

  // Default to first neighborhood once list loads
  useEffect(() => {
    if (!activeId && neighborhoods.length > 0) setActiveId(neighborhoods[0].id);
  }, [neighborhoods]);

  const activeNeighborhood = neighborhoods.find(n => n.id === activeId) ?? neighborhoods[0];

  const { data: hotels = [], isLoading } = useQuery<Hotel[]>({
    queryKey: ["/api/neighborhoods", activeNeighborhood?.id, "hotels"],
    queryFn: async () => {
      if (!activeNeighborhood) return [];
      const res = await fetch(`/api/neighborhoods/${activeNeighborhood.id}/hotels`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!activeNeighborhood,
  });

  const getAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase();
    if (lower.includes("wifi") || lower.includes("internet")) return <Wifi className="w-3 h-3" />;
    if (lower.includes("breakfast") || lower.includes("coffee")) return <Coffee className="w-3 h-3" />;
    if (lower.includes("gym") || lower.includes("fitness")) return <Dumbbell className="w-3 h-3" />;
    if (lower.includes("spa") || lower.includes("pool")) return <Bath className="w-3 h-3" />;
    if (lower.includes("parking")) return <Car className="w-3 h-3" />;
    if (lower.includes("tv") || lower.includes("entertainment")) return <Tv className="w-3 h-3" />;
    return null;
  };

  return (
    <section 
      id="hotels-section" 
      className="py-6"
      data-testid="hotels-section"
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Neighborhood selector */}
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
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-80 rounded-md" />
            ))}
          </div>
        ) : hotels.length === 0 ? (
          <Card className="p-12 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Hotels Found</h3>
            <p className="text-muted-foreground mb-6">
              Select a neighborhood from the map above to see available hotels.
            </p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map((hotel) => (
              <Card 
                key={hotel.id} 
                className="overflow-hidden hover-elevate"
                data-testid={`card-hotel-${hotel.id}`}
              >
                <div 
                  className="h-48 bg-cover bg-center"
                  style={{ backgroundImage: `url(${hotel.image})` }}
                >
                  <div className="h-full w-full bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <Badge variant="secondary" className="bg-background/90">
                      {hotel.priceRange}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-lg line-clamp-1">{hotel.name}</h3>
                    <div className="flex items-center gap-1 text-sm flex-shrink-0">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{hotel.rating?.toFixed(1) || hotel.starRating}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                    <MapPin className="w-3 h-3" />
                    <span>{hotel.distanceToTransit || "Near transit"}</span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {hotel.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {(hotel.amenities || []).slice(0, 4).map((amenity) => (
                      <Badge key={amenity} variant="outline" size="sm" className="gap-1">
                        {getAmenityIcon(amenity)}
                        {amenity}
                      </Badge>
                    ))}
                  </div>

                  <Button 
                    className="w-full"
                    onClick={() => window.open(hotel.affiliateUrl, "_blank")}
                    data-testid={`button-book-${hotel.id}`}
                  >
                    Book on Booking.com
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center mt-8">
          We may earn a commission when you book through our links. This helps us keep Wanderhood free.
        </p>
      </div>
    </section>
  );
}
