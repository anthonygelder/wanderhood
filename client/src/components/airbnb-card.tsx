import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trackClick } from "@/lib/tracking";

// TODO: Replace PLACEHOLDER with real affiliate/partner IDs once accounts are set up
//   Airbnb:  https://www.airbnb.com/associates — add ?af_id=YOURAFFID to links
//   Vrbo:    https://network.vrbo.com          — add affiliate tracking params

interface AirbnbCardProps {
  neighborhoodName: string;
  cityName: string;
  neighborhoodId: string;
  cityId: string;
}

export function AirbnbCard({ neighborhoodName, cityName, neighborhoodId, cityId }: AirbnbCardProps) {
  const query = `${neighborhoodName}, ${cityName}`;
  const encoded = encodeURIComponent(query);

  // TODO: append ?af_id=YOUR_AIRBNB_AFFILIATE_ID once approved
  const airbnbUrl = `https://www.airbnb.com/s/${encoded}/homes`;

  // TODO: append affiliate tracking params once approved via network.vrbo.com
  const vrboUrl = `https://www.vrbo.com/search/keywords:${encodeURIComponent(neighborhoodName + "-" + cityName)}`;

  return (
    <Card className="p-5">
      <h3 className="font-semibold mb-1">Prefer an apartment?</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Browse vacation rentals in {neighborhoodName} — often more space and a local feel.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => {
            trackClick({ type: "airbnb", url: airbnbUrl, neighborhoodId, cityId });
            window.open(airbnbUrl, "_blank", "noopener,noreferrer");
          }}
        >
          Search Airbnb
          <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => {
            trackClick({ type: "vrbo", url: vrboUrl, neighborhoodId, cityId });
            window.open(vrboUrl, "_blank", "noopener,noreferrer");
          }}
        >
          Search Vrbo
          <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        We may earn a commission on bookings made through our links.
      </p>
    </Card>
  );
}
