/**
 * Stripe Connect Accounts Edge Function
 * 
 * Handles creating V2 connected accounts, retrieving account status,
 * and generating account links for onboarding.
 * 
 * Endpoints:
 *   POST /stripe-connect-accounts
 *     action: "create"   → Create a new connected account
 *     action: "status"   → Get account onboarding/capability status
 *     action: "onboard"  → Generate an account link for onboarding
 * 
 * Required secrets:
 *   STRIPE_SECRET_KEY — Your Stripe secret key (sk_test_... or sk_live_...)
 */

import Stripe from "npm:stripe@20.3.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// -------------------------------------------------------------------
// CORS headers — required for browser-based requests
// -------------------------------------------------------------------
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // -------------------------------------------------------------------
    // Step 1: Validate the STRIPE_SECRET_KEY is present
    // PLACEHOLDER: Set STRIPE_SECRET_KEY in your Cloud secrets
    // -------------------------------------------------------------------
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not configured. Add it in Cloud secrets.");
      return new Response(
        JSON.stringify({
          error: "Stripe is not configured. Please set STRIPE_SECRET_KEY in your Cloud secrets.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // -------------------------------------------------------------------
    // Step 2: Initialize the Stripe client
    // The SDK automatically uses the latest API version (2026-01-28.clover)
    // -------------------------------------------------------------------
    const stripeClient = new Stripe(stripeSecretKey);

    // -------------------------------------------------------------------
    // Step 3: Initialize Supabase client with service role for DB writes
    // -------------------------------------------------------------------
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // -------------------------------------------------------------------
    // Step 4: Parse the request body
    // -------------------------------------------------------------------
    const body = await req.json();
    const { action, sessionId, displayName, contactEmail, stripeAccountId } = body;

    // -------------------------------------------------------------------
    // Step 5: Route to the correct action handler
    // -------------------------------------------------------------------
    switch (action) {
      // =================================================================
      // ACTION: CREATE — Create a new V2 Connected Account
      // =================================================================
      case "create": {
        if (!sessionId || !displayName || !contactEmail) {
          return new Response(
            JSON.stringify({ error: "sessionId, displayName, and contactEmail are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create a V2 connected account using the Stripe API
        // NOTE: Do NOT pass `type` at the top level (no 'express', 'standard', or 'custom')
        const account = await stripeClient.v2.core.accounts.create({
          display_name: displayName,
          contact_email: contactEmail,
          identity: {
            country: "us", // Default to US — customize per user in production
          },
          dashboard: "full", // Give the connected account access to the full Stripe Dashboard
          defaults: {
            responsibilities: {
              fees_collector: "stripe",   // Stripe collects fees
              losses_collector: "stripe", // Stripe handles losses
            },
          },
          configuration: {
            customer: {}, // Enable customer configuration
            merchant: {
              capabilities: {
                card_payments: {
                  requested: true, // Request card payment capability
                },
              },
            },
          },
        });

        // Store the mapping from session_id → Stripe account in the database
        const { error: dbError } = await supabase.from("connected_accounts").insert({
          session_id: sessionId,
          stripe_account_id: account.id,
          display_name: displayName,
          contact_email: contactEmail,
        });

        if (dbError) {
          console.error("Failed to store connected account:", dbError);
        }

        return new Response(
          JSON.stringify({
            accountId: account.id,
            displayName: account.display_name,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // =================================================================
      // ACTION: STATUS — Get the onboarding & capability status of an account
      // =================================================================
      case "status": {
        if (!stripeAccountId) {
          return new Response(
            JSON.stringify({ error: "stripeAccountId is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Retrieve the V2 account with merchant config and requirements included
        const account = await stripeClient.v2.core.accounts.retrieve(stripeAccountId, {
          include: ["configuration.merchant", "requirements"],
        });

        // Check if card payments are active
        const readyToProcessPayments =
          account?.configuration?.merchant?.capabilities?.card_payments?.status === "active";

        // Check the requirements status to determine onboarding completeness
        const requirementsStatus =
          account.requirements?.summary?.minimum_deadline?.status;
        const onboardingComplete =
          requirementsStatus !== "currently_due" && requirementsStatus !== "past_due";

        return new Response(
          JSON.stringify({
            accountId: account.id,
            displayName: account.display_name,
            readyToProcessPayments,
            onboardingComplete,
            requirementsStatus: requirementsStatus || "none",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // =================================================================
      // ACTION: ONBOARD — Generate an Account Link for onboarding
      // =================================================================
      case "onboard": {
        if (!stripeAccountId) {
          return new Response(
            JSON.stringify({ error: "stripeAccountId is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Build the return URL — user will land back here after onboarding
        // In production, use your actual domain
        const origin = req.headers.get("origin") || "https://brainchildofabrainrotgenius.lovable.app";
        const returnUrl = `${origin}/connect/dashboard?accountId=${stripeAccountId}`;
        const refreshUrl = `${origin}/connect/dashboard?accountId=${stripeAccountId}&refresh=true`;

        // Create a V2 account link for onboarding
        const accountLink = await stripeClient.v2.core.accountLinks.create({
          account: stripeAccountId,
          use_case: {
            type: "account_onboarding",
            account_onboarding: {
              configurations: ["merchant", "customer"], // Onboard for both merchant and customer
              refresh_url: refreshUrl,   // Where to redirect if the link expires
              return_url: returnUrl,     // Where to redirect after onboarding completes
            },
          },
        });

        return new Response(
          JSON.stringify({ url: accountLink.url }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}. Use "create", "status", or "onboard".` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("stripe-connect-accounts error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
