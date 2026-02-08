/**
 * Connect Dashboard Page
 * 
 * The main dashboard for connected accounts. Allows users to:
 * 1. Create a new connected account
 * 2. View onboarding status and start onboarding
 * 3. Create products on their connected account
 * 4. Subscribe to platform plans
 * 5. Manage billing via the Stripe Billing Portal
 * 
 * URL: /connect/dashboard
 * Query params:
 *   - accountId: Pre-select a connected account after onboarding return
 */

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { stripeConnect } from "@/lib/stripe-connect";
import { getSessionId } from "@/hooks/useSessionId";
import { supabase } from "@/integrations/supabase/client";

// -------------------------------------------------------------------
// Types for the dashboard state
// -------------------------------------------------------------------
interface ConnectedAccount {
  id: string;
  stripe_account_id: string;
  display_name: string;
  contact_email: string;
}

interface AccountStatus {
  accountId: string;
  displayName: string;
  readyToProcessPayments: boolean;
  onboardingComplete: boolean;
  requirementsStatus: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  priceId: string;
  unitAmount: number;
  currency: string;
}

export default function ConnectDashboard() {
  const [searchParams] = useSearchParams();
  const sessionId = getSessionId();

  // -------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  // Form states
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState("");

  // Loading & error states
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // PLACEHOLDER: Set this to your actual Stripe Price ID for the platform subscription
  // Create a product + price in your Stripe Dashboard, then paste the price_xxx ID here
  const PLATFORM_PRICE_ID = "price_PLACEHOLDER_SET_YOUR_PRICE_ID";

  // -------------------------------------------------------------------
  // Load connected accounts from the database on mount
  // -------------------------------------------------------------------
  useEffect(() => {
    loadAccounts();
  }, []);

  // If returning from onboarding, pre-select the account
  useEffect(() => {
    const accountId = searchParams.get("accountId");
    if (accountId && accounts.length > 0) {
      const match = accounts.find((a) => a.stripe_account_id === accountId);
      if (match) {
        setSelectedAccount(match.stripe_account_id);
      }
    }
  }, [searchParams, accounts]);

  // Fetch status and products when an account is selected
  useEffect(() => {
    if (selectedAccount) {
      fetchAccountStatus(selectedAccount);
      fetchProducts(selectedAccount);
    }
  }, [selectedAccount]);

  // -------------------------------------------------------------------
  // Data loading functions
  // -------------------------------------------------------------------
  const loadAccounts = async () => {
    const { data, error: dbError } = await supabase
      .from("connected_accounts")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    if (dbError) {
      console.error("Failed to load accounts:", dbError);
      return;
    }

    setAccounts(data || []);

    // Auto-select the first account if none selected
    if (data && data.length > 0 && !selectedAccount) {
      setSelectedAccount(data[0].stripe_account_id);
    }
  };

  const fetchAccountStatus = async (accountId: string) => {
    setLoading((l) => ({ ...l, status: true }));
    try {
      const status = await stripeConnect.getAccountStatus(accountId);
      setAccountStatus(status);
    } catch (err) {
      console.error("Failed to fetch account status:", err);
      setAccountStatus(null);
    } finally {
      setLoading((l) => ({ ...l, status: false }));
    }
  };

  const fetchProducts = async (accountId: string) => {
    setLoading((l) => ({ ...l, products: true }));
    try {
      const result = await stripeConnect.listProducts(accountId);
      setProducts(result.products || []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setProducts([]);
    } finally {
      setLoading((l) => ({ ...l, products: false }));
    }
  };

  // -------------------------------------------------------------------
  // Action handlers
  // -------------------------------------------------------------------

  /** Create a new connected account */
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading((l) => ({ ...l, create: true }));

    try {
      const result = await stripeConnect.createAccount({
        sessionId,
        displayName: createName,
        contactEmail: createEmail,
      });

      setSuccess(`Account created: ${result.accountId}`);
      setCreateName("");
      setCreateEmail("");
      await loadAccounts();
      setSelectedAccount(result.accountId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading((l) => ({ ...l, create: false }));
    }
  };

  /** Start onboarding for the selected account */
  const handleOnboard = async () => {
    if (!selectedAccount) return;
    setLoading((l) => ({ ...l, onboard: true }));

    try {
      const result = await stripeConnect.createOnboardingLink(selectedAccount);
      // Redirect to Stripe's hosted onboarding
      window.location.href = result.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create onboarding link");
      setLoading((l) => ({ ...l, onboard: false }));
    }
  };

  /** Create a product on the connected account */
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    setError("");
    setSuccess("");
    setLoading((l) => ({ ...l, createProduct: true }));

    try {
      const priceInCents = Math.round(parseFloat(productPrice) * 100);
      if (isNaN(priceInCents) || priceInCents <= 0) {
        throw new Error("Please enter a valid price");
      }

      const result = await stripeConnect.createProduct({
        stripeAccountId: selectedAccount,
        name: productName,
        description: productDescription,
        priceInCents,
      });

      setSuccess(`Product created: ${result.name}`);
      setProductName("");
      setProductDescription("");
      setProductPrice("");
      await fetchProducts(selectedAccount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setLoading((l) => ({ ...l, createProduct: false }));
    }
  };

  /** Subscribe to the platform plan */
  const handleSubscribe = async () => {
    if (!selectedAccount) return;
    setLoading((l) => ({ ...l, subscribe: true }));

    try {
      const result = await stripeConnect.createSubscriptionCheckout({
        stripeAccountId: selectedAccount,
        priceId: PLATFORM_PRICE_ID,
      });
      window.location.href = result.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create subscription");
      setLoading((l) => ({ ...l, subscribe: false }));
    }
  };

  /** Open the billing portal */
  const handleBillingPortal = async () => {
    if (!selectedAccount) return;
    setLoading((l) => ({ ...l, portal: true }));

    try {
      const result = await stripeConnect.createBillingPortalSession(selectedAccount);
      window.location.href = result.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open billing portal");
      setLoading((l) => ({ ...l, portal: false }));
    }
  };

  // -------------------------------------------------------------------
  // Helper to format currency
  // -------------------------------------------------------------------
  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "usd",
    }).format(amount / 100);
  };

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem",
        fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
      }}
      className="bg-background text-foreground"
    >
      <h1
        style={{ fontSize: "1.75rem", fontWeight: 600, marginBottom: "0.5rem" }}
        className="text-foreground"
      >
        Stripe Connect Dashboard
      </h1>
      <p style={{ marginBottom: "2rem", opacity: 0.6 }} className="text-muted-foreground">
        Manage your connected accounts, products, and subscriptions.
      </p>

      {/* Error / Success messages */}
      {error && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            marginBottom: "1rem",
            border: "1px solid",
          }}
          className="bg-destructive/10 border-destructive/30 text-destructive"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            marginBottom: "1rem",
            border: "1px solid",
          }}
          className="bg-decay-fresh/10 border-decay-fresh/30 text-decay-fresh"
        >
          {success}
        </div>
      )}

      {/* ============================================================= */}
      {/* SECTION 1: Create Connected Account */}
      {/* ============================================================= */}
      <section
        style={{
          padding: "1.5rem",
          borderRadius: "0.75rem",
          marginBottom: "1.5rem",
          border: "1px solid",
        }}
        className="bg-card border-border"
      >
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>
          Create Connected Account
        </h2>
        <form onSubmit={handleCreateAccount} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <input
            type="text"
            placeholder="Display Name"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            required
            style={{
              padding: "0.6rem 0.8rem",
              borderRadius: "0.5rem",
              border: "1px solid",
              fontSize: "0.9rem",
            }}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
          <input
            type="email"
            placeholder="Contact Email"
            value={createEmail}
            onChange={(e) => setCreateEmail(e.target.value)}
            required
            style={{
              padding: "0.6rem 0.8rem",
              borderRadius: "0.5rem",
              border: "1px solid",
              fontSize: "0.9rem",
            }}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={loading.create}
            style={{
              padding: "0.6rem 1.2rem",
              borderRadius: "0.5rem",
              border: "none",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: 500,
              opacity: loading.create ? 0.6 : 1,
            }}
            className="bg-primary text-primary-foreground"
          >
            {loading.create ? "Creating..." : "Create Account"}
          </button>
        </form>
      </section>

      {/* ============================================================= */}
      {/* SECTION 2: Select Account & Onboarding Status */}
      {/* ============================================================= */}
      {accounts.length > 0 && (
        <section
          style={{
            padding: "1.5rem",
            borderRadius: "0.75rem",
            marginBottom: "1.5rem",
            border: "1px solid",
          }}
          className="bg-card border-border"
        >
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>
            Account & Onboarding
          </h2>

          {/* Account selector */}
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            style={{
              width: "100%",
              padding: "0.6rem 0.8rem",
              borderRadius: "0.5rem",
              border: "1px solid",
              fontSize: "0.9rem",
              marginBottom: "1rem",
            }}
            className="bg-input border-border text-foreground"
          >
            {accounts.map((acc) => (
              <option key={acc.stripe_account_id} value={acc.stripe_account_id}>
                {acc.display_name} ({acc.stripe_account_id})
              </option>
            ))}
          </select>

          {/* Onboarding status */}
          {loading.status ? (
            <p style={{ opacity: 0.5 }}>Loading status...</p>
          ) : accountStatus ? (
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                <StatusBadge
                  label="Onboarding"
                  active={accountStatus.onboardingComplete}
                  activeText="Complete"
                  inactiveText={accountStatus.requirementsStatus || "Incomplete"}
                />
                <StatusBadge
                  label="Payments"
                  active={accountStatus.readyToProcessPayments}
                  activeText="Active"
                  inactiveText="Not Ready"
                />
              </div>

              {!accountStatus.onboardingComplete && (
                <button
                  onClick={handleOnboard}
                  disabled={loading.onboard}
                  style={{
                    padding: "0.6rem 1.2rem",
                    borderRadius: "0.5rem",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    opacity: loading.onboard ? 0.6 : 1,
                  }}
                  className="bg-primary text-primary-foreground"
                >
                  {loading.onboard ? "Redirecting..." : "Onboard to Collect Payments"}
                </button>
              )}
            </div>
          ) : null}

          {/* View storefront link */}
          {selectedAccount && (
            <a
              href={`/connect/store/${selectedAccount}`}
              style={{
                display: "inline-block",
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                fontSize: "0.85rem",
                textDecoration: "none",
                border: "1px solid",
              }}
              className="border-border text-muted-foreground hover:text-foreground"
            >
              {/* TODO: In production, use a readable slug instead of the Stripe account ID */}
              View Storefront →
            </a>
          )}
        </section>
      )}

      {/* ============================================================= */}
      {/* SECTION 3: Create Products */}
      {/* ============================================================= */}
      {selectedAccount && accountStatus?.readyToProcessPayments && (
        <section
          style={{
            padding: "1.5rem",
            borderRadius: "0.75rem",
            marginBottom: "1.5rem",
            border: "1px solid",
          }}
          className="bg-card border-border"
        >
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>
            Create Product
          </h2>
          <form onSubmit={handleCreateProduct} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input
              type="text"
              placeholder="Product Name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
              style={{
                padding: "0.6rem 0.8rem",
                borderRadius: "0.5rem",
                border: "1px solid",
                fontSize: "0.9rem",
              }}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              style={{
                padding: "0.6rem 0.8rem",
                borderRadius: "0.5rem",
                border: "1px solid",
                fontSize: "0.9rem",
              }}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
            <input
              type="number"
              placeholder="Price (USD)"
              value={productPrice}
              onChange={(e) => setProductPrice(e.target.value)}
              required
              min="0.50"
              step="0.01"
              style={{
                padding: "0.6rem 0.8rem",
                borderRadius: "0.5rem",
                border: "1px solid",
                fontSize: "0.9rem",
              }}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={loading.createProduct}
              style={{
                padding: "0.6rem 1.2rem",
                borderRadius: "0.5rem",
                border: "none",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 500,
                opacity: loading.createProduct ? 0.6 : 1,
              }}
              className="bg-primary text-primary-foreground"
            >
              {loading.createProduct ? "Creating..." : "Create Product"}
            </button>
          </form>

          {/* Product list */}
          {products.length > 0 && (
            <div style={{ marginTop: "1.5rem" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 500, marginBottom: "0.75rem", opacity: 0.7 }}>
                Your Products
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {products.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      padding: "0.75rem 1rem",
                      borderRadius: "0.5rem",
                      border: "1px solid",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                    className="bg-background border-border"
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>{product.name}</div>
                      {product.description && (
                        <div style={{ fontSize: "0.8rem", opacity: 0.6 }}>{product.description}</div>
                      )}
                    </div>
                    <div style={{ fontWeight: 600 }}>
                      {product.unitAmount ? formatPrice(product.unitAmount, product.currency) : "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ============================================================= */}
      {/* SECTION 4: Platform Subscription */}
      {/* ============================================================= */}
      {selectedAccount && (
        <section
          style={{
            padding: "1.5rem",
            borderRadius: "0.75rem",
            marginBottom: "1.5rem",
            border: "1px solid",
          }}
          className="bg-card border-border"
        >
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Platform Subscription
          </h2>
          <p style={{ fontSize: "0.85rem", opacity: 0.6, marginBottom: "1rem" }}>
            Subscribe to unlock premium platform features.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              onClick={handleSubscribe}
              disabled={loading.subscribe}
              style={{
                padding: "0.6rem 1.2rem",
                borderRadius: "0.5rem",
                border: "none",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 500,
                opacity: loading.subscribe ? 0.6 : 1,
              }}
              className="bg-primary text-primary-foreground"
            >
              {loading.subscribe ? "Redirecting..." : "Subscribe"}
            </button>
            <button
              onClick={handleBillingPortal}
              disabled={loading.portal}
              style={{
                padding: "0.6rem 1.2rem",
                borderRadius: "0.5rem",
                border: "1px solid",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 500,
                opacity: loading.portal ? 0.6 : 1,
              }}
              className="bg-transparent border-border text-foreground"
            >
              {loading.portal ? "Opening..." : "Manage Billing"}
            </button>
          </div>
        </section>
      )}

      {/* Back to app link */}
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <a
          href="/"
          style={{
            fontSize: "0.85rem",
            textDecoration: "none",
            opacity: 0.5,
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          ← Back to Brainchild
        </a>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// StatusBadge — Small component to show active/inactive status
// -------------------------------------------------------------------
function StatusBadge({
  label,
  active,
  activeText,
  inactiveText,
}: {
  label: string;
  active: boolean;
  activeText: string;
  inactiveText: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.35rem 0.75rem",
        borderRadius: "999px",
        fontSize: "0.8rem",
        fontWeight: 500,
        border: "1px solid",
      }}
      className={active ? "bg-decay-fresh/10 border-decay-fresh/30 text-decay-fresh" : "bg-muted border-border text-muted-foreground"}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          display: "inline-block",
        }}
        className={active ? "bg-decay-fresh" : "bg-muted-foreground"}
      />
      {label}: {active ? activeText : inactiveText}
    </div>
  );
}
