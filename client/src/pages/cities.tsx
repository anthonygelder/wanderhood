import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CityCard } from "@/components/city-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { City } from "@shared/schema";

export default function CitiesPage() {
  const { data: cities = [], isLoading } = useQuery<City[]>({
    queryKey: ["/api/cities"],
  });

  return (
    <div className="min-h-screen bg-background" data-testid="page-cities">
      <Header cities={cities} />
      
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Explore Car-Free Cities
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover walkable neighborhoods in cities around the world. 
              Each destination is hand-picked for its transit options and pedestrian-friendly areas.
            </p>
          </div>

          {isLoading ? (
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cities.map((city) => (
                <CityCard key={city.id} city={city} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
