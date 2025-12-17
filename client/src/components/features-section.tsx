import { Card } from "@/components/ui/card";
import { Footprints, Train, Shield, Utensils, MapPin, Sparkles } from "lucide-react";

const features = [
  {
    icon: <Footprints className="w-6 h-6" />,
    title: "Walkability Scores",
    description: "Know exactly how walkable each neighborhood is before you book.",
  },
  {
    icon: <Train className="w-6 h-6" />,
    title: "Transit Connectivity",
    description: "Find areas near metro stations and bus lines for easy exploration.",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Safety Ratings",
    description: "Make informed decisions with our neighborhood safety data.",
  },
  {
    icon: <Utensils className="w-6 h-6" />,
    title: "Food & Coffee Density",
    description: "Discover neighborhoods packed with cafes, restaurants, and local eats.",
  },
  {
    icon: <MapPin className="w-6 h-6" />,
    title: "Local vs Tourist Feel",
    description: "Choose between authentic local vibes or tourist-friendly areas.",
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "AI-Powered Insights",
    description: "Get personalized neighborhood descriptions tailored to your preferences.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-16 md:py-24 bg-muted/30" data-testid="features-section">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold">
            Everything You Need to Choose
          </h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            We analyze neighborhoods across multiple dimensions so you can find the perfect match for your travel style.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-6"
              data-testid={`card-feature-${index}`}
            >
              <div className="w-12 h-12 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
