import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/score-bar";
import type { Neighborhood } from "@shared/schema";

interface NeighborhoodComparisonProps {
  neighborhoods: Neighborhood[];
}

export function NeighborhoodComparison({ neighborhoods }: NeighborhoodComparisonProps) {
  if (neighborhoods.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-muted/30" data-testid="neighborhood-comparison">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold">
            Compare Neighborhoods
          </h2>
          <p className="text-muted-foreground mt-2">
            See how different areas stack up against each other
          </p>
        </div>

        <ScrollArea className="w-full">
          <div className="min-w-[800px]">
            <table className="w-full" data-testid="table-comparison">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-semibold">Neighborhood</th>
                  <th className="text-center p-4 font-semibold">Walkability</th>
                  <th className="text-center p-4 font-semibold">Transit</th>
                  <th className="text-center p-4 font-semibold">Safety</th>
                  <th className="text-center p-4 font-semibold">Food/Coffee</th>
                  <th className="text-center p-4 font-semibold">Nightlife</th>
                  <th className="text-center p-4 font-semibold">Price</th>
                </tr>
              </thead>
              <tbody>
                {neighborhoods.map((n) => (
                  <tr 
                    key={n.id} 
                    className="border-b border-border hover-elevate"
                    data-testid={`row-neighborhood-${n.slug}`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-md bg-cover bg-center flex-shrink-0"
                          style={{ backgroundImage: `url(${n.heroImage})` }}
                        />
                        <div>
                          <p className="font-semibold">{n.name}</p>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {n.vibe.slice(0, 2).map((v) => (
                              <Badge key={v} variant="secondary" size="sm">
                                {v}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="w-24 mx-auto">
                        <ScoreBar label="" score={n.scores.walkability} showLabel={false} size="md" />
                        <p className="text-center text-sm font-medium mt-1">{n.scores.walkability}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="w-24 mx-auto">
                        <ScoreBar label="" score={n.scores.transitConnectivity} showLabel={false} size="md" />
                        <p className="text-center text-sm font-medium mt-1">{n.scores.transitConnectivity}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="w-24 mx-auto">
                        <ScoreBar label="" score={n.scores.safety} showLabel={false} size="md" />
                        <p className="text-center text-sm font-medium mt-1">{n.scores.safety}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="w-24 mx-auto">
                        <ScoreBar label="" score={n.scores.foodCoffeeDensity} showLabel={false} size="md" />
                        <p className="text-center text-sm font-medium mt-1">{n.scores.foodCoffeeDensity}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="w-24 mx-auto">
                        <ScoreBar label="" score={n.scores.nightlife} showLabel={false} size="md" />
                        <p className="text-center text-sm font-medium mt-1">{n.scores.nightlife}</p>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant={n.priceLevel === "budget" ? "secondary" : n.priceLevel === "luxury" ? "default" : "outline"}>
                        {n.priceLevel}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </section>
  );
}
