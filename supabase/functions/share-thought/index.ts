/**
 * Share Thought Edge Function
 * Generates a unique share_slug for a public thought.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let slug = "";
  for (let i = 0; i < 8; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)];
  }
  return slug;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { thought_id, session_id } = await req.json();

    if (!thought_id || !session_id) {
      return new Response(
        JSON.stringify({ error: "thought_id and session_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify thought belongs to session
    const { data: thought, error: fetchError } = await supabase
      .from("public_thoughts")
      .select("id, share_slug, session_id")
      .eq("id", thought_id)
      .eq("session_id", session_id)
      .single();

    if (fetchError || !thought) {
      return new Response(
        JSON.stringify({ error: "Thought not found or not yours" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return existing slug if already shared
    if (thought.share_slug) {
      return new Response(
        JSON.stringify({ slug: thought.share_slug }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate unique slug with retry
    let slug = generateSlug();
    let attempts = 0;
    while (attempts < 5) {
      const { error: updateError } = await supabase
        .from("public_thoughts")
        .update({ share_slug: slug })
        .eq("id", thought_id);

      if (!updateError) break;
      slug = generateSlug();
      attempts++;
    }

    return new Response(
      JSON.stringify({ slug }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("share-thought error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
