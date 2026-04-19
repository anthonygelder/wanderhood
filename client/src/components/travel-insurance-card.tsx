import { ShieldCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trackClick } from "@/lib/tracking";

// TODO: Replace PLACEHOLDERs with real affiliate IDs once accounts are set up
//   World Nomads:  https://www.worldnomads.com/affiliate — add affiliate source param
//   Cover Genius:  https://www.covergenius.com/partners  — add affiliate/partner param

interface TravelInsuranceCardProps {
  cityName: string;
  cityId?: string;
}

export function TravelInsuranceCard({ cityName, cityId }: TravelInsuranceCardProps) {
  // TODO: replace 'wanderhood' with your actual World Nomads affiliate source ID
  const worldNomadsUrl = `https://www.worldnomads.com/travel-insurance?utm_source=wanderhood&utm_medium=affiliate&utm_campaign=PLACEHOLDER`;

  // TODO: replace with Cover Genius partner deeplink once onboarded
  const coverGeniusUrl = `https://www.covergenius.com/?ref=PLACEHOLDER`;

  return (
    <Card className="p-5 border-dashed">
      <div className="flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Travel insurance for {cityName}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Protect your trip against cancellations, medical emergencies, and lost luggage.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                trackClick({ type: "insurance_worldnomads", url: worldNomadsUrl, cityId });
                window.open(worldNomadsUrl, "_blank", "noopener,noreferrer");
              }}
            >
              World Nomads
              <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                trackClick({ type: "insurance_covergenius", url: coverGeniusUrl, cityId });
                window.open(coverGeniusUrl, "_blank", "noopener,noreferrer");
              }}
            >
              Cover Genius
              <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            We may earn a commission on policies purchased through our links.
          </p>
        </div>
      </div>
    </Card>
  );
}
