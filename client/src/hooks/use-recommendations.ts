import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { QuestionnaireInput, Recommendation, Hotel } from "@shared/schema";

export function useRecommendations(onSuccess?: (data: Recommendation[]) => void) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [hotels, setHotels] = useState<Record<string, Hotel[]>>({});

  const mutation = useMutation({
    mutationFn: async (input: QuestionnaireInput) => {
      const res = await apiRequest("POST", "/api/recommendations", input);
      return res.json() as Promise<Recommendation[]>;
    },
    onSuccess: async (data) => {
      setRecommendations(data);
      onSuccess?.(data);
      const entries = await Promise.all(
        data.map(async (rec) => {
          try {
            const res = await fetch(`/api/neighborhoods/${rec.neighborhood.id}/hotels`);
            if (res.ok) return [rec.neighborhood.id, await res.json()] as const;
          } catch (e) {
            console.error("Failed to fetch hotels", e);
          }
          return null;
        })
      );
      setHotels(Object.fromEntries(entries.filter(Boolean) as [string, Hotel[]][]));
    },
  });

  const reset = () => {
    setRecommendations([]);
    setHotels({});
  };

  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
    recommendations,
    hotels,
    reset,
  };
}
