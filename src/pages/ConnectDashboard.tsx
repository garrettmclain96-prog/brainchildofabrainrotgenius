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

import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { stripeConnect } from "@/lib/stripe-connect";
import { getSessionId } from "@/hooks/useSessionId";
import { supabase } from "@/integrations/supabase/client";
import { FogBackground } from "@/components/FogBackground";
import { ArrowLeft } from "lucide-react";

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

const smoothEase: [number, number, number, number] = [0.23, 1, 0.32, 1];

const sectionVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(6px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: smoothEase, delay: i * 0.1 },
  }),
};

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

  // Platform subscription price ID — created via Stripe API
  // Product: "Brainchild Platform Subscription" (prod_TwJSGjju5v6x3a) — $9.99/month
  const PLATFORM_PRICE_ID = "price_1SyQp8C1A9HaROZtqOcQvbjV";

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

      setSuccess(`account created: ${result.accountId}`);
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

      setSuccess(`product created: ${result.name}`);
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
  // Section index counter for staggered animations
  // -------------------------------------------------------------------
  let sectionIndex = 0;

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Atmospheric background layers */}
      <FogBackground />
      <div className="noise-overlay" />
      <div className="vignette" />

      {/* Content */}
      <div className="relative z-10 px-6 py-8 pb-28 max-w-lg mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: smoothEase }}
        >
          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-thought text-muted-foreground/40 tracking-wider hover:text-muted-foreground/60 transition-all duration-500 italic mb-4"
          >
            <ArrowLeft className="w-3 h-3" />
            back to controls
          </Link>
        </motion.div>

        <motion.header
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: smoothEase }}
        >
          <h1 className="font-display text-foreground/70 tracking-[0.2em] text-lg uppercase mb-1">
            connect
          </h1>
          <p className="text-xs font-thought text-muted-foreground/40 tracking-wider italic">
            manage accounts, products, and subscriptions
          </p>
        </motion.header>

        {/* Error / Success messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="glass-premium rounded-xl p-3 mb-4 border border-destructive/20 text-destructive/80 text-sm font-thought italic tracking-wide"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {success && (
            <motion.div
              className="glass-premium rounded-xl p-3 mb-4 border border-decay-fresh/20 text-decay-fresh/80 text-sm font-thought italic tracking-wide"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================= */}
        {/* SECTION 1: Create Connected Account */}
        {/* ============================================================= */}
        <motion.section
          className="glass-premium rounded-2xl p-5 mb-5"
          custom={sectionIndex++}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          <h2 className="text-sm font-thought text-foreground/60 tracking-wider mb-4 italic">
            create account
          </h2>
          <form onSubmit={handleCreateAccount} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="display name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-background/30 border border-border/30 text-foreground/80 placeholder:text-muted-foreground/30 text-sm font-thought tracking-wide focus:outline-none focus:border-primary/30 transition-all duration-500"
            />
            <input
              type="email"
              placeholder="contact email"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-background/30 border border-border/30 text-foreground/80 placeholder:text-muted-foreground/30 text-sm font-thought tracking-wide focus:outline-none focus:border-primary/30 transition-all duration-500"
            />
            <motion.button
              type="submit"
              disabled={loading.create}
              className="w-full px-4 py-3 rounded-xl bg-primary/20 border border-primary/20 text-foreground/60 text-sm font-thought tracking-wider italic hover:bg-primary/30 hover:border-primary/30 hover:text-foreground/80 transition-all duration-700 disabled:opacity-40"
              whileTap={{ scale: 0.98 }}
            >
              {loading.create ? "creating..." : "create account"}
            </motion.button>
          </form>
        </motion.section>

        {/* ============================================================= */}
        {/* SECTION 2: Select Account & Onboarding Status */}
        {/* ============================================================= */}
        {accounts.length > 0 && (
          <motion.section
            className="glass-premium rounded-2xl p-5 mb-5"
            custom={sectionIndex++}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className="text-sm font-thought text-foreground/60 tracking-wider mb-4 italic">
              account & onboarding
            </h2>

            {/* Account selector */}
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background/30 border border-border/30 text-foreground/70 text-sm font-thought tracking-wide mb-4 focus:outline-none focus:border-primary/30 transition-all duration-500 appearance-none"
            >
              {accounts.map((acc) => (
                <option key={acc.stripe_account_id} value={acc.stripe_account_id}>
                  {acc.display_name} · {acc.stripe_account_id}
                </option>
              ))}
            </select>

            {/* Onboarding status */}
            {loading.status ? (
              <p className="text-xs font-thought text-muted-foreground/30 italic tracking-wider">
                loading status...
              </p>
            ) : accountStatus ? (
              <div className="mb-4">
                <div className="flex gap-3 flex-wrap mb-4">
                  <StatusBadge
                    label="onboarding"
                    active={accountStatus.onboardingComplete}
                    activeText="complete"
                    inactiveText={accountStatus.requirementsStatus || "incomplete"}
                  />
                  <StatusBadge
                    label="payments"
                    active={accountStatus.readyToProcessPayments}
                    activeText="active"
                    inactiveText="not ready"
                  />
                </div>

                {!accountStatus.onboardingComplete && (
                  <motion.button
                    onClick={handleOnboard}
                    disabled={loading.onboard}
                    className="px-5 py-2.5 rounded-xl text-sm font-thought text-foreground/60 border border-primary/20 hover:border-primary/40 hover:text-foreground/80 transition-all duration-700 italic tracking-wide disabled:opacity-40"
                    whileTap={{ scale: 0.95 }}
                  >
                    {loading.onboard ? "redirecting..." : "onboard to collect payments"}
                  </motion.button>
                )}
              </div>
            ) : null}

            {/* View storefront link */}
            {selectedAccount && (
              <Link
                to={`/connect/store/${selectedAccount}`}
                className="inline-block text-xs font-thought text-muted-foreground/40 tracking-wider hover:text-muted-foreground/60 transition-all duration-500 italic"
              >
                {/* TODO: In production, use a readable slug instead of the Stripe account ID */}
                view storefront →
              </Link>
            )}
          </motion.section>
        )}

        {/* ============================================================= */}
        {/* SECTION 3: Create Products */}
        {/* ============================================================= */}
        {selectedAccount && accountStatus?.readyToProcessPayments && (
          <motion.section
            className="glass-premium rounded-2xl p-5 mb-5"
            custom={sectionIndex++}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className="text-sm font-thought text-foreground/60 tracking-wider mb-4 italic">
              create product
            </h2>
            <form onSubmit={handleCreateProduct} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="product name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-background/30 border border-border/30 text-foreground/80 placeholder:text-muted-foreground/30 text-sm font-thought tracking-wide focus:outline-none focus:border-primary/30 transition-all duration-500"
              />
              <input
                type="text"
                placeholder="description (optional)"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-background/30 border border-border/30 text-foreground/80 placeholder:text-muted-foreground/30 text-sm font-thought tracking-wide focus:outline-none focus:border-primary/30 transition-all duration-500"
              />
              <input
                type="number"
                placeholder="price (usd)"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                required
                min="0.50"
                step="0.01"
                className="w-full px-4 py-3 rounded-xl bg-background/30 border border-border/30 text-foreground/80 placeholder:text-muted-foreground/30 text-sm font-thought tracking-wide focus:outline-none focus:border-primary/30 transition-all duration-500"
              />
              <motion.button
                type="submit"
                disabled={loading.createProduct}
                className="w-full px-4 py-3 rounded-xl bg-primary/20 border border-primary/20 text-foreground/60 text-sm font-thought tracking-wider italic hover:bg-primary/30 hover:border-primary/30 hover:text-foreground/80 transition-all duration-700 disabled:opacity-40"
                whileTap={{ scale: 0.98 }}
              >
                {loading.createProduct ? "creating..." : "create product"}
              </motion.button>
            </form>

            {/* Product list */}
            {products.length > 0 && (
              <div className="mt-5 space-y-2">
                <h3 className="text-xs font-thought text-muted-foreground/40 tracking-wider italic mb-3">
                  your products
                </h3>
                {products.map((product, i) => (
                  <motion.div
                    key={product.id}
                    className="flex items-center justify-between rounded-xl bg-background/20 border border-border/20 px-4 py-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                  >
                    <div>
                      <span className="text-sm font-thought text-foreground/70 tracking-wide">
                        {product.name}
                      </span>
                      {product.description && (
                        <span className="block text-xs text-muted-foreground/30 font-thought italic">
                          {product.description}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-thought text-foreground/50 tracking-wide">
                      {product.unitAmount ? formatPrice(product.unitAmount, product.currency) : "—"}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>
        )}

        {/* ============================================================= */}
        {/* SECTION 4: Platform Subscription */}
        {/* ============================================================= */}
        {selectedAccount && (
          <motion.section
            className="glass-premium rounded-2xl p-5 mb-5"
            custom={sectionIndex++}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className="text-sm font-thought text-foreground/60 tracking-wider mb-1 italic">
              platform subscription
            </h2>
            <p className="text-xs font-thought text-muted-foreground/30 tracking-wider italic mb-4">
              unlock premium platform features
            </p>
            <div className="flex gap-3 flex-wrap">
              <motion.button
                onClick={handleSubscribe}
                disabled={loading.subscribe}
                className="px-5 py-2.5 rounded-xl text-sm font-thought text-foreground/60 bg-primary/20 border border-primary/20 hover:bg-primary/30 hover:text-foreground/80 transition-all duration-700 italic tracking-wide disabled:opacity-40"
                whileTap={{ scale: 0.95 }}
              >
                {loading.subscribe ? "redirecting..." : "subscribe"}
              </motion.button>
              <motion.button
                onClick={handleBillingPortal}
                disabled={loading.portal}
                className="px-5 py-2.5 rounded-xl text-sm font-thought text-foreground/40 border border-border/30 hover:border-border/50 hover:text-foreground/60 transition-all duration-700 italic tracking-wide disabled:opacity-40"
                whileTap={{ scale: 0.95 }}
              >
                {loading.portal ? "opening..." : "manage billing"}
              </motion.button>
            </div>
          </motion.section>
        )}

        {/* Back to app link */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <Link
            to="/"
            className="text-xs font-thought text-muted-foreground/30 tracking-wider hover:text-muted-foreground/50 transition-all duration-500 italic"
          >
            ← back to brainchild
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// StatusBadge — ethereal status indicator
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
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-thought tracking-wider italic border ${
        active
          ? "border-decay-fresh/20 text-decay-fresh/70 bg-decay-fresh/5"
          : "border-border/20 text-muted-foreground/40 bg-background/20"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          active ? "bg-decay-fresh/60" : "bg-muted-foreground/30"
        }`}
      />
      {label} : {active ? activeText : inactiveText}
    </div>
  );
}
