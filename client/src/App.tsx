import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { ErrorBoundary } from "@/components/error-boundary";
import Home from "@/pages/home";
import CityPage from "@/pages/city";
import CitiesPage from "@/pages/cities";
import NeighborhoodPage from "@/pages/neighborhood";
import FavoritesPage from "@/pages/favorites";
import CityGuidePage from "@/pages/city-guide";
import ComparisonPage from "@/pages/comparison";
import TripTypePage from "@/pages/trip-type";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/cities" component={CitiesPage} />
      <Route path="/city/:slug" component={CityPage} />
      <Route path="/city/:slug/:neighborhoodSlug" component={NeighborhoodPage} />
      <Route path="/favorites" component={FavoritesPage} />
      <Route path="/guides/:citySlug/:type" component={CityGuidePage} />
      <Route path="/compare/:citySlug/:n1Slug/:n2Slug" component={ComparisonPage} />
      <Route path="/neighborhoods/:purpose" component={TripTypePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
