/**
 * Stripe Connect Checkout Edge Function
 * 
 * Creates Stripe Checkout Sessions for:
 *   1. Direct charges (customer buying from a connected account's storefront)
 *   2. Platform subscriptions (connected account subscribing to a platform plan)
 *   3. Billing portal sessions (connected account managing their subscription)
 * 
 * Endpoints:
 *   POST /stripe-connect-checkout
 *     action: "purchase"           → Direct charge checkout (storefront purchase)
 *     action: "subscribe"          → Platform subscription checkout
 *     action: "billing-portal"     → Billing portal session
 * 
 * Required secrets:
 *   STRIPE_SECRET_KEY — Your Stripe secret key
 */

import Stripe from "npm:stripe@20.3.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // -------------------------------------------------------------------
    // Validate Stripe key
    // PLACEHOLDER: Ensure STRIPE_SECRET_KEY is set in Cloud secrets
    // -------------------------------------------------------------------
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not configured.");
      return new Response(
        JSON.stringify({ error: "Stripe is not configured. Set STRIPE_SECRET_KEY in Cloud secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripeClient = new Stripe(stripeSecretKey);
    const body = await req.json();
    const { action } = body;

    // Get the origin for success/cancel URLs
    const origin = req.headers.get("origin") || "https://brainchildofabrainrotgenius.lovable.app";

    switch (action) {
      // =================================================================
      // ACTION: PURCHASE — Direct charge on a connected account
      // Creates a Checkout Session with an application fee for monetization
      // =================================================================
      case "purchase": {
        const { stripeAccountId, productName, priceInCents, currency, quantity } = body;

        if (!stripeAccountId || !productName || !priceInCents) {
          return new Response(
            JSON.stringify({ error: "stripeAccountId, productName, and priceInCents are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Calculate application fee — 5% of the transaction
        // This is how the platform monetizes transactions
        const applicationFeeAmount = Math.round((priceInCents * (quantity || 1)) * 0.05);

        // Create a Checkout Session as a Direct Charge
        // The connected account is the merchant; the platform takes an application fee
        const session = await stripeClient.checkout.sessions.create(
          {
            line_items: [
              {
                price_data: {
                  currency: currency || "usd",
                  product_data: {
                    name: productName,
                  },
                  unit_amount: priceInCents,
                },
                quantity: quantity || 1,
              },
            ],
            payment_intent_data: {
              // Application fee goes to the platform account
              application_fee_amount: applicationFeeAmount,
            },
            mode: "payment",
            // {CHECKOUT_SESSION_ID} is replaced by Stripe with the actual session ID
            success_url: `${origin}/connect/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/connect/store/${stripeAccountId}`,
          },
          {
            // This header makes the charge appear on the connected account
            stripeAccount: stripeAccountId,
          }
        );

        return new Response(
          JSON.stringify({ url: session.url }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // =================================================================
      // ACTION: TIP — One-time tip/donation to the platform
      // No connected account needed — charges directly on the platform
      // =================================================================
      case "tip": {
        const { amountInCents, sessionId } = body;

        if (!amountInCents || amountInCents < 100) {
          return new Response(
            JSON.stringify({ error: "amountInCents must be at least 100 ($1)" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const session = await stripeClient.checkout.sessions.create({
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: "Support Brainchild",
                  description: "A tip to keep thoughts decaying freely",
                },
                unit_amount: amountInCents,
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${origin}/?tip=thanks`,
          cancel_url: `${origin}/`,
          metadata: { sessionId: sessionId || "anonymous" },
        });

        return new Response(
          JSON.stringify({ url: session.url }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // =================================================================
      // ACTION: PLATFORM-SUBSCRIBE — Session-based platform subscription
      // Creates a checkout for the Inner Sanctum subscription
      // =================================================================
      case "platform-subscribe": {
        const { sessionId: subSessionId, priceId } = body;

        if (!priceId) {
          return new Response(
            JSON.stringify({ error: "priceId is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const session = await stripeClient.checkout.sessions.create({
          mode: "subscription",
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: `${origin}/?subscribed=true`,
          cancel_url: `${origin}/`,
          metadata: { sessionId: subSessionId || "anonymous" },
        });

        return new Response(
          JSON.stringify({ url: session.url }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // =================================================================
      // ACTION: SUBSCRIBE — Platform-level subscription for a connected account
      // Uses customer_account to charge the connected account directly
      // =================================================================
      case "subscribe": {
        const { stripeAccountId: accountId, priceId } = body;

        if (!accountId || !priceId) {
          return new Response(
            JSON.stringify({ error: "stripeAccountId and priceId are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const session = await stripeClient.checkout.sessions.create({
          customer_account: accountId,
          mode: "subscription",
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: `${origin}/connect/dashboard?accountId=${accountId}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/connect/dashboard?accountId=${accountId}`,
        });

        return new Response(
          JSON.stringify({ url: session.url }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // =================================================================
      // ACTION: BILLING-PORTAL — Let connected accounts manage subscriptions
      // =================================================================
      case "billing-portal": {
        const { stripeAccountId: portalAccountId } = body;

        if (!portalAccountId) {
          return new Response(
            JSON.stringify({ error: "stripeAccountId is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const session = await stripeClient.billingPortal.sessions.create({
          customer_account: portalAccountId,
          return_url: `${origin}/connect/dashboard?accountId=${portalAccountId}`,
        });

        return new Response(
          JSON.stringify({ url: session.url }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}. Use "purchase", "tip", "platform-subscribe", "subscribe", or "billing-portal".` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("stripe-connect-checkout error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
