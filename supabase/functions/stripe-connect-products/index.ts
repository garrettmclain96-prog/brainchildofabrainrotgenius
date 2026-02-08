/**
 * Stripe Connect Products Edge Function
 * 
 * Handles creating and listing products on connected accounts.
 * Uses the Stripe-Account header (via stripeAccount option) to act
 * on behalf of the connected account.
 * 
 * Endpoints:
 *   POST /stripe-connect-products
 *     action: "create" → Create a product with a default price on a connected account
 *     action: "list"   → List active products on a connected account
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
    const { action, stripeAccountId, name, description, priceInCents, currency, interval } = body;

    // =================================================================
    // ACTION: CREATE-PLATFORM — Create a product+price at the platform level
    // Used for platform subscriptions (no stripeAccount header)
    // =================================================================
    if (action === "create-platform") {
      if (!name || !priceInCents) {
        return new Response(
          JSON.stringify({ error: "name and priceInCents are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const product = await stripeClient.products.create({
        name: name,
        description: description || "",
        default_price_data: {
          unit_amount: priceInCents,
          currency: currency || "usd",
          recurring: { interval: interval || "month" },
        },
      });

      return new Response(
        JSON.stringify({
          productId: product.id,
          name: product.name,
          defaultPriceId: typeof product.default_price === "string"
            ? product.default_price
            : product.default_price?.id,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!stripeAccountId) {
      return new Response(
        JSON.stringify({ error: "stripeAccountId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    switch (action) {
      // =================================================================
      // ACTION: CREATE — Create a product with a default price
      // =================================================================
      case "create": {
        if (!name || !priceInCents) {
          return new Response(
            JSON.stringify({ error: "name and priceInCents are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create a product on the connected account
        // The `stripeAccount` option sets the Stripe-Account header,
        // making this request act on behalf of the connected account
        const product = await stripeClient.products.create(
          {
            name: name,
            description: description || "",
            default_price_data: {
              unit_amount: priceInCents,          // Price in cents (e.g., 1000 = $10.00)
              currency: currency || "usd",        // Default to USD
            },
          },
          {
            stripeAccount: stripeAccountId, // Stripe-Account header for connected account
          }
        );

        return new Response(
          JSON.stringify({
            productId: product.id,
            name: product.name,
            description: product.description,
            defaultPriceId: typeof product.default_price === "string"
              ? product.default_price
              : product.default_price?.id,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // =================================================================
      // ACTION: LIST — List active products on the connected account
      // =================================================================
      case "list": {
        // List up to 20 active products, expanding the default_price
        // so we can display pricing info without a second API call
        const products = await stripeClient.products.list(
          {
            limit: 20,
            active: true,
            expand: ["data.default_price"], // Include full price object
          },
          {
            stripeAccount: stripeAccountId, // Stripe-Account header
          }
        );

        // Map to a clean response shape for the frontend
        const items = products.data.map((product) => {
          const price = typeof product.default_price === "object" && product.default_price
            ? product.default_price
            : null;

          return {
            id: product.id,
            name: product.name,
            description: product.description,
            priceId: price?.id,
            unitAmount: price?.unit_amount,
            currency: price?.currency,
          };
        });

        return new Response(
          JSON.stringify({ products: items }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}. Use "create" or "list".` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("stripe-connect-products error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
