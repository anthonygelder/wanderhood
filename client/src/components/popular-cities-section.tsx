import { useState } from "react";
import { Link } from "wouter";
import { CityCard } from "@/components/city-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { City } from "@shared/schema";

const PAGE_SIZE = 6;

interface PopularCitiesSectionProps {
  cities: City[];
  isLoading?: boolean;
}

export function PopularCitiesSection({ cities, isLoading }: PopularCitiesSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? cities : cities.slice(0, PAGE_SIZE);

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
          {visible.map((city) => (
            <CityCard key={city.id} city={city} />
          ))}
        </div>

        {!showAll && cities.length > PAGE_SIZE && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
            <Button variant="outline" onClick={() => setShowAll(true)}>
              Show all {cities.length} cities
            </Button>
            <Link href="/cities">
              <a className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">
                Browse & search all cities →
              </a>
            </Link>
          </div>
        )}
        {showAll && (
          <div className="flex justify-center mt-10">
            <Link href="/cities">
              <a className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">
                Browse & search all cities →
              </a>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
