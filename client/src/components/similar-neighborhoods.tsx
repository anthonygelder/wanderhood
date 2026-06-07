import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, ArrowRight } from "lucide-react";
import type { Neighborhood, City } from "@shared/schema";

interface SimilarResult {
  neighborhood: Neighborhood;
  city: City;
  score: number;
}

interface SimilarNeighborhoodsProps {
  neighborhoodId: string;
  neighborhoodName: string;
}

export function SimilarNeighborhoods({ neighborhoodId, neighborhoodName }: SimilarNeighborhoodsProps) {
  const { data: results = [], isLoading } = useQuery<SimilarResult[]>({
    queryKey: ["/api/neighborhoods", neighborhoodId, "similar"],
    queryFn: async () => {
      const res = await fetch(`/api/neighborhoods/${neighborhoodId}/similar`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  if (!isLoading && results.length === 0) return null;

  return (
    <section className="mt-10" data-testid="similar-neighborhoods">
      <h2 className="text-xl font-semibold mb-1">
        Similar to {neighborhoodName}
      </h2>
      <p className="text-sm text-muted-foreground mb-5">
        Neighborhoods with a similar vibe in other cities
      </p>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-36 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {results.map(({ neighborhood: n, city }) => (
            <Link key={n.id} href={`/city/${city.slug}/${n.slug}`}>
              <Card
                className="flex gap-4 p-4 hover-elevate cursor-pointer group"
                data-testid={`card-similar-${n.id}`}
              >
                <div
                  className="w-20 h-20 rounded-md bg-cover bg-center flex-shrink-0"
                  style={{ backgroundImage: `url(${n.heroImage})` }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <MapPin className="w-3 h-3" />
                    {city.name}
                  </div>
                  <h3 className="font-semibold text-sm leading-snug mb-2 group-hover:text-primary transition-colors">
                    {n.name}
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {n.vibe.slice(0, 3).map((v) => (
                      <Badge key={v} variant="secondary" className="text-xs px-2 py-0">
                        {v}
                      </Badge>
                    ))}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 self-center group-hover:text-primary transition-colors" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
