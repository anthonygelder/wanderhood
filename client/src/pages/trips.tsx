import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Map, Plus, ArrowRight, Trash2, MapPin } from "lucide-react";
import type { City, TripWithNeighborhoods } from "@shared/schema";

export default function TripsPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [newTripName, setNewTripName] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: cities = [] } = useQuery<City[]>({ queryKey: ["/api/cities"] });

  const { data: trips = [], isLoading } = useQuery<TripWithNeighborhoods[]>({
    queryKey: ["/api/trips"],
    queryFn: async () => {
      const res = await fetch("/api/trips", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/trips", { name });
      return res.json();
    },
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      setNewTripName("");
      setCreating(false);
      toast({ title: "Trip created", description: `"${trip.name}" is ready to fill.` });
    },
    onError: () => toast({ title: "Error", description: "Failed to create trip.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (tripId: number) => apiRequest("DELETE", `/api/trips/${tripId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      toast({ title: "Trip deleted" });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete trip.", variant: "destructive" }),
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header cities={cities} />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Skeleton className="h-8 w-48 mb-8" />
          {[1, 2].map((i) => <Skeleton key={i} className="h-28 mb-4" />)}
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header cities={cities} />
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <Map className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Sign in to plan trips</h1>
          <p className="text-muted-foreground mb-6">Save neighborhoods from multiple cities into named itineraries.</p>
          <Button onClick={() => { window.location.href = "/api/login"; }}>Sign in</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="page-trips">
      <Header cities={cities} />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Map className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-semibold">My Trips</h1>
          </div>
          <Button onClick={() => setCreating(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" /> New Trip
          </Button>
        </div>

        {creating && (
          <Card className="p-4 mb-6 flex items-center gap-3">
            <Input
              autoFocus
              placeholder="Trip name (e.g. Summer Europe 2026)"
              value={newTripName}
              onChange={(e) => setNewTripName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTripName.trim()) createMutation.mutate(newTripName.trim());
                if (e.key === "Escape") { setCreating(false); setNewTripName(""); }
              }}
              className="flex-1"
            />
            <Button
              onClick={() => createMutation.mutate(newTripName.trim())}
              disabled={!newTripName.trim() || createMutation.isPending}
            >
              Create
            </Button>
            <Button variant="ghost" onClick={() => { setCreating(false); setNewTripName(""); }}>
              Cancel
            </Button>
          </Card>
        )}

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : trips.length === 0 ? (
          <Card className="p-12 text-center">
            <Map className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No trips yet</h2>
            <p className="text-muted-foreground mb-6">Create a trip and add neighborhoods from any city page.</p>
            <Button onClick={() => setCreating(true)}>
              <Plus className="w-4 h-4 mr-1" /> Create your first trip
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {trips.map((trip) => {
              const uniqueCities = Array.from(new Set(trip.neighborhoods.map((n) => n.cityId)));
              const cityNames = uniqueCities
                .map((id) => cities.find((c) => c.id === id)?.name ?? id)
                .join(", ");
              return (
                <Card key={trip.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4" data-testid={`card-trip-${trip.id}`}>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{trip.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      {trip.neighborhoods.length === 0
                        ? "No neighborhoods yet"
                        : `${trip.neighborhoods.length} neighborhood${trip.neighborhoods.length !== 1 ? "s" : ""} · ${cityNames}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/trips/${trip.id}`}>
                      <Button variant="outline" size="sm" data-testid={`button-view-trip-${trip.id}`}>
                        View <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(trip.id)}
                      data-testid={`button-delete-trip-${trip.id}`}
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
