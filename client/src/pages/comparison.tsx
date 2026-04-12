import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ScoreBar } from "@/components/score-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Sparkles, ArrowRight } from "lucide-react";
import type { City, Neighborhood } from "@shared/schema";

interface ComparisonData {
  city: City;
  n1: Neighborhood;
  n2: Neighborhood;
}

const SCORE_LABELS = [
  { key: "walkability", label: "Walkability" },
  { key: "transitConnectivity", label: "Transit" },
  { key: "safety", label: "Safety" },
  { key: "foodCoffeeDensity", label: "Food & Coffee" },
  { key: "nightlife", label: "Nightlife" },
  { key: "touristFriendliness", label: "Tourist-Friendly" },
  { key: "localVibes", label: "Local Vibes" },
] as const;

const PRICE_LABELS: Record<string, string> = {
  budget: "Budget",
  moderate: "Mid-range",
  upscale: "Upscale",
  luxury: "Luxury",
};

export default function ComparisonPage() {
  const { citySlug, n1Slug, n2Slug } = useParams<{ citySlug: string; n1Slug: string; n2Slug: string }>();

  const { data: cities = [] } = useQuery<City[]>({ queryKey: ["/api/cities"] });

  const { data, isLoading } = useQuery<ComparisonData>({
    queryKey: ["/api/compare", citySlug, n1Slug, n2Slug],
    queryFn: async () => {
      const res = await fetch(`/api/compare/${citySlug}/${n1Slug}/${n2Slug}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!citySlug && !!n1Slug && !!n2Slug,
  });

  const { city, n1, n2 } = data ?? {};

  const title = n1 && n2 && city
    ? `${n1.name} vs ${n2.name}: Which ${city.name} Neighborhood?`
    : "Neighborhood Comparison";

  const description = n1 && n2 && city
    ? `Compare ${n1.name} and ${n2.name} in ${city.name} side by side — walkability, transit, safety, food, nightlife, and more.`
    : "";

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title} | Wanderhood</title>
        {description && <meta name="description" content={description} />}
        <link rel="canonical" href={`https://wanderhood.com/compare/${citySlug}/${n1Slug}/${n2Slug}`} />
        <meta property="og:title" content={`${title} | Wanderhood`} />
        {description && <meta property="og:description" content={description} />}
        {n1 && n2 && city && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": title,
              "description": description,
              "url": `https://wanderhood.com/compare/${citySlug}/${n1Slug}/${n2Slug}`,
              "itemListElement": [n1, n2].map((n, i) => ({
                "@type": "ListItem",
                "position": i + 1,
                "item": {
                  "@type": "TouristAttraction",
                  "name": n.name,
                  "description": n.description,
                  "url": `https://wanderhood.com/city/${citySlug}/${n.slug}`,
                  "image": n.heroImage,
                  "containedInPlace": { "@type": "City", "name": city.name },
                },
              })),
            })}
          </script>
        )}
      </Helmet>

      <Header cities={cities} />

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-8">
          <Link href="/cities"><a className="hover:text-foreground">Cities</a></Link>
          <span>/</span>
          {city && <Link href={`/city/${citySlug}`}><a className="hover:text-foreground">{city.name}</a></Link>}
          {city && <span>/</span>}
          <span className="text-foreground">Compare</span>
        </nav>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <div className="grid grid-cols-2 gap-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        ) : n1 && n2 && city ? (
          <>
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mb-3">
                <MapPin className="w-4 h-4" />
                {city.name}, {city.country}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">
                {n1.name} <span className="text-muted-foreground">vs</span> {n2.name}
              </h1>
            </div>

            {/* Hero images */}
            <div className="grid grid-cols-2 gap-4 mb-10">
              {[n1, n2].map((n) => (
                <div key={n.id} className="space-y-3">
                  <div
                    className="h-48 rounded-xl bg-cover bg-center"
                    style={{ backgroundImage: `url(${n.heroImage})` }}
                  />
                  <div>
                    <h2 className="font-semibold text-lg">{n.name}</h2>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {n.vibe.slice(0, 3).map((v) => (
                        <Badge key={v} variant="secondary" className="text-xs">{v}</Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{PRICE_LABELS[n.priceLevel]}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Score comparison */}
            <div className="border rounded-xl overflow-hidden mb-8">
              <div className="grid grid-cols-[1fr_auto_1fr] bg-muted/50 border-b px-6 py-3 text-sm font-medium text-muted-foreground">
                <span>{n1.name}</span>
                <span className="text-center w-32">Metric</span>
                <span className="text-right">{n2.name}</span>
              </div>
              {SCORE_LABELS.map(({ key, label }) => {
                const s1 = n1.scores[key];
                const s2 = n2.scores[key];
                const winner1 = s1 > s2;
                const winner2 = s2 > s1;
                return (
                  <div key={key} className="grid grid-cols-[1fr_auto_1fr] items-center px-6 py-4 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold ${winner1 ? "text-green-600" : "text-muted-foreground"}`}>{s1}</span>
                      <div className="flex-1 max-w-[120px]">
                        <ScoreBar label="" score={s1} size="sm" />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground text-center w-32 px-2">{label}</span>
                    <div className="flex items-center gap-3 justify-end">
                      <div className="flex-1 max-w-[120px]">
                        <ScoreBar label="" score={s2} size="sm" />
                      </div>
                      <span className={`text-lg font-bold ${winner2 ? "text-green-600" : "text-muted-foreground"}`}>{s2}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Description comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {[n1, n2].map((n) => (
                <div key={n.id} className="space-y-3">
                  <h3 className="font-semibold">{n.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {n.aiDescription || n.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Highlights:</strong> {n.highlights.slice(0, 3).join(", ")}
                  </p>
                  <Link href={`/city/${citySlug}/${n.slug}`}>
                    <Button variant="outline" size="sm">
                      Explore {n.name} <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="p-6 bg-muted rounded-xl text-center">
              <h3 className="font-semibold text-lg mb-2">Not sure which is right for you?</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Answer a few questions about your travel style and we'll match you to the best neighborhood in {city.name}.
              </p>
              <Link href={`/city/${citySlug}`}>
                <Button>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Take the Quiz
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">Neighborhoods not found.</p>
        )}
      </div>

      <Footer />
    </div>
  );
}
