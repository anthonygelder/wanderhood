import { CityCard } from "@/components/city-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { City } from "@shared/schema";

interface PopularCitiesSectionProps {
  cities: City[];
  isLoading?: boolean;
}

export function PopularCitiesSection({ cities, isLoading }: PopularCitiesSectionProps) {
  if (isLoading) {
    return (
      <section className="py-16 md:py-24 bg-background" data-testid="cities-loading">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i}>
                <Skeleton className="aspect-[4/3] rounded-t-md" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 bg-background" data-testid="popular-cities-section">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold">
            Popular Destinations
          </h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Explore walkable neighborhoods in these car-free friendly cities
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cities.map((city) => (
            <CityCard key={city.id} city={city} />
          ))}
        </div>
      </div>
    </section>
  );
}
