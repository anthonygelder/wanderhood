import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Train, Coffee } from "lucide-react";
import logoIcon from "@/assets/wanderhood-icon.svg";

interface HeroSectionProps {
  onStartQuestionnaire: () => void;
}

export function HeroSection({ onStartQuestionnaire }: HeroSectionProps) {
  return (
    <section 
      className="relative min-h-[80vh] flex items-center justify-center overflow-hidden"
      data-testid="hero-section"
    >
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920&q=80')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/30" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <div className="space-y-6">
          <div className="flex justify-center">
            <img src={logoIcon} alt="Wanderhood" className="w-24 h-24" />
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
            Find Your Perfect
            <br />
            <span className="font-serif italic">Neighborhood</span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Discover walkable neighborhoods with amazing transit, local food scenes, 
            and authentic vibes. No car required.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              size="lg"
              onClick={onStartQuestionnaire}
              className="bg-white text-black hover:bg-white/90 font-semibold px-8 py-6 text-lg"
              data-testid="button-start-questionnaire"
            >
              Where Should I Stay?
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <a href="/cities">
              <Button 
                variant="outline"
                size="lg"
                className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 px-8 py-6 text-lg"
                data-testid="button-explore-cities"
              >
                Explore Cities
              </Button>
            </a>
          </div>
          
          <div className="pt-8 flex items-center justify-center gap-6 text-white/60 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span><strong className="text-white/90">65</strong> cities</span>
            </div>
            <div className="text-white/30">·</div>
            <div className="flex items-center gap-2">
              <Train className="w-4 h-4" />
              <span><strong className="text-white/90">200+</strong> walkable neighborhoods</span>
            </div>
            <div className="text-white/30">·</div>
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4" />
              <span><strong className="text-white/90">700+</strong> hotels</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
