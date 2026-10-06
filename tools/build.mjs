// Bike & Butter — tiny static "build" step. No dependencies.
//
// Single source of truth for the shared header and footer:
//   partials/header.html  ->  every page between <!-- @header --> ... <!-- @/header -->
//   partials/footer.html  ->  every page between <!-- @footer --> ... <!-- @/footer -->
//
// Run from the repo root after editing a partial:   node tools/build.mjs
// Pages that don't contain the marker comments are left untouched.

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const partials = {
  header: readFileSync(join(root, "partials/header.html"), "utf8").trim(),
  footer: readFileSync(join(root, "partials/footer.html"), "utf8").trim(),
};

const SKIP = new Set([".git", "node_modules", "partials", "tools", "supabase", "assets"]);
function* htmlFiles(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* htmlFiles(p);
    else if (name.endsWith(".html")) yield p;
  }
}

const marker = /<!-- @(header|footer) -->[\s\S]*?<!-- @\/\1 -->/g;
let changed = 0;
for (const file of htmlFiles(root)) {
  const src = readFileSync(file, "utf8");
  if (!marker.test(src)) { marker.lastIndex = 0; continue; }
  marker.lastIndex = 0;
  const out = src.replace(marker, (_, name) => `<!-- @${name} -->\n${partials[name]}\n<!-- @/${name} -->`);
  if (out !== src) { writeFileSync(file, out); changed++; console.log("stamped", relative(root, file)); }
}
console.log(changed ? `Done — ${changed} page(s) updated.` : "Nothing to update.");
