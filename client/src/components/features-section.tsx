import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Footprints, Train, Shield, Utensils, MapPin, Sparkles } from "lucide-react";

const FEATURE_KEYS = [
  { key: "walkability", icon: <Footprints className="w-6 h-6" /> },
  { key: "transit",     icon: <Train className="w-6 h-6" /> },
  { key: "safety",      icon: <Shield className="w-6 h-6" /> },
  { key: "food",        icon: <Utensils className="w-6 h-6" /> },
  { key: "local",       icon: <MapPin className="w-6 h-6" /> },
  { key: "ai",          icon: <Sparkles className="w-6 h-6" /> },
];

export function FeaturesSection() {
  const { t } = useTranslation();
  return (
    <section className="py-16 md:py-24 bg-muted/30" data-testid="features-section">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold">
            {t("features.title")}
          </h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            {t("features.description")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURE_KEYS.map(({ key, icon }, index) => (
            <Card
              key={key}
              className="p-6"
              data-testid={`card-feature-${index}`}
            >
              <div className="w-12 h-12 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-4">
                {icon}
              </div>
              <h3 className="font-semibold text-lg mb-2">{t(`features.items.${key}.title`)}</h3>
              <p className="text-muted-foreground text-sm">{t(`features.items.${key}.description`)}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
