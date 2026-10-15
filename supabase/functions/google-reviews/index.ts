// Bike & Butter: returns the live Google reviews for the shop, cached for 12 hours.
// Needs the secret GOOGLE_PLACES_API_KEY (Places API (New) enabled). The key never reaches the browser.
import { createClient } from "jsr:@supabase/supabase-js@2";

const PLACE_ID = "ChIJcxNdS8MP2jERAyGg9ZKffaQ";
const MAX_AGE_MS = 12 * 3600 * 1000;
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
};
const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json", ...extra } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: cached } = await db.from("google_reviews_cache").select("data,updated_at").eq("id", 1).maybeSingle();
  const fresh = cached && Date.now() - new Date(cached.updated_at).getTime() < MAX_AGE_MS;
  if (fresh) return json(cached.data, 200, { "Cache-Control": "public, max-age=3600" });

  const key = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (key) {
    try {
      const r = await fetch(`https://places.googleapis.com/v1/places/${PLACE_ID}`, {
        headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "rating,userRatingCount,reviews", "Accept-Language": "en" },
      });
      if (r.ok) {
        const p = await r.json();
        const out = {
          rating: p.rating ?? null,
          count: p.userRatingCount ?? null,
          reviews: (p.reviews || []).map((v: any) => ({
            author: v.authorAttribution?.displayName || "Google user",
            photo: v.authorAttribution?.photoUri || null,
            rating: v.rating,
            when: v.relativePublishTimeDescription || "",
            text: v.originalText?.text || v.text?.text || "",
          })).filter((v: any) => v.text),
        };
        await db.from("google_reviews_cache").upsert({ id: 1, data: out, updated_at: new Date().toISOString() });
        return json(out, 200, { "Cache-Control": "public, max-age=3600" });
      }
      console.error("Places API error", r.status, await r.text());
    } catch (e) { console.error(e); }
  }
  // Google unavailable or no key: serve the last good copy if there is one, otherwise nothing (the site hides the section).
  if (cached) return json(cached.data, 200, { "Cache-Control": "public, max-age=300" });
  return json({ error: "unavailable" }, 503);
});
