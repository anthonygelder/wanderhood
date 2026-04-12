import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ScoreBar } from "@/components/score-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, ArrowRight } from "lucide-react";
import type { City, Neighborhood, TripPurposeOption } from "@shared/schema";

interface TopResult {
  neighborhood: Neighborhood;
  city: City;
  score: number;
}

const PURPOSE_MAP: Record<string, { purpose: TripPurposeOption; label: string; headline: string; description: string; emoji: string }> = {
  "remote-work": {
    purpose: "remote_work",
    label: "Remote Work",
    headline: "Best Neighborhoods for Remote Workers",
    description: "The top walkable, café-dense neighborhoods across 65 cities — ranked for digital nomads and remote workers.",
    emoji: "💻",
  },
  "couples": {
    purpose: "couples",
    label: "Couples",
    headline: "Best Neighborhoods for Couples",
    description: "Romantic, walkable, and full of great restaurants — the world's best neighborhoods for a couples trip.",
    emoji: "💑",
  },
  "families": {
    purpose: "family",
    label: "Families",
    headline: "Best Family-Friendly Neighborhoods Worldwide",
    description: "Safe, accessible, and welcoming to all ages — top neighborhoods for family travel around the world.",
    emoji: "👨‍👩‍👧",
  },
  "solo": {
    purpose: "solo",
    label: "Solo Travelers",
    headline: "Best Neighborhoods for Solo Travel",
    description: "Safe, walkable, and full of local character — the best neighborhoods worldwide for solo explorers.",
    emoji: "🎒",
  },
  "foodie": {
    purpose: "foodie_trip",
    label: "Foodies",
    headline: "Best Neighborhoods for Food Lovers",
    description: "The highest-rated food and coffee scenes worldwide — neighborhoods every foodie should visit.",
    emoji: "🍜",
  },
  "friends": {
    purpose: "friends",
    label: "Friend Groups",
    headline: "Best Neighborhoods for Groups of Friends",
    description: "Great nightlife, food, and transit — the world's top neighborhoods for a group trip.",
    emoji: "🎉",
  },
};

export default function TripTypePage() {
  const { purpose: purposeSlug } = useParams<{ purpose: string }>();
  const config = PURPOSE_MAP[purposeSlug ?? ""];

  const { data: cities = [] } = useQuery<City[]>({ queryKey: ["/api/cities"] });

  const { data: results = [], isLoading } = useQuery<TopResult[]>({
    queryKey: ["/api/top", config?.purpose],
    queryFn: async () => {
      const res = await fetch(`/api/top/${config!.purpose}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!config,
  });

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Page not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{config.headline} | Wanderhood</title>
        <meta name="description" content={config.description} />
        <link rel="canonical" href={`https://wanderhood.com/neighborhoods/${purposeSlug}`} />
        <meta property="og:title" content={`${config.headline} | Wanderhood`} />
        <meta property="og:description" content={config.description} />
        <meta property="og:type" content="website" />
        {results.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": config.headline,
              "description": config.description,
              "url": `https://wanderhood.com/neighborhoods/${purposeSlug}`,
              "numberOfItems": results.length,
              "itemListElement": results.slice(0, 10).map((r, i) => ({
                "@type": "ListItem",
                "position": i + 1,
                "item": {
                  "@type": "TouristAttraction",
                  "name": `${r.neighborhood.name}, ${r.city.name}`,
                  "description": r.neighborhood.description,
                  "url": `https://wanderhood.com/city/${r.city.slug}/${r.neighborhood.slug}`,
                  "image": r.neighborhood.heroImage,
                },
              })),
            })}
          </script>
        )}
      </Helmet>

      <Header cities={cities} />

      {/* Hero */}
      <div className="bg-muted/40 border-b">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="text-5xl mb-4">{config.emoji}</div>
          <Badge variant="secondary" className="mb-4">{config.label}</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{config.headline}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{config.description}</p>
        </div>
      </div>

      {/* Other guide links */}
      <div className="border-b bg-background">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs text-muted-foreground shrink-0 mr-1">Browse by:</span>
          {Object.entries(PURPOSE_MAP).map(([slug, cfg]) => (
            <Link key={slug} href={`/neighborhoods/${slug}`}>
              <Badge
                variant={slug === purposeSlug ? "default" : "outline"}
                className="cursor-pointer shrink-0 whitespace-nowrap"
              >
                {cfg.emoji} {cfg.label}
              </Badge>
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {results.map((result) => (
              <Card key={`${result.city.id}-${result.neighborhood.id}`} className="overflow-hidden group">
                <div
                  className="h-40 bg-cover bg-center"
                  style={{ backgroundImage: `url(${result.neighborhood.heroImage})` }}
                />
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                    <MapPin className="w-3 h-3" />
                    {result.city.name}, {result.city.country}
                  </div>
                  <h2 className="font-semibold text-base mb-2">{result.neighborhood.name}</h2>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {result.neighborhood.vibe.slice(0, 3).map((v) => (
                      <Badge key={v} variant="secondary" className="text-xs">{v}</Badge>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <ScoreBar label="Walkability" score={result.neighborhood.scores.walkability} size="sm" />
                    <ScoreBar label="Transit" score={result.neighborhood.scores.transitConnectivity} size="sm" />
                  </div>
                  <Link href={`/city/${result.city.slug}/${result.neighborhood.slug}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Explore <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
