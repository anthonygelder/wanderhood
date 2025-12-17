import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ExternalLink } from "lucide-react";
import type { Hotel } from "@shared/schema";

interface HotelCardProps {
  hotel: Hotel;
}

export function HotelCard({ hotel }: HotelCardProps) {
  return (
    <Card className="overflow-visible" data-testid={`card-hotel-${hotel.id}`}>
      <div className="flex gap-4 p-4">
        <div 
          className="w-[120px] h-[120px] flex-shrink-0 rounded-md bg-cover bg-center"
          style={{ backgroundImage: `url(${hotel.image})` }}
        />
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <h4 className="font-semibold truncate" data-testid={`text-hotel-name-${hotel.id}`}>
              {hotel.name}
            </h4>
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: hotel.starRating }).map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-chart-5 text-chart-5" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {hotel.description}
            </p>
          </div>
          <div className="flex items-center justify-between mt-2 gap-2">
            <span className="text-lg font-bold" data-testid={`text-hotel-price-${hotel.id}`}>
              {hotel.priceRange}
            </span>
            <Button 
              size="sm"
              asChild
              data-testid={`button-book-hotel-${hotel.id}`}
            >
              <a href={hotel.affiliateUrl} target="_blank" rel="noopener noreferrer">
                Book Now
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
