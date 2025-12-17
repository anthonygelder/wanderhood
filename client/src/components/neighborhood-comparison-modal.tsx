import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/score-bar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Footprints, 
  Train, 
  Shield, 
  Utensils, 
  PartyPopper, 
  Users, 
  Sparkles,
  GitCompare,
  X,
  Plus,
  Hotel
} from "lucide-react";
import type { Neighborhood } from "@shared/schema";

interface NeighborhoodComparisonModalProps {
  neighborhoods: Neighborhood[];
  trigger?: React.ReactNode;
}

export function NeighborhoodComparisonModal({ 
  neighborhoods,
  trigger 
}: NeighborhoodComparisonModalProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [step, setStep] = useState<"select" | "compare">("select");

  useEffect(() => {
    if (!open) {
      setSelected([]);
      setStep("select");
    }
  }, [open]);

  const handleToggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((s) => s !== id);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const selectedNeighborhoods = neighborhoods.filter((n) => selected.includes(n.id));

  const scoreLabels = [
    { key: "walkability", label: "Walkability", icon: <Footprints className="w-4 h-4" /> },
    { key: "transitConnectivity", label: "Transit", icon: <Train className="w-4 h-4" /> },
    { key: "safety", label: "Safety", icon: <Shield className="w-4 h-4" /> },
    { key: "foodCoffeeDensity", label: "Food & Coffee", icon: <Utensils className="w-4 h-4" /> },
    { key: "nightlife", label: "Nightlife", icon: <PartyPopper className="w-4 h-4" /> },
    { key: "touristFriendliness", label: "Tourist Friendly", icon: <Users className="w-4 h-4" /> },
    { key: "localVibes", label: "Local Vibes", icon: <Sparkles className="w-4 h-4" /> },
  ];

  const getHighestScore = (key: string) => {
    if (selectedNeighborhoods.length === 0) return null;
    let highest = selectedNeighborhoods[0];
    for (const n of selectedNeighborhoods) {
      if ((n.scores as any)[key] > (highest.scores as any)[key]) {
        highest = n;
      }
    }
    return highest.id;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" data-testid="button-compare-neighborhoods">
            <GitCompare className="w-4 h-4 mr-2" />
            Compare Neighborhoods
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5" />
            {step === "select" ? "Select Neighborhoods to Compare" : "Neighborhood Comparison"}
          </DialogTitle>
        </DialogHeader>

        {step === "select" ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <p className="text-sm text-muted-foreground mb-4">
              Select 2-3 neighborhoods to compare side by side. ({selected.length}/3 selected)
            </p>
            
            <ScrollArea className="flex-1 pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {neighborhoods.map((neighborhood) => {
                  const isSelected = selected.includes(neighborhood.id);
                  return (
                    <button
                      key={neighborhood.id}
                      onClick={() => handleToggle(neighborhood.id)}
                      className={`flex items-start gap-3 p-3 rounded-md border-2 text-left transition-all ${
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover-elevate"
                      }`}
                      data-testid={`checkbox-neighborhood-${neighborhood.slug}`}
                    >
                      <Checkbox 
                        checked={isSelected} 
                        className="mt-1"
                        onCheckedChange={() => handleToggle(neighborhood.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{neighborhood.name}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {neighborhood.vibe.slice(0, 2).map((v) => (
                            <Badge key={v} variant="secondary" size="sm">
                              {v}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div 
                        className="w-12 h-12 rounded-md bg-cover bg-center flex-shrink-0"
                        style={{ backgroundImage: `url(${neighborhood.heroImage})` }}
                      />
                    </button>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setOpen(false)}
                data-testid="button-cancel-compare"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => setStep("compare")}
                disabled={selected.length < 2}
                data-testid="button-start-compare"
              >
                Compare ({selected.length})
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setStep("select")}
              className="self-start mb-4"
              data-testid="button-back-to-select"
            >
              <X className="w-4 h-4 mr-2" />
              Change Selection
            </Button>

            <ScrollArea className="flex-1">
              <div className="flex gap-4 pb-4">
                {selectedNeighborhoods.map((neighborhood) => (
                  <Card key={neighborhood.id} className="flex-1 min-w-[250px] p-4" data-testid={`compare-card-${neighborhood.slug}`}>
                    <div 
                      className="aspect-video rounded-md bg-cover bg-center mb-3"
                      style={{ backgroundImage: `url(${neighborhood.heroImage})` }}
                    />
                    <h3 className="text-lg font-semibold mb-1">{neighborhood.name}</h3>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {neighborhood.vibe.map((v) => (
                        <Badge key={v} variant="secondary" size="sm">
                          {v}
                        </Badge>
                      ))}
                    </div>
                    <Badge variant="outline" className="mb-3">
                      {neighborhood.priceLevel.charAt(0).toUpperCase() + neighborhood.priceLevel.slice(1)} Budget
                    </Badge>
                  </Card>
                ))}
              </div>

              <div className="space-y-4 mt-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Score Comparison
                </h4>
                
                {scoreLabels.map(({ key, label, icon }) => {
                  const highestId = getHighestScore(key);
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {icon}
                        {label}
                      </div>
                      <div className="flex gap-4">
                        {selectedNeighborhoods.map((neighborhood) => {
                          const score = (neighborhood.scores as any)[key];
                          const isHighest = neighborhood.id === highestId;
                          return (
                            <div key={neighborhood.id} className="flex-1">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className={isHighest ? "font-semibold text-primary" : "text-muted-foreground"}>
                                  {neighborhood.name}
                                </span>
                                <span className={isHighest ? "font-bold text-primary" : ""}>
                                  {score}
                                </span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    isHighest ? "bg-primary" : "bg-muted-foreground/50"
                                  }`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                  Transit Hubs
                </h4>
                <div className="flex gap-4">
                  {selectedNeighborhoods.map((neighborhood) => (
                    <div key={neighborhood.id} className="flex-1">
                      <p className="text-xs font-medium mb-2">{neighborhood.name}</p>
                      <div className="flex flex-wrap gap-1">
                        {neighborhood.transitHubs.map((hub) => (
                          <Badge key={hub} variant="outline" size="sm">
                            {hub}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                  Highlights
                </h4>
                <div className="flex gap-4">
                  {selectedNeighborhoods.map((neighborhood) => (
                    <div key={neighborhood.id} className="flex-1">
                      <p className="text-xs font-medium mb-2">{neighborhood.name}</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {neighborhood.highlights.map((highlight) => (
                          <li key={highlight} className="flex items-center gap-1">
                            <Plus className="w-3 h-3 text-primary" />
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
