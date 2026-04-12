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
import { Sparkles, MapPin, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { City, Neighborhood, Recommendation } from "@shared/schema";

const GUIDES = {
  "digital-nomad": {
    label: "Digital Nomad",
    headline: (city: string) => `Best Neighborhoods in ${city} for Remote Work`,
    description: (city: string) =>
      `The best ${city} neighborhoods for digital nomads — ranked by café density, walkability, and Wi-Fi-friendly infrastructure.`,
    emoji: "💻",
    input: { budget: "moderate" as const, vibes: ["quiet" as const], travelStyle: "mixed" as const, tripPurpose: "remote_work" as const },
  },
  "couples": {
    label: "Couples",
    headline: (city: string) => `Most Romantic Neighborhoods in ${city}`,
    description: (city: string) =>
      `Romantic ${city} neighborhoods for couples — great food scenes, safe streets, and memorable atmosphere.`,
    emoji: "💑",
    input: { budget: "moderate" as const, vibes: ["waterfront" as const], travelStyle: "walk" as const, tripPurpose: "couples" as const },
  },
  "family": {
    label: "Families",
    headline: (city: string) => `Best Family-Friendly Neighborhoods in ${city}`,
    description: (city: string) =>
      `Safe, walkable, and welcoming — the top ${city} neighborhoods for traveling with kids.`,
    emoji: "👨‍👩‍👧",
    input: { budget: "moderate" as const, vibes: ["family" as const], travelStyle: "mixed" as const, tripPurpose: "family" as const },
  },
  "foodie": {
    label: "Foodies",
    headline: (city: string) => `Best Neighborhoods in ${city} for Food Lovers`,
    description: (city: string) =>
      `Eat your way through ${city} — neighborhoods ranked by their food and coffee scene.`,
    emoji: "🍜",
    input: { budget: "moderate" as const, vibes: ["foodie" as const], travelStyle: "walk" as const, tripPurpose: "foodie_trip" as const },
  },
  "solo": {
    label: "Solo Travelers",
    headline: (city: string) => `Best ${city} Neighborhoods for Solo Travel`,
    description: (city: string) =>
      `Solo travel in ${city}: safe neighborhoods with strong local character and easy transit.`,
    emoji: "🎒",
    input: { budget: "budget" as const, vibes: ["hip" as const], travelStyle: "walk" as const, tripPurpose: "solo" as const },
  },
  "friends": {
    label: "Friend Groups",
    headline: (city: string) => `Best ${city} Neighborhoods for a Trip with Friends`,
    description: (city: string) =>
      `Nightlife, good food, and easy transit — the best ${city} neighborhoods for a group trip.`,
    emoji: "🎉",
    input: { budget: "moderate" as const, vibes: ["party" as const], travelStyle: "transit" as const, tripPurpose: "friends" as const },
  },
} as const;

type GuideType = keyof typeof GUIDES;

export default function CityGuidePage() {
  const { citySlug, type } = useParams<{ citySlug: string; type: string }>();
  const guide = GUIDES[type as GuideType];

  const { data: cities = [] } = useQuery<City[]>({ queryKey: ["/api/cities"] });

  const { data: city } = useQuery<City>({
    queryKey: ["/api/cities", citySlug],
    queryFn: async () => {
      const res = await fetch(`/api/cities/${citySlug}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!citySlug,
  });

  const { data: recommendations = [], isLoading } = useQuery<Recommendation[]>({
    queryKey: ["/api/recommendations", citySlug, type],
    queryFn: async () => {
      if (!city || !guide) return [];
      const res = await apiRequest("POST", "/api/recommendations", { cityId: city.id, ...guide.input });
      return res.json();
    },
    enabled: !!city && !!guide,
  });

  if (!guide) {
    return <div className="min-h-screen flex items-center justify-center"><p>Guide type not found.</p></div>;
  }

  const title = city ? guide.headline(city.name) : "Loading…";
  const desc = city ? guide.description(city.name) : "";

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title} | Wanderhood</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={`https://wanderhood.com/guides/${citySlug}/${type}`} />
        <meta property="og:title" content={`${title} | Wanderhood`} />
        <meta property="og:description" content={desc} />
        <meta property="og:type" content="article" />
        {city && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": title,
              "description": desc,
              "url": `https://wanderhood.com/guides/${citySlug}/${type}`,
              "about": {
                "@type": "City",
                "name": city.name,
                "url": `https://wanderhood.com/city/${citySlug}`,
              },
            })}
          </script>
        )}
      </Helmet>

      <Header cities={cities} />

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-8">
          <Link href="/cities"><a className="hover:text-foreground">Cities</a></Link>
          <span>/</span>
          {city && <Link href={`/city/${citySlug}`}><a className="hover:text-foreground">{city.name}</a></Link>}
          {city && <span>/</span>}
          <span className="text-foreground">{guide.label} Guide</span>
        </nav>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">{guide.emoji}</span>
            <Badge variant="secondary">{guide.label}</Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4">{city ? guide.headline(city.name) : <Skeleton className="h-10 w-80" />}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {city ? guide.description(city.name) : <Skeleton className="h-6 w-full" />}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-6">
            {recommendations.map((rec) => (
              <Card key={rec.neighborhood.id} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div
                    className="h-48 sm:h-auto sm:w-48 flex-shrink-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${rec.neighborhood.heroImage})` }}
                  />
                  <div className="p-6 flex-1">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {city?.name}
                        </div>
                        <h2 className="text-xl font-semibold">{rec.neighborhood.name}</h2>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-primary/20 shrink-0">
                        {rec.matchScore}% match
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {rec.neighborhood.vibe.map((v) => (
                        <Badge key={v} variant="secondary" className="text-xs">{v}</Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {rec.neighborhood.aiDescription || rec.neighborhood.description}
                    </p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <ScoreBar label="Walkability" score={rec.neighborhood.scores.walkability} size="sm" />
                      <ScoreBar label="Transit" score={rec.neighborhood.scores.transitConnectivity} size="sm" />
                    </div>
                    {rec.matchReasons.length > 0 && (
                      <p className="text-xs text-muted-foreground mb-4">
                        <Sparkles className="w-3 h-3 inline mr-1" />
                        {rec.matchReasons[0]}
                      </p>
                    )}
                    <Link href={`/city/${citySlug}/${rec.neighborhood.slug}`}>
                      <Button size="sm" variant="outline">
                        Explore neighborhood <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {city && (
          <div className="mt-12 p-6 bg-muted rounded-xl text-center">
            <h3 className="font-semibold text-lg mb-2">Get personalized recommendations for {city.name}</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Tell us your budget, travel style, and preferred vibes — we'll match you to the perfect neighborhood.
            </p>
            <Link href={`/city/${citySlug}`}>
              <Button>
                <Sparkles className="w-4 h-4 mr-2" />
                Start Questionnaire
              </Button>
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
