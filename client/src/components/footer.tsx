import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Mail, Twitter, Instagram } from "lucide-react";
import logoIcon from "@/assets/wanderhood-icon.svg";

const cityLinks = [
  { name: "Tokyo", slug: "tokyo" },
  { name: "Lisbon", slug: "lisbon" },
  { name: "Mexico City", slug: "mexico-city" },
  { name: "Barcelona", slug: "barcelona" },
  { name: "Amsterdam", slug: "amsterdam" },
];

export function Footer() {
  const { t } = useTranslation();

  const resourceLinks = [
    { name: t("footer.links.howItWorks"), href: "/how-it-works" },
    { name: t("footer.links.carFreeGuide"), href: "/guide" },
    { name: t("footer.links.blog"), href: "/blog" },
    { name: t("footer.links.faq"), href: "/faq" },
  ];

  const companyLinks = [
    { name: t("footer.links.about"), href: "/about" },
    { name: t("footer.links.contact"), href: "/contact" },
    { name: t("footer.links.privacy"), href: "/privacy" },
    { name: t("footer.links.terms"), href: "/terms" },
  ];

  return (
    <footer className="bg-muted/30 border-t border-border" data-testid="footer">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src={logoIcon} alt="Wanderhood" className="w-10 h-10" />
              <span className="font-semibold text-lg">Wanderhood</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("footer.tagline")}
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
                href="mailto:hello@wanderhood.app"
                className="text-muted-foreground hover-elevate p-2 rounded-md"
                data-testid="link-email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide">{t("footer.popularCities")}</h4>
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
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide">{t("footer.resources")}</h4>
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
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide">{t("footer.company")}</h4>
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
              {t("footer.copyright", { year: new Date().getFullYear() })}
            </p>
            <p className="text-xs text-muted-foreground text-center md:text-right">
              {t("footer.affiliateDisclosure")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
