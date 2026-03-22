import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { 
  Wallet, 
  Palette, 
  Footprints, 
  Train, 
  Shuffle,
  User, 
  Heart, 
  Laptop, 
  Utensils, 
  Users,
  PartyPopper,
  Waves,
  History,
  Coffee,
  Baby,
  Music,
  TreePine,
  ArrowLeft,
  ArrowRight,
  Check
} from "lucide-react";
import type { 
  BudgetOption, 
  VibeOption, 
  TravelStyleOption, 
  TripPurposeOption,
  QuestionnaireInput,
  City 
} from "@shared/schema";
import { cn } from "@/lib/utils";

interface QuestionnaireProps {
  cities: City[];
  defaultCityId?: string;
  onComplete: (data: QuestionnaireInput) => void;
  onCancel: () => void;
}

interface OptionCardProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}

function OptionCard({ icon, label, description, selected, onClick }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "p-4 rounded-md border-2 text-left transition-all hover-elevate active-elevate-2",
        selected 
          ? "border-primary bg-primary/5" 
          : "border-border bg-card"
      )}
      data-testid={`option-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0",
          selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          {icon}
        </div>
        <div>
          <p className="font-medium">{label}</p>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
    </button>
  );
}

const budgetOptions: { value: BudgetOption; label: string; description: string; icon: React.ReactNode }[] = [
  { value: "budget", label: "Budget", description: "Hostels & budget hotels", icon: <Wallet className="w-5 h-5" /> },
  { value: "moderate", label: "Moderate", description: "Mid-range comfort", icon: <Wallet className="w-5 h-5" /> },
  { value: "upscale", label: "Upscale", description: "Higher-end stays", icon: <Wallet className="w-5 h-5" /> },
  { value: "luxury", label: "Luxury", description: "Premium experiences", icon: <Wallet className="w-5 h-5" /> },
];

const vibeOptions: { value: VibeOption; label: string; icon: React.ReactNode }[] = [
  { value: "quiet", label: "Quiet & Peaceful", icon: <TreePine className="w-5 h-5" /> },
  { value: "artsy", label: "Artsy & Creative", icon: <Palette className="w-5 h-5" /> },
  { value: "hip", label: "Hip & Trendy", icon: <Coffee className="w-5 h-5" /> },
  { value: "historic", label: "Historic & Cultural", icon: <History className="w-5 h-5" /> },
  { value: "foodie", label: "Foodie Paradise", icon: <Utensils className="w-5 h-5" /> },
  { value: "party", label: "Party Scene", icon: <Music className="w-5 h-5" /> },
  { value: "waterfront", label: "Waterfront", icon: <Waves className="w-5 h-5" /> },
  { value: "family", label: "Family-Friendly", icon: <Baby className="w-5 h-5" /> },
];

const travelStyleOptions: { value: TravelStyleOption; label: string; description: string; icon: React.ReactNode }[] = [
  { value: "walk", label: "Walk Everywhere", description: "I love exploring on foot", icon: <Footprints className="w-5 h-5" /> },
  { value: "transit", label: "Public Transit", description: "Metro & buses are my thing", icon: <Train className="w-5 h-5" /> },
  { value: "mixed", label: "Mix of Both", description: "Walk when close, transit for far", icon: <Shuffle className="w-5 h-5" /> },
];

const tripPurposeOptions: { value: TripPurposeOption; label: string; description: string; icon: React.ReactNode }[] = [
  { value: "solo", label: "Solo Adventure", description: "Exploring on my own", icon: <User className="w-5 h-5" /> },
  { value: "couples", label: "Couples Getaway", description: "Romantic weekend", icon: <Heart className="w-5 h-5" /> },
  { value: "remote_work", label: "Remote Work", description: "Working while traveling", icon: <Laptop className="w-5 h-5" /> },
  { value: "foodie_trip", label: "Foodie Trip", description: "Eating my way through", icon: <Utensils className="w-5 h-5" /> },
  { value: "family", label: "Family Trip", description: "Traveling with kids", icon: <Baby className="w-5 h-5" /> },
  { value: "friends", label: "Friends Trip", description: "Group adventure", icon: <PartyPopper className="w-5 h-5" /> },
];

export function Questionnaire({ cities, defaultCityId, onComplete, onCancel }: QuestionnaireProps) {
  const [step, setStep] = useState(defaultCityId ? 1 : 0);
  const [cityId, setCityId] = useState<string>(defaultCityId || "");
  const [citySearch, setCitySearch] = useState("");
  const [budget, setBudget] = useState<BudgetOption | null>(null);
  const [vibes, setVibes] = useState<VibeOption[]>([]);
  const [travelStyle, setTravelStyle] = useState<TravelStyleOption | null>(null);
  const [tripPurpose, setTripPurpose] = useState<TripPurposeOption | null>(null);

  const totalSteps = 5;
  const progress = ((step + 1) / totalSteps) * 100;

  const handleVibeToggle = (vibe: VibeOption) => {
    setVibes((prev) => {
      if (prev.includes(vibe)) {
        return prev.filter((v) => v !== vibe);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, vibe];
    });
  };

  const canProceed = () => {
    switch (step) {
      case 0: return cityId !== "";
      case 1: return budget !== null;
      case 2: return vibes.length >= 1;
      case 3: return travelStyle !== null;
      case 4: return tripPurpose !== null;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else if (budget && vibes.length > 0 && travelStyle && tripPurpose && cityId) {
      onComplete({
        cityId,
        budget,
        vibes,
        travelStyle,
        tripPurpose,
      });
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      onCancel();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-start md:items-center justify-center px-4 py-8 md:py-12" data-testid="questionnaire">
      <Card className="w-full max-w-2xl p-4 sm:p-8 space-y-6 sm:space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Step {step + 1} of {totalSteps}</span>
            <Button variant="ghost" size="sm" onClick={onCancel} data-testid="button-cancel-questionnaire">
              Cancel
            </Button>
          </div>
          <Progress value={progress} className="h-2" data-testid="progress-questionnaire" />
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold">Which city are you visiting?</h2>
              <p className="text-muted-foreground mt-1">Select your destination</p>
            </div>
            <Input
              placeholder="Search cities…"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              autoFocus
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {cities
                .filter((c) =>
                  c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
                  c.country.toLowerCase().includes(citySearch.toLowerCase())
                )
                .map((city) => (
                  <OptionCard
                    key={city.id}
                    icon={<Users className="w-5 h-5" />}
                    label={city.name}
                    description={city.country}
                    selected={cityId === city.id}
                    onClick={() => setCityId(city.id)}
                  />
                ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">What's your budget?</h2>
              <p className="text-muted-foreground mt-1">This helps us find the right neighborhood for you</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {budgetOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  icon={option.icon}
                  label={option.label}
                  description={option.description}
                  selected={budget === option.value}
                  onClick={() => setBudget(option.value)}
                />
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">What's your ideal vibe?</h2>
              <p className="text-muted-foreground mt-1">Select up to 3 that match your style</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {vibeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleVibeToggle(option.value)}
                  className={cn(
                    "p-4 rounded-md border-2 text-center transition-all hover-elevate active-elevate-2 flex flex-col items-center gap-2",
                    vibes.includes(option.value)
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card"
                  )}
                  data-testid={`option-vibe-${option.value}`}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-md flex items-center justify-center",
                    vibes.includes(option.value) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {option.icon}
                  </div>
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">How do you like to get around?</h2>
              <p className="text-muted-foreground mt-1">Your travel style matters for neighborhood selection</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {travelStyleOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  icon={option.icon}
                  label={option.label}
                  description={option.description}
                  selected={travelStyle === option.value}
                  onClick={() => setTravelStyle(option.value)}
                />
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">What's the purpose of your trip?</h2>
              <p className="text-muted-foreground mt-1">This helps us understand your needs</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tripPurposeOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  icon={option.icon}
                  label={option.label}
                  description={option.description}
                  selected={tripPurpose === option.value}
                  onClick={() => setTripPurpose(option.value)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <Button 
            variant="outline" 
            onClick={handleBack}
            data-testid="button-questionnaire-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          
          <Button 
            onClick={handleNext}
            disabled={!canProceed()}
            data-testid="button-questionnaire-next"
          >
            {step === totalSteps - 1 ? (
              <>
                Find My Neighborhood
                <Check className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
