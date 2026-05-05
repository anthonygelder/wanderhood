import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { QuestionnaireInput, Recommendation, Hotel } from "@shared/schema";

export function useRecommendations(onSuccess?: (data: Recommendation[]) => void) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [hotels, setHotels] = useState<Record<string, Hotel[]>>({});
  const [lastInput, setLastInput] = useState<QuestionnaireInput | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [isExplaining, setIsExplaining] = useState(false);
  const [explainLimitReached, setExplainLimitReached] = useState(false);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (input: QuestionnaireInput) => {
      setLastInput(input);
      const res = await apiRequest("POST", "/api/recommendations", input);
      return res.json() as Promise<Recommendation[]>;
    },
    onSuccess: async (data, input) => {
      setRecommendations(data);
      onSuccess?.(data);

      const [hotelEntries] = await Promise.all([
        Promise.all(
          data.map(async (rec) => {
            try {
              const res = await fetch(`/api/neighborhoods/${rec.neighborhood.id}/hotels`);
              if (res.ok) return [rec.neighborhood.id, await res.json()] as const;
            } catch (e) {
              console.error("Failed to fetch hotels", e);
            }
            return null;
          })
        ),
        (async () => {
          setIsExplaining(true);
          setExplainLimitReached(false);
          try {
            const res = await fetch("/api/ai/explain", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ recommendations: data, input }),
            });
            if (res.status === 429) {
              setExplainLimitReached(true);
            } else if (res.ok) {
              const { explanations: exp } = await res.json();
              setExplanations(exp || {});
            }
          } catch (e) {
            console.error("Failed to fetch AI explanations", e);
          } finally {
            setIsExplaining(false);
          }
        })(),
      ]);

      setHotels(Object.fromEntries(hotelEntries.filter(Boolean) as [string, Hotel[]][]));
    },
    onError: (error: Error) => {
      const is429 = error.message.startsWith("429");
      toast({
        title: is429 ? "Too many requests" : "Something went wrong",
        description: is429
          ? "You've made too many requests. Please wait a few minutes and try again."
          : "Failed to get recommendations. Please try again.",
        variant: "destructive",
      });
    },
  });

  const reset = () => {
    setRecommendations([]);
    setHotels({});
    setLastInput(null);
    setExplanations({});
    setExplainLimitReached(false);
  };

  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
    recommendations,
    hotels,
    lastInput,
    explanations,
    isExplaining,
    explainLimitReached,
    reset,
  };
}
