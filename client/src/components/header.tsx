import { Link, useLocation } from "wouter";
import { MapPin, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { City } from "@shared/schema";

interface HeaderProps {
  cities?: City[];
  selectedCity?: string;
  onCityChange?: (cityId: string) => void;
  transparent?: boolean;
}

export function Header({ cities, selectedCity, onCityChange, transparent = false }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location, navigate] = useLocation();

  const handleCitySelect = (citySlug: string) => {
    if (onCityChange) {
      onCityChange(citySlug);
    }
    const city = cities?.find(c => c.id === citySlug);
    if (city) {
      navigate(`/city/${city.slug}`);
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 h-16 ${
        transparent
          ? "bg-transparent"
          : "bg-background/80 backdrop-blur-lg border-b border-border"
      }`}
      data-testid="header"
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between gap-4">
        <Link href="/" data-testid="link-home">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">StayMap</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {cities && cities.length > 0 && (
            <Select value={selectedCity} onValueChange={handleCitySelect}>
              <SelectTrigger className="w-[180px]" data-testid="select-city">
                <SelectValue placeholder="Select a city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id} data-testid={`select-city-${city.slug}`}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Link href="/cities" data-testid="link-cities">
            <span className={`text-sm font-medium transition-colors hover-elevate px-3 py-2 rounded-md ${
              location === "/cities" ? "text-foreground" : "text-muted-foreground"
            }`}>
              Cities
            </span>
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu />
          
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border px-6 py-4 space-y-4">
          {cities && cities.length > 0 && (
            <Select value={selectedCity} onValueChange={handleCitySelect}>
              <SelectTrigger className="w-full" data-testid="select-city-mobile">
                <SelectValue placeholder="Select a city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Link href="/cities" data-testid="link-cities-mobile">
            <span className="block text-sm font-medium py-2">Cities</span>
          </Link>
        </div>
      )}
    </header>
  );
}
