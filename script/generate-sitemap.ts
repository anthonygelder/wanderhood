import { cities } from "../server/data/cities";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = "https://wanderhood.com";

function generateSitemap() {
  const staticPages = [
    { url: "/", priority: "1.0", changefreq: "weekly" },
    { url: "/cities", priority: "0.9", changefreq: "weekly" },
  ];

  const cityPages = cities.map((city) => ({
    url: `/city/${city.slug}`,
    priority: "0.8",
    changefreq: "monthly",
  }));

  const allPages = [...staticPages, ...cityPages];

  const today = new Date().toISOString().split("T")[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  const outputPath = path.resolve(import.meta.dirname, "../client/public/sitemap.xml");
  fs.writeFileSync(outputPath, xml, "utf-8");
  console.log(`Sitemap generated with ${allPages.length} URLs at ${outputPath}`);
}

generateSitemap();
