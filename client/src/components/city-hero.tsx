import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin } from "lucide-react";
import type { City } from "@shared/schema";

interface CityHeroProps {
  city: City;
  onStartQuestionnaire: () => void;
}

export function CityHero({ city, onStartQuestionnaire }: CityHeroProps) {
  return (
    <section 
      className="relative min-h-[60vh] flex items-center justify-center overflow-hidden"
      data-testid={`city-hero-${city.slug}`}
    >
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${city.heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/30" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
            <MapPin className="w-4 h-4 text-white" />
            <span className="text-sm text-white font-medium">{city.country}</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Where to Stay in
            <br />
            <span className="font-serif italic">{city.name}</span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            {city.description}
          </p>
          
          <Button 
            size="lg"
            onClick={onStartQuestionnaire}
            className="bg-white text-black hover:bg-white/90 font-semibold px-8 py-6 text-lg"
            data-testid="button-city-questionnaire"
          >
            Find Your Neighborhood
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
