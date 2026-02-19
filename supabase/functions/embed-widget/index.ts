/**
 * Embed Widget Edge Function
 * Serves a self-contained HTML snippet that renders a live decaying thought.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // Allow GET for iframe embed
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch a random active public thought
    const { data: thoughts } = await supabase
      .from("public_thoughts")
      .select("content, created_at, expires_at, decay_level")
      .gt("expires_at", new Date().toISOString())
      .lt("decay_level", 80)
      .limit(20);

    const thought = thoughts && thoughts.length > 0
      ? thoughts[Math.floor(Math.random() * thoughts.length)]
      : null;

    const content = thought?.content || "nothing here right now...";
    const decay = thought?.decay_level || 0;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0E0E11;color:#E6E6EB;font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
.card{max-width:360px;width:100%;padding:24px;border-radius:12px;background:rgba(42,42,46,0.5);border:1px solid rgba(230,230,235,0.06);position:relative;overflow:hidden}
.content{font-size:14px;line-height:1.6;opacity:${1 - decay * 0.008};letter-spacing:${decay * 0.001}em}
.decay-bar{position:absolute;top:0;left:0;height:2px;background:linear-gradient(90deg,rgba(230,230,235,0.3),transparent);width:${100 - decay}%;transition:width 1s}
.brand{margin-top:16px;text-align:right;font-size:10px;opacity:0.3}
.brand a{color:inherit;text-decoration:none}
.brand a:hover{opacity:0.7}
</style>
</head>
<body>
<div class="card">
<div class="decay-bar"></div>
<p class="content">${content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
<div class="brand"><a href="https://brainchildofabrainrotgenius.lovable.app" target="_blank" rel="noopener">brainchild</a></div>
</div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "X-Frame-Options": "ALLOWALL",
      },
    });
  } catch (error) {
    console.error("embed-widget error:", error);
    return new Response("Error loading widget", { status: 500 });
  }
});
