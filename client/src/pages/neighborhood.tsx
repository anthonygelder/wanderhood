import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ScoreBar } from "@/components/score-bar";
import { PhotoGallery } from "@/components/photo-gallery";
import { ReviewSection } from "@/components/review-section";
import { AirbnbCard } from "@/components/airbnb-card";
import { TravelInsuranceCard } from "@/components/travel-insurance-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin, Train, Footprints, Shield, Utensils, Music, Users,
  Star, ExternalLink, Sparkles, ChevronRight,
} from "lucide-react";
import { trackClick } from "@/lib/tracking";
import type { City, Neighborhood, Hotel } from "@shared/schema";

const PRICE_LABELS: Record<string, string> = {
  budget: "Budget-friendly",
  moderate: "Mid-range",
  upscale: "Upscale",
  luxury: "Luxury",
};

export default function NeighborhoodPage() {
  const { slug: citySlug, neighborhoodSlug } = useParams<{ slug: string; neighborhoodSlug: string }>();

  const { data: cities = [] } = useQuery<City[]>({ queryKey: ["/api/cities"] });

  const { data: city } = useQuery<City>({
    queryKey: ["/api/cities", citySlug],
    queryFn: async () => {
      const res = await fetch(`/api/cities/${citySlug}`);
      if (!res.ok) throw new Error("City not found");
      return res.json();
    },
  });

  const { data: neighborhood, isLoading } = useQuery<Neighborhood>({
    queryKey: ["/api/cities", citySlug, "neighborhoods", neighborhoodSlug],
    queryFn: async () => {
      const res = await fetch(`/api/cities/${citySlug}/neighborhoods/${neighborhoodSlug}`);
      if (!res.ok) throw new Error("Neighborhood not found");
      return res.json();
    },
    enabled: !!citySlug && !!neighborhoodSlug,
  });

  const { data: hotels = [] } = useQuery<Hotel[]>({
    queryKey: ["/api/neighborhoods", neighborhood?.id, "hotels"],
    queryFn: async () => {
      const res = await fetch(`/api/neighborhoods/${neighborhood!.id}/hotels`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!neighborhood?.id,
  });

  if (isLoading || !neighborhood || !city) {
    return (
      <div className="min-h-screen bg-background">
        <Header cities={cities} />
        <Skeleton className="h-[50vh] w-full" />
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Footer />
      </div>
    );
  }

  const { scores } = neighborhood;
  const topScore = Math.max(
    scores.walkability, scores.transitConnectivity, scores.safety,
    scores.foodCoffeeDensity, scores.nightlife, scores.localVibes
  );

  const quickStats = [
    { label: "Walkability", score: scores.walkability, icon: <Footprints className="w-5 h-5" /> },
    { label: "Transit", score: scores.transitConnectivity, icon: <Train className="w-5 h-5" /> },
    { label: "Safety", score: scores.safety, icon: <Shield className="w-5 h-5" /> },
    { label: "Food & Coffee", score: scores.foodCoffeeDensity, icon: <Utensils className="w-5 h-5" /> },
  ];

  const getScoreColor = (s: number) =>
    s >= 85 ? "text-green-600" : s >= 70 ? "text-blue-600" : s >= 55 ? "text-amber-600" : "text-red-500";

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{neighborhood.name}, {city.name} — Where to Stay | Wanderhood</title>
        <meta
          name="description"
          content={`${neighborhood.name} is a ${neighborhood.vibe.join(", ")} neighborhood in ${city.name}. Walkability ${scores.walkability}/100 · Transit ${scores.transitConnectivity}/100. Find hotels and things to do.`}
        />
        <link rel="canonical" href={`https://wanderhood.com/city/${city.slug}/${neighborhood.slug}`} />
        <meta property="og:title" content={`${neighborhood.name}, ${city.name} — Where to Stay | Wanderhood`} />
        <meta property="og:description" content={neighborhood.description} />
        <meta property="og:image" content={neighborhood.heroImage} />
        <meta property="og:url" content={`https://wanderhood.com/city/${city.slug}/${neighborhood.slug}`} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${neighborhood.name}, ${city.name} — Where to Stay | Wanderhood`} />
        <meta name="twitter:description" content={neighborhood.description} />
        <meta name="twitter:image" content={neighborhood.heroImage} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TouristAttraction",
            "name": `${neighborhood.name} — ${city.name}`,
            "description": neighborhood.aiDescription || neighborhood.description,
            "url": `https://wanderhood.com/city/${city.slug}/${neighborhood.slug}`,
            "image": [neighborhood.heroImage, ...(neighborhood.photos ?? [])],
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": neighborhood.coordinates.lat,
              "longitude": neighborhood.coordinates.lng,
            },
            "containedInPlace": {
              "@type": "City",
              "name": city.name,
              "url": `https://wanderhood.com/city/${city.slug}`,
            },
            "touristType": neighborhood.vibe,
            "amenityFeature": [
              { "@type": "LocationFeatureSpecification", "name": "Walkability", "value": scores.walkability },
              { "@type": "LocationFeatureSpecification", "name": "Transit Connectivity", "value": scores.transitConnectivity },
              { "@type": "LocationFeatureSpecification", "name": "Safety", "value": scores.safety },
            ],
          })}
        </script>
        {hotels.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": `Hotels in ${neighborhood.name}, ${city.name}`,
              "itemListElement": hotels.slice(0, 5).map((h, i) => ({
                "@type": "ListItem",
                "position": i + 1,
                "item": {
                  "@type": "LodgingBusiness",
                  "name": h.name,
                  "starRating": { "@type": "Rating", "ratingValue": h.starRating },
                  "aggregateRating": { "@type": "AggregateRating", "ratingValue": h.rating, "bestRating": 10 },
                  "priceRange": h.priceRange,
                  "url": h.affiliateUrl,
                },
              })),
            })}
          </script>
        )}
      </Helmet>

      <Header cities={cities} />

      {/* Hero */}
      <div className="relative h-[55vh] min-h-[380px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${neighborhood.heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 max-w-5xl mx-auto w-full left-0 right-0">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-white/60 text-sm mb-4">
            <Link href="/cities"><a className="hover:text-white transition-colors">Cities</a></Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/city/${city.slug}`}><a className="hover:text-white transition-colors">{city.name}</a></Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">{neighborhood.name}</span>
          </nav>

          <div className="flex flex-wrap gap-2 mb-3">
            {neighborhood.vibe.map((v) => (
              <Badge key={v} className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                {v}
              </Badge>
            ))}
            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
              {PRICE_LABELS[neighborhood.priceLevel]}
            </Badge>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">
            {neighborhood.name}
          </h1>
          <div className="flex items-center gap-2 text-white/70">
            <MapPin className="w-4 h-4" />
            <span>{city.name}, {city.country}</span>
          </div>
        </div>
      </div>

      {/* Photo gallery (only shown when photos data exists) */}
      {neighborhood.photos && neighborhood.photos.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 pt-8">
          <PhotoGallery photos={neighborhood.photos} neighborhoodName={neighborhood.name} />
        </div>
      )}

      {/* Quick score strip */}
      <div className="bg-card border-b">
        <div className="max-w-5xl mx-auto px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickStats.map(({ label, score, icon }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="text-muted-foreground">{icon}</div>
              <div>
                <div className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col md:grid md:grid-cols-3 gap-10">

          {/* Sidebar — first in DOM so it appears at top on mobile */}
          <div className="space-y-6 md:col-start-3 md:row-start-1">

            {/* CTA card */}
            <Card className="p-6 space-y-4 md:sticky md:top-6">
              <h3 className="font-semibold text-lg">Find your perfect stay</h3>
              <p className="text-sm text-muted-foreground">
                Answer a few questions and we'll match you with the best neighborhood in {city.name}.
              </p>
              <Link href={`/city/${city.slug}`}>
                <Button className="w-full" asChild>
                  <a>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start Questionnaire
                  </a>
                </Button>
              </Link>
              <Link href={`/city/${city.slug}`}>
                <a className="block text-center text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">
                  ← Back to {city.name} guide
                </a>
              </Link>
            </Card>

            {/* Price level */}
            <Card className="p-5">
              <h3 className="font-semibold mb-2">Price Level</h3>
              <Badge variant="secondary" className="text-sm py-1 px-3">
                {PRICE_LABELS[neighborhood.priceLevel]}
              </Badge>
            </Card>

            {/* Top score callout */}
            <Card className="p-5">
              <h3 className="font-semibold mb-3">Stands out for</h3>
              <div className={`text-4xl font-bold mb-1 ${getScoreColor(topScore)}`}>{topScore}</div>
              <p className="text-sm text-muted-foreground">
                {topScore === scores.walkability && "Walkability"}
                {topScore === scores.transitConnectivity && topScore !== scores.walkability && "Transit"}
                {topScore === scores.safety && topScore !== scores.walkability && topScore !== scores.transitConnectivity && "Safety"}
                {topScore === scores.foodCoffeeDensity && topScore !== scores.walkability && topScore !== scores.transitConnectivity && topScore !== scores.safety && "Food & Coffee"}
                {topScore === scores.nightlife && topScore !== scores.walkability && topScore !== scores.transitConnectivity && topScore !== scores.safety && topScore !== scores.foodCoffeeDensity && "Nightlife"}
                {topScore === scores.localVibes && topScore === Math.max(scores.walkability, scores.transitConnectivity, scores.safety, scores.foodCoffeeDensity, scores.nightlife, scores.localVibes) && " score — Local Vibes"}
                {" "}out of 100
              </p>
            </Card>
          </div>

          {/* Main column */}
          <div className="md:col-span-2 md:col-start-1 md:row-start-1 space-y-10">

            {/* Description */}
            <section>
              <h2 className="text-2xl font-semibold mb-3">About {neighborhood.name}</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {neighborhood.aiDescription || neighborhood.description}
              </p>
            </section>

            {/* Highlights */}
            {neighborhood.highlights.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold mb-4">Highlights</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {neighborhood.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-2 text-sm">
                      <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Transit */}
            {neighborhood.transitHubs.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold mb-4">Getting Around</h2>
                <div className="flex flex-wrap gap-2">
                  {neighborhood.transitHubs.map((hub) => (
                    <Badge key={hub} variant="outline" className="gap-1.5 py-1.5 px-3">
                      <Train className="w-3.5 h-3.5" />
                      {hub}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {/* All scores */}
            <section>
              <h2 className="text-2xl font-semibold mb-6">Neighborhood Scores</h2>
              <div className="space-y-4">
                <ScoreBar label="Walkability" score={scores.walkability} icon={<Footprints className="w-4 h-4" />} size="lg" />
                <ScoreBar label="Transit Connectivity" score={scores.transitConnectivity} icon={<Train className="w-4 h-4" />} size="lg" />
                <ScoreBar label="Safety" score={scores.safety} icon={<Shield className="w-4 h-4" />} size="lg" />
                <ScoreBar label="Food & Coffee" score={scores.foodCoffeeDensity} icon={<Utensils className="w-4 h-4" />} size="lg" />
                <ScoreBar label="Nightlife" score={scores.nightlife} icon={<Music className="w-4 h-4" />} size="lg" />
                <ScoreBar label="Tourist-Friendly" score={scores.touristFriendliness} icon={<MapPin className="w-4 h-4" />} size="lg" />
                <ScoreBar label="Local Vibes" score={scores.localVibes} icon={<Users className="w-4 h-4" />} size="lg" />
              </div>
            </section>

            {/* Hotels */}
            {hotels.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold mb-6">Hotels in {neighborhood.name}</h2>
                <div className="space-y-4">
                  {hotels.map((hotel) => (
                    <Card key={hotel.id} className="overflow-hidden">
                      <div className="flex gap-4 p-4">
                        <div className="relative w-28 h-28 flex-shrink-0 rounded-md overflow-hidden">
                          <img
                            src={hotel.image}
                            alt={hotel.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80";
                            }}
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <h3 className="font-semibold truncate">{hotel.name}</h3>
                            <div className="flex items-center gap-1 mt-0.5 mb-1">
                              {Array.from({ length: hotel.starRating }).map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              ))}
                              <span className="text-xs text-muted-foreground ml-1">{hotel.rating.toFixed(1)}</span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{hotel.description}</p>
                          </div>
                          <div className="flex items-center justify-between mt-2 gap-2">
                            <span className="text-base font-bold">{hotel.priceRange}</span>
                            <Button
                              size="sm"
                              onClick={() => {
                                trackClick({ type: "hotel", url: hotel.affiliateUrl ?? "", neighborhoodId: neighborhood.id, cityId: neighborhood.cityId });
                                window.open(hotel.affiliateUrl || "#", "_blank", "noopener,noreferrer");
                              }}
                            >
                              Book Now
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  We may earn a commission when you book through our links. This helps keep Wanderhood free.
                </p>
              </section>
            )}
            {/* Airbnb / Vrbo alternatives */}
            <AirbnbCard
              neighborhoodName={neighborhood.name}
              cityName={city.name}
              neighborhoodId={neighborhood.id}
              cityId={neighborhood.cityId}
            />

            {/* Travel insurance */}
            <TravelInsuranceCard cityName={city.name} cityId={neighborhood.cityId} />

            {/* Reviews */}
            <ReviewSection
              neighborhoodId={neighborhood.id}
              cityId={neighborhood.cityId}
              neighborhoodName={neighborhood.name}
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
