/**
 * Stripe Connect API Helper
 * 
 * Centralizes all Stripe Connect edge function calls.
 * Each function calls the corresponding edge function with the correct action.
 * 
 * Usage:
 *   import { stripeConnect } from "@/lib/stripe-connect";
 *   const account = await stripeConnect.createAccount({ ... });
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Helper to call a Supabase Edge Function
 * Handles headers, error responses, and JSON parsing
 */
async function callEdgeFunction(functionName: string, body: Record<string, unknown>) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

// =================================================================
// Connected Accounts API
// =================================================================

export const stripeConnect = {
  /**
   * Create a new V2 Connected Account
   * Stores the mapping in the database automatically.
   */
  createAccount: (params: {
    sessionId: string;
    displayName: string;
    contactEmail: string;
  }) => callEdgeFunction("stripe-connect-accounts", {
    action: "create",
    ...params,
  }),

  /**
   * Get the onboarding & capability status of a connected account.
   * Always fetched fresh from Stripe (not cached in DB).
   */
  getAccountStatus: (stripeAccountId: string) =>
    callEdgeFunction("stripe-connect-accounts", {
      action: "status",
      stripeAccountId,
    }),

  /**
   * Generate an Account Link for onboarding.
   * Returns a URL to redirect the user to Stripe's onboarding flow.
   */
  createOnboardingLink: (stripeAccountId: string) =>
    callEdgeFunction("stripe-connect-accounts", {
      action: "onboard",
      stripeAccountId,
    }),

  // =================================================================
  // Products API
  // =================================================================

  /**
   * Create a product with a default price on a connected account.
   * The product will appear in the connected account's Stripe Dashboard.
   */
  createProduct: (params: {
    stripeAccountId: string;
    name: string;
    description?: string;
    priceInCents: number;
    currency?: string;
  }) => callEdgeFunction("stripe-connect-products", {
    action: "create",
    ...params,
  }),

  /**
   * List active products on a connected account.
   * Used to populate the storefront.
   */
  listProducts: (stripeAccountId: string) =>
    callEdgeFunction("stripe-connect-products", {
      action: "list",
      stripeAccountId,
    }),

  // =================================================================
  // Checkout & Payments API
  // =================================================================

  /**
   * Create a Checkout Session for a direct charge purchase.
   * Includes an application fee (5%) for platform monetization.
   */
  createPurchaseCheckout: (params: {
    stripeAccountId: string;
    productName: string;
    priceInCents: number;
    currency?: string;
    quantity?: number;
  }) => callEdgeFunction("stripe-connect-checkout", {
    action: "purchase",
    ...params,
  }),

  /**
   * Create a Checkout Session for a platform subscription.
   * Uses customer_account to charge the connected account directly.
   * 
   * PLACEHOLDER: You need to create a Price in your Stripe Dashboard
   * and pass the priceId here. Example: "price_1234567890"
   */
  createSubscriptionCheckout: (params: {
    stripeAccountId: string;
    priceId: string;
  }) => callEdgeFunction("stripe-connect-checkout", {
    action: "subscribe",
    ...params,
  }),

  /**
   * Create a Billing Portal session for a connected account.
   * Allows them to manage their subscription, update payment methods, etc.
   */
  createBillingPortalSession: (stripeAccountId: string) =>
    callEdgeFunction("stripe-connect-checkout", {
      action: "billing-portal",
      stripeAccountId,
    }),
};
