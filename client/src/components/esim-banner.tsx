import { useState } from "react";
import { Wifi, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackClick } from "@/lib/tracking";

// TODO: Replace PLACEHOLDER with your Airalo affiliate/referral code
//   Sign up at: https://www.airalo.com/partner — then append ?aff=YOUR_CODE to links
//   Travelpayouts also carries Airalo: https://travelpayouts.com

interface EsimBannerProps {
  countryName: string;
  cityId?: string;
}

export function EsimBanner({ countryName, cityId }: EsimBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  // TODO: replace PLACEHOLDER with actual Airalo affiliate code
  const airaloUrl = `https://www.airalo.com/?aff=PLACEHOLDER`;

  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 flex items-center gap-3">
      <Wifi className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
          Traveling to {countryName}?
        </p>
        <p className="text-xs text-blue-700 dark:text-blue-300">
          Get an eSIM for instant data — no SIM card needed.
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 shrink-0"
        onClick={() => {
          trackClick({ type: "esim", url: airaloUrl, cityId });
          window.open(airaloUrl, "_blank", "noopener,noreferrer");
        }}
      >
        Get eSIM
        <ExternalLink className="w-3 h-3 ml-1.5" />
      </Button>
      <button
        onClick={() => setDismissed(true)}
        className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-200 flex-shrink-0 p-0.5"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
