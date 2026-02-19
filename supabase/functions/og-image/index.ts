/**
 * Dynamic OG Image Edge Function
 * Generates an SVG-based OG image for shared fog thoughts.
 * Usage: /og-image?slug=abc12345
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");

    let content = "a thought, dissolving...";
    let decayLevel = 50;

    if (slug) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceKey);

      const { data } = await supabase
        .from("public_thoughts")
        .select("content, decay_level, expires_at")
        .eq("share_slug", slug)
        .single();

      if (data) {
        if (new Date(data.expires_at) <= new Date()) {
          content = "this thought has dissolved.";
          decayLevel = 100;
        } else {
          content = data.content.length > 120
            ? data.content.substring(0, 117) + "..."
            : data.content;
          decayLevel = data.decay_level;
        }
      }
    }

    // Escape XML entities
    const escaped = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

    const opacity = Math.max(0.2, 1 - decayLevel * 0.008);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0E0E11"/>
  <rect x="0" y="0" width="1200" height="630" fill="url(#fog)" opacity="0.3"/>
  <defs>
    <radialGradient id="fog" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#2A2A2E" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#0E0E11" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <text x="600" y="280" text-anchor="middle" fill="#E6E6EB" font-family="-apple-system,BlinkMacSystemFont,system-ui,sans-serif" font-size="28" opacity="${opacity}">
    <tspan x="600" dy="0">${escaped}</tspan>
  </text>
  <text x="600" y="520" text-anchor="middle" fill="#E6E6EB" font-family="-apple-system,BlinkMacSystemFont,system-ui,sans-serif" font-size="16" opacity="0.25">
    brainchild — thoughts that decay
  </text>
  <rect x="100" y="580" width="${(1000 * (100 - decayLevel)) / 100}" height="2" rx="1" fill="#E6E6EB" opacity="0.15"/>
</svg>`;

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=300",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("og-image error:", error);
    return new Response("Error", { status: 500 });
  }
});
