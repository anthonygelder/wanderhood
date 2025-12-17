import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import type { City } from "@shared/schema";

interface CityCardProps {
  city: City;
}

export function CityCard({ city }: CityCardProps) {
  return (
    <Link href={`/city/${city.slug}`} data-testid={`link-city-${city.slug}`}>
      <Card className="overflow-visible group cursor-pointer hover-elevate">
        <div className="relative">
          <div 
            className="aspect-[4/3] bg-cover bg-center rounded-t-md transition-transform duration-300"
            style={{ backgroundImage: `url(${city.heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-t-md" />
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-2xl font-serif font-semibold text-white" data-testid={`text-city-name-${city.slug}`}>
              {city.name}
            </h3>
            <div className="flex items-center gap-1 text-white/80 text-sm mt-1">
              <MapPin className="w-3 h-3" />
              <span>{city.country}</span>
            </div>
          </div>
        </div>
        <div className="p-5">
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {city.description}
          </p>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" size="sm">
              Car-Free Friendly
            </Badge>
            <span className="text-sm text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
              Explore
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
