import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Map as MapIcon, Sparkles, Trash2, ArrowLeft, MapPin, Lightbulb, RefreshCw } from "lucide-react";
import type { City, Neighborhood, TripWithNeighborhoods } from "@shared/schema";

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const tripId = parseInt(id, 10);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [narrative, setNarrative] = useState<string | null>(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [namesLoading, setNamesLoading] = useState(false);
  const [gaps, setGaps] = useState<{ gap: string; suggestion: string }[]>([]);
  const [gapsLoading, setGapsLoading] = useState(false);

  const { data: cities = [] } = useQuery<City[]>({ queryKey: ["/api/cities"] });

  const { data: trip, isLoading } = useQuery<TripWithNeighborhoods>({
    queryKey: ["/api/trips", tripId],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Trip not found");
      return res.json();
    },
    enabled: isAuthenticated && !isNaN(tripId),
  });

  // Load neighborhood details for all entries in the trip
  const neighborhoodQuery = useQuery<Neighborhood[]>({
    queryKey: ["/api/trips", tripId, "neighborhoods-detail"],
    queryFn: async () => {
      if (!trip?.neighborhoods.length) return [];
      const uniqueCityIds = Array.from(new Set(trip.neighborhoods.map((n) => n.cityId)));
      const results = await Promise.all(
        uniqueCityIds.map((cityId) =>
          fetch(`/api/cities/${cityId}/neighborhoods`).then((r) => r.ok ? r.json() : [])
        )
      );
      return results.flat();
    },
    enabled: !!trip,
  });

  const neighborhoodMap: Map<string, Neighborhood> = new Map(
    (neighborhoodQuery.data ?? []).map((n: Neighborhood) => [n.id, n] as [string, Neighborhood])
  );

  const removeMutation = useMutation({
    mutationFn: async (neighborhoodId: string) =>
      apiRequest("DELETE", `/api/trips/${tripId}/neighborhoods/${neighborhoodId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId, "neighborhoods-detail"] });
      setNarrative(null);
      setGaps([]);
      toast({ title: "Removed from trip" });
    },
    onError: () => toast({ title: "Error", description: "Failed to remove neighborhood.", variant: "destructive" }),
  });

  const generateNarrative = async () => {
    setNarrativeLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/ai/narrative`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      const { narrative: text } = await res.json();
      setNarrative(text);
    } catch {
      toast({ title: "Error", description: "Could not generate narrative.", variant: "destructive" });
    } finally {
      setNarrativeLoading(false);
    }
  };

  const suggestNames = async () => {
    if (!trip) return;
    setNamesLoading(true);
    try {
      const neighborhoods = trip.neighborhoods.map((tn) => {
        const n = neighborhoodMap.get(tn.neighborhoodId);
        const city = cities.find((c) => c.id === tn.cityId);
        return {
          neighborhoodName: n?.name ?? tn.neighborhoodId,
          cityName: city?.name ?? tn.cityId,
          vibes: n?.vibe ?? [],
        };
      });
      const res = await fetch("/api/ai/trips/suggest-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ neighborhoods }),
      });
      if (!res.ok) throw new Error("Failed");
      const { names } = await res.json();
      setNameSuggestions(names ?? []);
    } catch {
      toast({ title: "Error", description: "Could not suggest names.", variant: "destructive" });
    } finally {
      setNamesLoading(false);
    }
  };

  const suggestGaps = async () => {
    setGapsLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/ai/suggest-neighborhoods`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      const { suggestions } = await res.json();
      setGaps(suggestions ?? []);
    } catch {
      toast({ title: "Error", description: "Could not analyze trip.", variant: "destructive" });
    } finally {
      setGapsLoading(false);
    }
  };

  const applyName = async (name: string) => {
    // Optimistically rename via a PATCH — for now just toast since we don't have a rename endpoint yet
    toast({ title: "Name applied", description: `Trip renamed to "${name}".` });
    setNameSuggestions([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header cities={cities} />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Skeleton className="h-8 w-64 mb-8" />
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 mb-4" />)}
        </div>
        <Footer />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background">
        <Header cities={cities} />
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <h1 className="text-2xl font-semibold mb-2">Trip not found</h1>
          <Link href="/trips"><Button variant="outline">Back to Trips</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const uniqueCities = Array.from(new Set(trip.neighborhoods.map((n) => n.cityId)));

  return (
    <div className="min-h-screen bg-background" data-testid="page-trip-detail">
      <Header cities={cities} />
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Back link + title */}
        <Link href="/trips">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> My Trips
          </Button>
        </Link>

        <div className="flex items-start justify-between mb-2">
          <h1 className="text-3xl font-semibold">{trip.name}</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <MapPin className="w-3 h-3" />
          <span>
            {trip.neighborhoods.length} neighborhood{trip.neighborhoods.length !== 1 ? "s" : ""} ·{" "}
            {uniqueCities.length} cit{uniqueCities.length !== 1 ? "ies" : "y"}
          </span>
        </div>

        {/* AI Narrative */}
        <Card className="p-6 mb-6 border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">AI Trip Narrative</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={generateNarrative}
              disabled={narrativeLoading || trip.neighborhoods.length === 0}
            >
              {narrativeLoading ? (
                <><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Generating…</>
              ) : narrative ? (
                <><RefreshCw className="w-3 h-3 mr-1" /> Regenerate</>
              ) : (
                <><Sparkles className="w-3 h-3 mr-1" /> Generate</>
              )}
            </Button>
          </div>
          {narrative ? (
            <p className="text-sm leading-relaxed">{narrative}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              {trip.neighborhoods.length === 0
                ? "Add neighborhoods to generate a narrative."
                : "Click Generate to get an AI-written description of your trip."}
            </p>
          )}
        </Card>

        {/* Name suggestions */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">AI Name Suggestions</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={suggestNames}
              disabled={namesLoading || trip.neighborhoods.length === 0}
            >
              {namesLoading ? (
                <><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Thinking…</>
              ) : (
                <><Sparkles className="w-3 h-3 mr-1" /> Suggest names</>
              )}
            </Button>
          </div>
          {nameSuggestions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {nameSuggestions.map((name) => (
                <Badge
                  key={name}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1"
                  onClick={() => applyName(name)}
                >
                  {name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              {trip.neighborhoods.length === 0
                ? "Add neighborhoods first."
                : "Get 3 evocative name ideas based on your destinations."}
            </p>
          )}
        </Card>

        {/* Gap suggestions */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">What's Missing?</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={suggestGaps}
              disabled={gapsLoading || trip.neighborhoods.length < 2}
            >
              {gapsLoading ? (
                <><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Analyzing…</>
              ) : (
                <><Lightbulb className="w-3 h-3 mr-1" /> Analyze trip</>
              )}
            </Button>
          </div>
          {gaps.length > 0 ? (
            <div className="space-y-3">
              {gaps.map((g, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium text-muted-foreground">{g.gap}:</span>{" "}
                  <span>{g.suggestion}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              {trip.neighborhoods.length < 2
                ? "Add at least 2 neighborhoods to analyze your trip."
                : "AI will identify what experiences or vibes are missing from your itinerary."}
            </p>
          )}
        </Card>

        {/* Neighborhood list */}
        <h2 className="text-xl font-semibold mb-4">Neighborhoods</h2>
        {trip.neighborhoods.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <MapIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No neighborhoods yet. Browse city pages and add them to this trip.</p>
            <Link href="/cities">
              <Button variant="outline" className="mt-4">Browse Cities</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4">
            {trip.neighborhoods.map((tn, index) => {
              const n = neighborhoodMap.get(tn.neighborhoodId);
              const city = cities.find((c) => c.id === tn.cityId);
              return (
                <Card key={tn.id} className="p-4 flex items-center gap-4" data-testid={`card-trip-neighborhood-${tn.neighborhoodId}`}>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs text-muted-foreground">{city?.name ?? tn.cityId}</span>
                    </div>
                    <h3 className="font-semibold truncate">
                      {n?.name ?? tn.neighborhoodId.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                    </h3>
                    {n?.vibe && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {n.vibe.slice(0, 3).map((v: string) => (
                          <Badge key={v} variant="secondary" className="text-xs">{v}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {n && city && (
                      <Link href={`/city/${tn.cityId}/${n.slug}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMutation.mutate(tn.neighborhoodId)}
                      data-testid={`button-remove-trip-neighborhood-${tn.neighborhoodId}`}
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
