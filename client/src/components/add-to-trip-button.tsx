import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Map, Plus, Check } from "lucide-react";
import type { TripWithNeighborhoods } from "@shared/schema";

interface AddToTripButtonProps {
  neighborhoodId: string;
  cityId: string;
}

export function AddToTripButton({ neighborhoodId, cityId }: AddToTripButtonProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creatingNew, setCreatingNew] = useState(false);

  const { data: trips = [], isLoading } = useQuery<TripWithNeighborhoods[]>({
    queryKey: ["/api/trips"],
    queryFn: async () => {
      const res = await fetch("/api/trips", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAuthenticated && open,
  });

  const addMutation = useMutation({
    mutationFn: async (tripId: number) => {
      const res = await apiRequest("POST", `/api/trips/${tripId}/neighborhoods`, { neighborhoodId, cityId });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.error === "Already in trip") throw new Error("already");
        throw new Error("failed");
      }
    },
    onSuccess: (_, tripId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      toast({ title: "Added to trip" });
      setOpen(false);
    },
    onError: (err: Error) => {
      if (err.message === "already") {
        toast({ title: "Already in trip", description: "This neighborhood is already in that trip." });
      } else {
        toast({ title: "Error", description: "Failed to add to trip.", variant: "destructive" });
      }
    },
  });

  const createAndAddMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/trips", { name });
      const trip = await res.json();
      await apiRequest("POST", `/api/trips/${trip.id}/neighborhoods`, { neighborhoodId, cityId });
      return trip;
    },
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      toast({ title: "Added to new trip", description: `Created "${trip.name}"` });
      setOpen(false);
      setNewName("");
      setCreatingNew(false);
    },
    onError: () => toast({ title: "Error", description: "Failed to create trip.", variant: "destructive" }),
  });

  if (!isAuthenticated) {
    return (
      <Button variant="outline" size="sm" onClick={() => { window.location.href = "/api/login"; }}>
        <Map className="w-4 h-4 mr-2" /> Add to Trip
      </Button>
    );
  }

  const neighborhoodTripIds = new Set(
    trips.filter((t) => t.neighborhoods.some((n) => n.neighborhoodId === neighborhoodId)).map((t) => t.id)
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-add-to-trip">
          <Map className="w-4 h-4 mr-2" /> Add to Trip
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <p className="text-sm font-medium mb-3">Add to a trip</p>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading trips…</p>
        ) : trips.length === 0 && !creatingNew ? (
          <p className="text-sm text-muted-foreground mb-3">No trips yet.</p>
        ) : (
          <div className="space-y-1 mb-3 max-h-48 overflow-y-auto">
            {trips.map((trip) => {
              const alreadyIn = neighborhoodTripIds.has(trip.id);
              return (
                <button
                  key={trip.id}
                  onClick={() => !alreadyIn && addMutation.mutate(trip.id)}
                  disabled={alreadyIn || addMutation.isPending}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between transition-colors ${
                    alreadyIn
                      ? "text-muted-foreground cursor-default"
                      : "hover:bg-accent cursor-pointer"
                  }`}
                >
                  <span className="truncate">{trip.name}</span>
                  {alreadyIn && <Check className="w-3 h-3 flex-shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>
        )}

        {creatingNew ? (
          <div className="flex gap-2">
            <Input
              autoFocus
              placeholder="Trip name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) createAndAddMutation.mutate(newName.trim());
                if (e.key === "Escape") { setCreatingNew(false); setNewName(""); }
              }}
              className="h-8 text-sm"
            />
            <Button
              size="sm"
              className="h-8"
              onClick={() => createAndAddMutation.mutate(newName.trim())}
              disabled={!newName.trim() || createAndAddMutation.isPending}
            >
              Add
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="w-full" onClick={() => setCreatingNew(true)}>
            <Plus className="w-3 h-3 mr-1" /> New trip
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
