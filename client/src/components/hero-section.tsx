import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Train, Coffee } from "lucide-react";
import logoIcon from "@/assets/wanderhood-icon.svg";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import type { City } from "@shared/schema";

// Curated high-quality hero images — one per featured city
const HERO_SLIDES = [
  { city: "Tokyo",        url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920&q=85" },
  { city: "Barcelona",    url: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1920&q=85" },
  { city: "Paris",        url: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920&q=85" },
  { city: "Lisbon",       url: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1920&q=85" },
  { city: "Amsterdam",    url: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1920&q=85" },
  { city: "Rome",         url: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1920&q=85" },
  { city: "New York",     url: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1920&q=85" },
  { city: "Mexico City",  url: "https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=1920&q=85" },
  { city: "Copenhagen",   url: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=1920&q=85" },
  { city: "Singapore",    url: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&q=85" },
];

const INTERVAL_MS = 5000;

interface HeroSectionProps {
  onStartQuestionnaire: () => void;
  cities?: City[];
  stats?: { cities: number; neighborhoods: number; hotels: number };
}

export function HeroSection({ onStartQuestionnaire, cities, stats }: HeroSectionProps) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [next, setNext] = useState(1);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % HERO_SLIDES.length);
        setNext((c) => (c + 2) % HERO_SLIDES.length);
        setFading(false);
      }, 800);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  // Preload next image
  useEffect(() => {
    const img = new Image();
    img.src = HERO_SLIDES[next].url;
  }, [next]);

  return (
    <section
      className="relative min-h-[80vh] flex items-center justify-center overflow-hidden"
      data-testid="hero-section"
    >
      {/* Current image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700"
        style={{
          backgroundImage: `url('${HERO_SLIDES[current].url}')`,
          opacity: fading ? 0 : 1,
        }}
      />
      {/* Next image sits underneath, ready */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${HERO_SLIDES[next].url}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/30" />

      {/* City label */}
      <div className="absolute bottom-6 right-6 z-10">
        <span
          className="text-xs text-white/50 tracking-widest uppercase transition-opacity duration-700"
          style={{ opacity: fading ? 0 : 1 }}
        >
          {HERO_SLIDES[current].city}
        </span>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center mt-8 md:mt-0">
        <div className="space-y-6">
          <div className="flex justify-center">
            <img src={logoIcon} alt="Wanderhood" className="w-16 h-16 md:w-24 md:h-24" />
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold text-white leading-tight">
            {t("hero.title")}
            <br />
            <span className="font-serif italic">{t("hero.titleEmphasis")}</span>
          </h1>

          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            {t("hero.description")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              onClick={onStartQuestionnaire}
              className="bg-white text-black hover:bg-white/90 font-semibold px-8 py-6 text-lg"
              data-testid="button-start-questionnaire"
            >
              {t("hero.cta")}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <a href="/cities">
              <Button
                variant="outline"
                size="lg"
                className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 px-8 py-6 text-lg"
                data-testid="button-explore-cities"
              >
                {t("hero.exploreCities")}
              </Button>
            </a>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-white/60 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span><strong className="text-white/90">{stats?.cities ?? cities?.length ?? 65}</strong> {t("hero.stats.cities")}</span>
            </div>
            <div className="hidden sm:block text-white/30">·</div>
            <div className="flex items-center gap-2">
              <Train className="w-4 h-4" />
              <span><strong className="text-white/90">{stats ? `${stats.neighborhoods}+` : "200+"}</strong> {t("hero.stats.neighborhoods")}</span>
            </div>
            <div className="hidden sm:block text-white/30">·</div>
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4" />
              <span><strong className="text-white/90">{stats ? `${stats.hotels}+` : "700+"}</strong> {t("hero.stats.hotels")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
