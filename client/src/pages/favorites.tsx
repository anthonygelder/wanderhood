import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Heart, MapPin, ArrowRight, Trash2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { City, Favorite, Neighborhood } from "@shared/schema";

export default function FavoritesPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to view your saved neighborhoods.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1500);
    }
  }, [authLoading, isAuthenticated, toast]);

  const { data: cities = [] } = useQuery<City[]>({
    queryKey: ["/api/cities"],
  });

  const { data: favorites = [], isLoading: favoritesLoading } = useQuery<Favorite[]>({
    queryKey: ["/api/favorites"],
    queryFn: async () => {
      const res = await fetch("/api/favorites", { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error("Failed to fetch favorites");
      }
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const handleRemoveFavorite = async (neighborhoodId: string) => {
    try {
      await apiRequest("DELETE", `/api/favorites/${neighborhoodId}`);
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: "Removed",
        description: "Neighborhood removed from your favorites.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove neighborhood.",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header cities={cities} />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background" data-testid="page-favorites">
      <Header cities={cities} />
      
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-semibold">Saved Neighborhoods</h1>
        </div>

        {favoritesLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No saved neighborhoods yet</h2>
            <p className="text-muted-foreground mb-6">
              Explore cities and save your favorite neighborhoods for later.
            </p>
            <Link href="/cities">
              <Button data-testid="button-explore-cities">
                Explore Cities
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4">
            {favorites.map((favorite) => {
              const city = cities.find((c) => c.id === favorite.cityId);
              return (
                <Card 
                  key={favorite.id} 
                  className="p-4 flex items-center gap-4"
                  data-testid={`card-favorite-${favorite.neighborhoodId}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {city?.name || favorite.cityId}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg">
                      {favorite.neighborhoodId.split("-").map(
                        (w) => w.charAt(0).toUpperCase() + w.slice(1)
                      ).join(" ")}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Link href={`/cities/${favorite.cityId}`}>
                      <Button variant="outline" size="sm" data-testid={`button-view-${favorite.neighborhoodId}`}>
                        View
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleRemoveFavorite(favorite.neighborhoodId)}
                      data-testid={`button-remove-${favorite.neighborhoodId}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
