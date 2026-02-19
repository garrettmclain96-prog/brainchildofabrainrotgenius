/**
 * Auto-Decay Edge Function
 * Called via pg_cron every 5 minutes.
 * Updates decay_level on all public_thoughts and deletes expired ones.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Delete fully expired thoughts
    const { data: deleted, error: deleteError } = await supabase
      .from("public_thoughts")
      .delete()
      .lte("expires_at", new Date().toISOString())
      .select("id");

    if (deleteError) console.error("Delete error:", deleteError);
    else console.log(`Deleted ${deleted?.length ?? 0} expired thoughts`);

    // Update decay_level on remaining thoughts using the calculate_decay_level function
    // We fetch all active thoughts and update them
    const { data: thoughts, error: fetchError } = await supabase
      .from("public_thoughts")
      .select("id, created_at, expires_at")
      .gt("expires_at", new Date().toISOString());

    if (fetchError) {
      console.error("Fetch error:", fetchError);
    } else if (thoughts && thoughts.length > 0) {
      let updated = 0;
      for (const t of thoughts) {
        const total = new Date(t.expires_at).getTime() - new Date(t.created_at).getTime();
        const elapsed = Date.now() - new Date(t.created_at).getTime();
        const decayLevel = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));

        const { error: updateError } = await supabase
          .from("public_thoughts")
          .update({ decay_level: decayLevel })
          .eq("id", t.id);

        if (!updateError) updated++;
      }
      console.log(`Updated decay_level on ${updated} thoughts`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("auto-decay error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
