import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreBar } from "@/components/score-bar";
import { MapPin, ExternalLink, Footprints, Train, Shield, Utensils, Music, Users, Hotel, Sparkles } from "lucide-react";
import type { Recommendation } from "@shared/schema";

interface NeighborhoodCardProps {
  recommendation: Recommendation;
  onViewHotels: (neighborhoodId: string) => void;
  onExploreMap: (neighborhoodId: string) => void;
  matchExplanation?: string;
  isExplaining?: boolean;
  explainLimitReached?: boolean;
}

export function NeighborhoodCard({ recommendation, onViewHotels, onExploreMap, matchExplanation, isExplaining, explainLimitReached }: NeighborhoodCardProps) {
  const { neighborhood, matchScore, rank, matchReasons } = recommendation;
  const { scores } = neighborhood;

  const rankBadgeColors: Record<number, string> = {
    1: "bg-chart-5 text-black",
    2: "bg-muted text-foreground",
    3: "bg-chart-2 text-white",
  };

  return (
    <Card
      className="overflow-visible group"
      data-testid={`card-neighborhood-${neighborhood.slug}`}
    >
      <div className="relative">
        <div
          className="aspect-video bg-cover bg-center rounded-t-md"
          style={{ backgroundImage: `url(${neighborhood.heroImage})` }}
        />
        <Badge
          className={`absolute top-3 left-3 ${rankBadgeColors[rank] || "bg-primary"}`}
          data-testid={`badge-rank-${rank}`}
        >
          #{rank} Match
        </Badge>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-serif font-semibold" data-testid={`text-neighborhood-name-${neighborhood.slug}`}>
              {neighborhood.name}
            </h3>
            <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
              <MapPin className="w-3 h-3" />
              <span>{neighborhood.highlights[0]}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-4xl font-bold text-primary" data-testid={`text-match-score-${neighborhood.slug}`}>
              {matchScore}%
            </span>
            <p className="text-xs text-muted-foreground">Match</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {neighborhood.vibe.slice(0, 3).map((v) => (
            <Badge key={v} variant="secondary" size="sm">
              {v}
            </Badge>
          ))}
        </div>

        {neighborhood.transitHubs.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {neighborhood.transitHubs.slice(0, 3).map((hub) => (
              <Badge key={hub} variant="outline" size="sm" className="text-xs">
                <Train className="w-3 h-3 mr-1" />
                {hub}
              </Badge>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <ScoreBar label="Walkability" score={scores.walkability} icon={<Footprints className="w-4 h-4" />} size="sm" />
          <ScoreBar label="Transit" score={scores.transitConnectivity} icon={<Train className="w-4 h-4" />} size="sm" />
          <ScoreBar label="Safety" score={scores.safety} icon={<Shield className="w-4 h-4" />} size="sm" />
          <ScoreBar label="Food & Coffee" score={scores.foodCoffeeDensity} icon={<Utensils className="w-4 h-4" />} size="sm" />
          <ScoreBar label="Nightlife" score={scores.nightlife} icon={<Music className="w-4 h-4" />} size="sm" />
          <ScoreBar label="Local Feel" score={scores.localVibes} icon={<Users className="w-4 h-4" />} size="sm" />
        </div>

        {neighborhood.aiDescription && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {neighborhood.aiDescription}
          </p>
        )}

        <div className="bg-muted/50 rounded-md p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3 h-3 text-primary" />
            <p className="text-xs font-medium text-muted-foreground">Why this matches you</p>
          </div>
          {isExplaining ? (
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ) : matchExplanation ? (
            <p className="text-sm leading-relaxed">{matchExplanation}</p>
          ) : explainLimitReached ? (
            <p className="text-xs text-muted-foreground">
              <a href="/api/auth/google" className="text-primary underline underline-offset-2">Sign in</a> to unlock personalized AI insights.
            </p>
          ) : matchReasons.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {matchReasons.slice(0, 4).map((reason, i) => (
                <Badge key={i} variant="secondary" size="sm" className="text-xs">
                  {reason}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={() => onViewHotels(neighborhood.id)}
            className="w-full"
            data-testid={`button-find-hotels-${neighborhood.slug}`}
          >
            <Hotel className="w-4 h-4 mr-2" />
            Find Hotels
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            onClick={() => onExploreMap(neighborhood.id)}
            className="w-full"
            data-testid={`button-explore-map-${neighborhood.slug}`}
          >
            Explore on Map
          </Button>
        </div>
      </div>
    </Card>
  );
}
