import { Plane, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackClick } from "@/lib/tracking";

// TODO: Replace PLACEHOLDERs with real affiliate IDs once accounts are set up
//   Skyscanner:    https://www.partners.skyscanner.net — add associateid param
//   Google Flights: No affiliate program; link is purely for UX/utility

interface FlightSearchProps {
  cityName: string;
  countryName: string;
  cityId?: string;
}

export function FlightSearch({ cityName, countryName, cityId }: FlightSearchProps) {
  const citySlug = cityName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  // TODO: add ?currency=USD&associateid=YOUR_SKYSCANNER_ID once approved
  const skyscannerUrl = `https://www.skyscanner.com/flights-to/${citySlug}`;

  const googleFlightsUrl = `https://www.google.com/travel/flights/search?q=${encodeURIComponent("flights to " + cityName + " " + countryName)}`;

  return (
    <div className="flex items-center gap-3 py-3 border-t">
      <Plane className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <span className="text-sm text-muted-foreground flex-1">
        Fly to {cityName}
      </span>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-8"
          onClick={() => {
            trackClick({ type: "flight_skyscanner", url: skyscannerUrl, cityId });
            window.open(skyscannerUrl, "_blank", "noopener,noreferrer");
          }}
        >
          Skyscanner
          <ExternalLink className="w-3 h-3 ml-1" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-8"
          onClick={() => {
            trackClick({ type: "flight_google", url: googleFlightsUrl, cityId });
            window.open(googleFlightsUrl, "_blank", "noopener,noreferrer");
          }}
        >
          Google Flights
          <ExternalLink className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}
