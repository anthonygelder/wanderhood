import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CityCard } from "@/components/city-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { City } from "@shared/schema";

export default function CitiesPage() {
  const [search, setSearch] = useState("");
  const { data: cities = [], isLoading } = useQuery<City[]>({
    queryKey: ["/api/cities"],
  });

  const filtered = cities.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background" data-testid="page-cities">
      <Helmet>
        <title>Explore Car-Free Cities - Wanderhood</title>
        <meta name="description" content="Browse walkable cities around the world. Find neighborhoods with great transit, food, and local character in Tokyo, Lisbon, Barcelona, and more." />
        <link rel="canonical" href="https://wanderhood.com/cities" />
        <meta property="og:title" content="Explore Car-Free Cities - Wanderhood" />
        <meta property="og:description" content="Browse walkable cities around the world with great transit, food, and local character." />
        <meta property="og:url" content="https://wanderhood.com/cities" />
        <meta property="og:type" content="website" />
      </Helmet>
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

          <div className="relative max-w-md mx-auto mb-10">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search cities or countries…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
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
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">
              No cities match "{search}"
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((city) => (
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
