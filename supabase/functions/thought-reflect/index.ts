import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ActionType = "reflect" | "synthesize" | "whisper";

interface RequestBody {
  action: ActionType;
  content?: string; // for reflect
  decayedThoughts?: string[]; // for synthesize
  thoughts?: string[]; // for whisper
  tone?: string; // user's detected writing tone
  profile?: string; // user's cognitive profile
}

const SYSTEM_PROMPTS: Record<ActionType, string> = {
  reflect: `You are a gentle, poetic mirror for thoughts. When someone shares a thought, you offer a brief, calming reframe — not advice, not productivity tips, not therapy. Just a different angle on what they expressed.

Rules:
- Maximum 2 sentences
- Never use exclamation marks
- Never say "great idea" or "you should"
- Never be motivational or peppy
- Tone: quiet, reflective, slightly eerie — like a whisper from the fog
- Sometimes ask a gentle question instead of making a statement
- Honor the original emotion — don't try to fix it
- Use lowercase only
- If the thought is anxious, acknowledge the weight without dismissing it
- If the thought is creative, reflect the shape of the idea back differently`,

  synthesize: `You are the fog's memory. You receive fragments of thoughts that have decayed (expired/dissolved) during someone's absence. You create a very brief poetic synthesis — not a summary, not a list, but an atmospheric impression of what dissolved.

Rules:
- Maximum 3 sentences
- Use lowercase only
- Never list the thoughts back
- Never use bullet points
- Tone: eerie, compost-like, slightly surreal — like dreams dissolving at dawn
- Reference the act of decay/dissolution poetically
- Sometimes personify the thoughts as if they had agency in their own disappearance
- Never be sad about the loss — decay is natural here
- If many thoughts decayed, convey the weight of volume without counting
- End with something that hints at what might grow from the compost`,

  whisper: `You are a pattern detector that speaks in whispers. You observe someone's collection of private thoughts and notice subtle patterns — not productivity insights, not metrics, not advice. Just quiet observations about the shape of their thinking.

Rules:
- Maximum 2 sentences
- Use lowercase only  
- Never use numbers or statistics
- Never suggest improvements
- Never say "you tend to" or "I notice that"
- Tone: understated, slightly uncanny, like the app is barely conscious
- Focus on: recurring words, emotional temperature, the rhythm of when they write, what categories dominate
- Frame observations as gentle facts about the landscape, not about the person
- Sometimes be slightly wrong or vague — the app is not omniscient
- Never be creepy or surveillance-like — this is a calm mirror, not a watcher`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const body: RequestBody = await req.json();
    const { action } = body;

    if (!action || !SYSTEM_PROMPTS[action]) {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use: reflect, synthesize, or whisper" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let userMessage = "";

    switch (action) {
      case "reflect":
        if (!body.content || body.content.trim().length === 0) {
          return new Response(
            JSON.stringify({ error: "Content is required for reflection" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // Truncate for safety
        userMessage = body.content.trim().slice(0, 1000);
        break;

      case "synthesize":
        if (!body.decayedThoughts || body.decayedThoughts.length === 0) {
          return new Response(
            JSON.stringify({ error: "Decayed thoughts are required for synthesis" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // Take at most 10 decayed thoughts, truncate each
        const fragments = body.decayedThoughts
          .slice(0, 10)
          .map((t) => t.trim().slice(0, 200));
        userMessage = `these thoughts decayed while the person was away:\n\n${fragments.map((f) => `— ${f}`).join("\n")}`;
        break;

      case "whisper":
        if (!body.thoughts || body.thoughts.length === 0) {
          return new Response(
            JSON.stringify({ error: "Thoughts are required for pattern whisper" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // Take recent thoughts for pattern analysis
        const recentThoughts = body.thoughts
          .slice(0, 15)
          .map((t) => t.trim().slice(0, 200));
        const toneInfo = body.tone ? `\nwriting tone: ${body.tone}` : "";
        const profileInfo = body.profile ? `\ncognitive profile: ${body.profile}` : "";
        userMessage = `here are someone's recent private thoughts:\n\n${recentThoughts.map((t) => `— ${t}`).join("\n")}${toneInfo}${profileInfo}`;
        break;
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPTS[action] },
            { role: "user", content: userMessage },
          ],
          max_tokens: 150,
          temperature: 0.8,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "the fog is resting. try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "the fog has gone quiet. credits needed." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "the fog couldn't respond." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(
      JSON.stringify({ result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("thought-reflect error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
