/**
 * Stripe Connect Webhooks Edge Function
 * 
 * Handles TWO types of webhook events:
 * 
 * 1. V2 "thin" events — For connected account requirement/capability changes
 *    These use Stripe's new thin event format and require fetching the full event.
 *    Events:
 *      - v2.core.account[requirements].updated
 *      - v2.core.account[configuration.merchant].capability_status_updated
 *      - v2.core.account[configuration.customer].capability_status_updated
 * 
 * 2. V1 "full" events — For subscription lifecycle management
 *    These use the traditional webhook format with full event data.
 *    Events:
 *      - customer.subscription.created
 *      - customer.subscription.updated
 *      - customer.subscription.deleted
 *      - invoice.paid
 *      - invoice.payment_failed
 * 
 * Webhook Setup:
 *   1. Go to Stripe Dashboard → Developers → Webhooks
 *   2. Click "+ Add destination"
 *   3. For V2 events: Select "Connected accounts", enable thin payload style
 *   4. For V1 events: Select the subscription events listed above
 *   5. Set the endpoint URL to this function's URL
 *   6. Copy the signing secret to STRIPE_WEBHOOK_SECRET in Cloud secrets
 * 
 * Local Testing with Stripe CLI:
 *   # For V2 thin events:
 *   stripe listen --thin-events \
 *     'v2.core.account[requirements].updated,v2.core.account[configuration.merchant].capability_status_updated,v2.core.account[configuration.customer].capability_status_updated' \
 *     --forward-thin-to http://localhost:54321/functions/v1/stripe-connect-webhooks
 * 
 *   # For V1 subscription events:
 *   stripe listen \
 *     --events 'customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.paid,invoice.payment_failed' \
 *     --forward-to http://localhost:54321/functions/v1/stripe-connect-webhooks
 * 
 * Required secrets:
 *   STRIPE_SECRET_KEY     — Your Stripe secret key
 *   STRIPE_WEBHOOK_SECRET — Webhook signing secret (whsec_...)
 */

import Stripe from "npm:stripe@20.3.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// No CORS headers needed for webhooks — Stripe sends server-to-server requests
// But we include minimal headers for error responses
const responseHeaders = { "Content-Type": "application/json" };

Deno.serve(async (req) => {
  // Webhooks are always POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: responseHeaders,
    });
  }

  try {
    // -------------------------------------------------------------------
    // Step 1: Validate required secrets
    // -------------------------------------------------------------------
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not configured.");
      return new Response(
        JSON.stringify({ error: "Stripe is not configured" }),
        { status: 500, headers: responseHeaders }
      );
    }

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not configured. Set it in Cloud secrets.");
      return new Response(
        JSON.stringify({ error: "Webhook secret is not configured" }),
        { status: 500, headers: responseHeaders }
      );
    }

    const stripeClient = new Stripe(stripeSecretKey);

    // -------------------------------------------------------------------
    // Step 2: Initialize Supabase (service role for DB writes)
    // -------------------------------------------------------------------
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // -------------------------------------------------------------------
    // Step 3: Get the raw body and signature for verification
    // -------------------------------------------------------------------
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { status: 400, headers: responseHeaders }
      );
    }

    // -------------------------------------------------------------------
    // Step 4: Try to parse as a thin event first (V2 format)
    // If it fails, fall back to constructing a standard V1 event
    // -------------------------------------------------------------------
    let isThinEvent = false;
    let thinEvent: any = null;

    try {
      // parseThinEvent verifies the signature and parses the thin event envelope
      thinEvent = stripeClient.parseThinEvent(rawBody, signature, webhookSecret);
      isThinEvent = true;
    } catch (_thinError) {
      // Not a thin event — try V1 format below
      isThinEvent = false;
    }

    // =================================================================
    // HANDLE V2 THIN EVENTS — Account requirements & capability changes
    // =================================================================
    if (isThinEvent && thinEvent) {
      console.log(`Received thin event: ${thinEvent.type} (ID: ${thinEvent.id})`);

      // Fetch the full event data to understand what changed
      const fullEvent = await stripeClient.v2.core.events.retrieve(thinEvent.id);

      switch (thinEvent.type) {
        // ---------------------------------------------------------------
        // Requirements changed on a connected account
        // This happens when regulators or card networks update requirements
        // ---------------------------------------------------------------
        case "v2.core.account[requirements].updated": {
          const accountId = fullEvent.related_object?.id;
          console.log(`Requirements updated for account: ${accountId}`);

          if (accountId) {
            // Retrieve the account to check current requirements status
            const account = await stripeClient.v2.core.accounts.retrieve(accountId, {
              include: ["requirements"],
            });

            const requirementsStatus =
              account.requirements?.summary?.minimum_deadline?.status;

            console.log(`Account ${accountId} requirements status: ${requirementsStatus}`);

            // TODO: If you need to notify users about requirement changes,
            // you could store this in the database or send a notification.
            // For now, we log it for monitoring.
          }
          break;
        }

        // ---------------------------------------------------------------
        // Merchant capability status changed
        // ---------------------------------------------------------------
        case "v2.core.account[configuration.merchant].capability_status_updated": {
          const accountId = fullEvent.related_object?.id;
          console.log(`Merchant capability status updated for account: ${accountId}`);

          if (accountId) {
            const account = await stripeClient.v2.core.accounts.retrieve(accountId, {
              include: ["configuration.merchant"],
            });

            const cardPaymentsStatus =
              account?.configuration?.merchant?.capabilities?.card_payments?.status;

            console.log(`Account ${accountId} card_payments status: ${cardPaymentsStatus}`);

            // TODO: Update your database if you track capability status
          }
          break;
        }

        // ---------------------------------------------------------------
        // Customer capability status changed
        // ---------------------------------------------------------------
        case "v2.core.account[configuration.customer].capability_status_updated": {
          const accountId = fullEvent.related_object?.id;
          console.log(`Customer capability status updated for account: ${accountId}`);
          // TODO: Handle customer capability changes if needed
          break;
        }

        default:
          console.log(`Unhandled thin event type: ${thinEvent.type}`);
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: responseHeaders,
      });
    }

    // =================================================================
    // HANDLE V1 EVENTS — Subscription lifecycle management
    // =================================================================
    let event: Stripe.Event;
    try {
      event = stripeClient.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400, headers: responseHeaders }
      );
    }

    console.log(`Received V1 event: ${event.type} (ID: ${event.id})`);

    switch (event.type) {
      // ---------------------------------------------------------------
      // SUBSCRIPTION CREATED — A new subscription was created
      // ---------------------------------------------------------------
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        // For V2 accounts, use customer_account (acct_...) instead of customer ID
        const accountId = (subscription as any).customer_account || subscription.customer;

        console.log(`Subscription created for account: ${accountId}`);

        // Store or update the subscription status in the database
        const { error } = await supabase.from("subscription_status").upsert(
          {
            stripe_account_id: typeof accountId === "string" ? accountId : "",
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            price_id: subscription.items?.data?.[0]?.price?.id || null,
            current_period_end: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
            cancel_at_period_end: subscription.cancel_at_period_end,
          },
          { onConflict: "stripe_account_id" }
        );

        if (error) console.error("Failed to store subscription:", error);
        break;
      }

      // ---------------------------------------------------------------
      // SUBSCRIPTION UPDATED — Upgrades, downgrades, cancellations, pauses
      // ---------------------------------------------------------------
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const accountId = (subscription as any).customer_account || subscription.customer;

        console.log(`Subscription updated for account: ${accountId}, status: ${subscription.status}`);

        // Check for cancellation at period end
        if (subscription.cancel_at_period_end) {
          console.log(`Subscription will cancel at period end for account: ${accountId}`);
        }

        // Check for pause
        const pauseCollection = (subscription as any).pause_collection;
        if (pauseCollection) {
          console.log(`Subscription paused for account: ${accountId}, resumes at: ${pauseCollection.resumes_at}`);
        }

        // Update the subscription status in the database
        const { error } = await supabase.from("subscription_status").upsert(
          {
            stripe_account_id: typeof accountId === "string" ? accountId : "",
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            price_id: subscription.items?.data?.[0]?.price?.id || null,
            current_period_end: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
            cancel_at_period_end: subscription.cancel_at_period_end,
          },
          { onConflict: "stripe_account_id" }
        );

        if (error) console.error("Failed to update subscription:", error);
        break;
      }

      // ---------------------------------------------------------------
      // SUBSCRIPTION DELETED — Subscription was fully cancelled
      // ---------------------------------------------------------------
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const accountId = (subscription as any).customer_account || subscription.customer;

        console.log(`Subscription deleted for account: ${accountId}`);

        // Update the status to "canceled" and revoke access
        const { error } = await supabase.from("subscription_status").upsert(
          {
            stripe_account_id: typeof accountId === "string" ? accountId : "",
            stripe_subscription_id: subscription.id,
            status: "canceled",
            cancel_at_period_end: false,
          },
          { onConflict: "stripe_account_id" }
        );

        if (error) console.error("Failed to update canceled subscription:", error);

        // TODO: Revoke access to premium features for this account
        break;
      }

      // ---------------------------------------------------------------
      // INVOICE PAID — Payment was successful
      // ---------------------------------------------------------------
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const accountId = (invoice as any).customer_account || invoice.customer;

        console.log(`Invoice paid for account: ${accountId}, amount: ${invoice.amount_paid}`);

        // TODO: Grant or confirm access to the subscribed product
        // You might also want to store invoice records for billing history
        break;
      }

      // ---------------------------------------------------------------
      // INVOICE PAYMENT FAILED — Payment attempt failed
      // ---------------------------------------------------------------
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const accountId = (invoice as any).customer_account || invoice.customer;

        console.log(`Invoice payment failed for account: ${accountId}`);

        // TODO: Notify the user about the failed payment
        // Stripe will retry automatically based on your retry settings
        break;
      }

      default:
        console.log(`Unhandled V1 event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("stripe-connect-webhooks error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Webhook processing failed",
      }),
      { status: 500, headers: responseHeaders }
    );
  }
});
