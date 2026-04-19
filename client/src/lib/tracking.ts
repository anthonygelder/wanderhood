/**
 * Fire-and-forget affiliate click tracker.
 * Uses keepalive so the request completes even if the user navigates away immediately.
 */
export function trackClick(params: {
  type: string;
  url: string;
  neighborhoodId?: string;
  cityId?: string;
}) {
  try {
    fetch("/api/track/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // never throw — tracking must never break navigation
  }
}
