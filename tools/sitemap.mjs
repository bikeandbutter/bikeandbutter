// Regenerates sitemap.xml with real lastmod dates, product pages and live bike listings.
// Run from the repo root:  node tools/sitemap.mjs
// Optional: node tools/sitemap.mjs --bikes bikes.json   (use a saved JSON array of {slug, updated_at} instead of fetching)
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const SITE = "https://bikeandbutter.com";
const SUPABASE_URL = "https://aneuljjitpxjvsfucwkq.supabase.co";
const ANON_KEY = "sb_publishable_3HBGJIBmOxzpks_WV2YH9Q_ogbuU9UP"; // public anon key (read-only, same one the site uses)
const today = new Date().toISOString().slice(0, 10);

// [url path, source file(s) whose last change decides lastmod]
const PAGES = [
  ["/", ["index.html"]],
  ["/shop/", ["shop/index.html", "assets/data/products.json"]],
  ["/8lien/", ["8lien/index.html"]],
  ["/rstri/", ["rstri/index.html"]],
  ["/evr/", ["evr/index.html"]],
  ["/parts/", ["parts/index.html", "assets/data/products.json"]],
  ["/marketplace/", ["marketplace/index.html"]],
  ["/workshop/", ["workshop/index.html"]],
  ["/book/", ["book/index.html"]],
  ["/contact/", ["contact/index.html"]],
  ["/help/", ["help/index.html", "assets/data/faq.json"]],
  ["/terms/", ["terms/index.html"]],
  ["/privacy/", ["privacy/index.html"]],
];

function fileDate(f) {
  try {
    if (execSync(`git status --porcelain -- "${f}"`).toString().trim()) return today; // edited, not yet committed
    return execSync(`git log -1 --format=%cs -- "${f}"`).toString().trim() || today;
  } catch { return today; }
}
const latest = (files) => files.map(fileDate).sort().pop();
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function getBikes() {
  const i = process.argv.indexOf("--bikes");
  if (i > -1) return JSON.parse(readFileSync(process.argv[i + 1], "utf8"));
  const r = await fetch(`${SUPABASE_URL}/rest/v1/bike_listings?select=slug,updated_at&visible=eq.true&order=created_at.desc`, { headers: { apikey: ANON_KEY } });
  if (!r.ok) throw new Error("bike_listings HTTP " + r.status);
  return r.json();
}

const urls = PAGES.map(([p, f]) => [SITE + p, latest(f)]);
const productsDate = latest(["assets/data/products.json"]);
const products = JSON.parse(readFileSync("assets/data/products.json", "utf8")).products;
products.forEach((p) => urls.push([`${SITE}/shop/product/?id=${encodeURIComponent(p.id)}`, productsDate]));
for (const b of await getBikes()) urls.push([`${SITE}/marketplace/?b=${encodeURIComponent(b.slug)}`, String(b.updated_at || today).slice(0, 10)]);

const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(([u, d]) => `  <url>\n    <loc>${esc(u)}</loc>\n    <lastmod>${d}</lastmod>\n  </url>`).join("\n") + "\n</urlset>\n";
writeFileSync("sitemap.xml", xml);
console.log(`sitemap.xml written: ${urls.length} URLs`);
