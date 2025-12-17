import { Link } from "wouter";
import { MapPin, Mail, Twitter, Instagram } from "lucide-react";

const cityLinks = [
  { name: "Tokyo", slug: "tokyo" },
  { name: "Lisbon", slug: "lisbon" },
  { name: "Mexico City", slug: "mexico-city" },
  { name: "Barcelona", slug: "barcelona" },
  { name: "Amsterdam", slug: "amsterdam" },
];

const resourceLinks = [
  { name: "How It Works", href: "/how-it-works" },
  { name: "Car-Free Travel Guide", href: "/guide" },
  { name: "Blog", href: "/blog" },
  { name: "FAQ", href: "/faq" },
];

const companyLinks = [
  { name: "About Us", href: "/about" },
  { name: "Contact", href: "/contact" },
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Terms of Service", href: "/terms" },
];

export function Footer() {
  return (
    <footer className="bg-muted/30 border-t border-border" data-testid="footer">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">StayMap</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Find the perfect car-free neighborhood for your next adventure. 
              We help travelers discover walkable areas with great transit, 
              amazing food, and authentic local vibes.
            </p>
            <div className="flex items-center gap-3">
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover-elevate p-2 rounded-md"
                data-testid="link-twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover-elevate p-2 rounded-md"
                data-testid="link-instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="mailto:hello@staymap.com"
                className="text-muted-foreground hover-elevate p-2 rounded-md"
                data-testid="link-email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide">Popular Cities</h4>
            <ul className="space-y-2">
              {cityLinks.map((city) => (
                <li key={city.slug}>
                  <Link href={`/city/${city.slug}`} data-testid={`link-footer-city-${city.slug}`}>
                    <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {city.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide">Resources</h4>
            <ul className="space-y-2">
              {resourceLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} data-testid={`link-footer-${link.href.slice(1)}`}>
                    <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {link.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide">Company</h4>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} data-testid={`link-footer-${link.href.slice(1)}`}>
                    <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {link.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} StayMap. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground text-center md:text-right">
              Affiliate Disclosure: We may earn commissions from hotel bookings made through our links.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
