import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Review } from "@shared/schema";

interface ReviewSectionProps {
  neighborhoodId: string;
  cityId: string;
  neighborhoodName: string;
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="focus:outline-none"
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              n <= (hover || value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-4 h-4 ${n <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
        />
      ))}
    </div>
  );
}

export function ReviewSection({ neighborhoodId, cityId, neighborhoodName }: ReviewSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [tip, setTip] = useState("");

  const { data: reviewList = [] } = useQuery<Review[]>({
    queryKey: ["/api/neighborhoods", neighborhoodId, "reviews"],
    queryFn: async () => {
      const res = await fetch(`/api/neighborhoods/${neighborhoodId}/reviews`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const userReview = reviewList.find((r) => r.userId === user?.id);

  const submitMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/neighborhoods/${neighborhoodId}/reviews`, {
        cityId, rating, tip: tip.trim() || null,
      });
    },
    onSuccess: () => {
      toast({ title: "Review submitted", description: "Thanks for sharing your experience!" });
      setRating(0);
      setTip("");
      qc.invalidateQueries({ queryKey: ["/api/neighborhoods", neighborhoodId, "reviews"] });
    },
    onError: (err: Error) => {
      const msg = err.message.includes("409") ? "You've already reviewed this neighborhood." : "Failed to submit review.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (reviewId: number) => {
      await apiRequest("DELETE", `/api/reviews/${reviewId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/neighborhoods", neighborhoodId, "reviews"] });
    },
  });

  const avgRating = reviewList.length
    ? reviewList.reduce((s, r) => s + r.rating, 0) / reviewList.length
    : null;

  return (
    <section>
      <div className="flex items-baseline gap-3 mb-6">
        <h2 className="text-2xl font-semibold">Traveler Reviews</h2>
        {avgRating !== null && (
          <span className="text-muted-foreground text-sm">
            {avgRating.toFixed(1)} avg · {reviewList.length} review{reviewList.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Submit form */}
      {isAuthenticated && !userReview && (
        <div className="border rounded-lg p-5 mb-6 space-y-4">
          <p className="text-sm font-medium">Share your experience in {neighborhoodName}</p>
          <StarInput value={rating} onChange={setRating} />
          <Textarea
            placeholder="One-line tip for future visitors… (optional)"
            value={tip}
            onChange={(e) => setTip(e.target.value.slice(0, 280))}
            className="resize-none"
            rows={2}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{tip.length}/280</span>
            <Button
              size="sm"
              disabled={rating === 0 || submitMutation.isPending}
              onClick={() => submitMutation.mutate()}
            >
              Submit Review
            </Button>
          </div>
        </div>
      )}

      {!isAuthenticated && (
        <p className="text-sm text-muted-foreground mb-6">
          <a href="/api/auth/google" className="underline underline-offset-4 hover:text-foreground">Sign in</a> to leave a review.
        </p>
      )}

      {/* Review list */}
      {reviewList.length === 0 ? (
        <p className="text-muted-foreground text-sm">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {reviewList.map((review) => (
            <div key={review.id} className="flex gap-3">
              <div className="flex-1 border rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <StarDisplay rating={review.rating} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                </div>
                {review.tip && (
                  <p className="text-sm text-muted-foreground mt-1">{review.tip}</p>
                )}
              </div>
              {review.userId === user?.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 self-start mt-1"
                  onClick={() => deleteMutation.mutate(review.id)}
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
