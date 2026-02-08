/**
 * Storefront Page
 * 
 * Displays products from a connected account and allows customers to purchase.
 * Each connected account has their own storefront at /connect/store/:accountId
 * 
 * TODO: In production, use a readable slug or custom domain instead of the
 * Stripe account ID (acct_...) in the URL. The account ID is used here for
 * simplicity in the demo.
 * 
 * URL: /connect/store/:accountId
 */

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { stripeConnect } from "@/lib/stripe-connect";
import { FogBackground } from "@/components/FogBackground";

interface Product {
  id: string;
  name: string;
  description: string;
  priceId: string;
  unitAmount: number;
  currency: string;
}

const smoothEase: [number, number, number, number] = [0.23, 1, 0.32, 1];

export default function ConnectStorefront() {
  const { accountId } = useParams<{ accountId: string }>();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [purchasing, setPurchasing] = useState<string>("");

  // -------------------------------------------------------------------
  // Load products from the connected account on mount
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!accountId) return;

    const loadProducts = async () => {
      setLoading(true);
      try {
        const result = await stripeConnect.listProducts(accountId);
        setProducts(result.products || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [accountId]);

  // -------------------------------------------------------------------
  // Handle product purchase — redirects to Stripe Checkout
  // -------------------------------------------------------------------
  const handlePurchase = async (product: Product) => {
    if (!accountId) return;
    setPurchasing(product.id);

    try {
      const result = await stripeConnect.createPurchaseCheckout({
        stripeAccountId: accountId,
        productName: product.name,
        priceInCents: product.unitAmount,
        currency: product.currency,
        quantity: 1,
      });

      window.location.href = result.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
      setPurchasing("");
    }
  };

  // -------------------------------------------------------------------
  // Format currency for display
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Atmospheric background layers */}
      <FogBackground />
      <div className="noise-overlay" />
      <div className="vignette" />

      {/* Content */}
      <div className="relative z-10 px-6 py-8 pb-28 max-w-2xl mx-auto">
        {/* Header */}
        <motion.header
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: smoothEase }}
        >
          <h1 className="font-display text-foreground/70 tracking-[0.2em] text-lg uppercase mb-1">
            storefront
          </h1>
          <p className="text-[10px] font-sans text-muted-foreground/25 tracking-widest">
            {/* TODO: Replace account ID with a friendly store name in production */}
            {accountId}
          </p>
        </motion.header>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="glass-premium rounded-xl p-3 mb-4 border border-destructive/20 text-destructive/80 text-sm font-thought italic tracking-wide"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading state */}
        {loading && (
          <motion.p
            className="text-center font-thought text-muted-foreground/30 italic tracking-wider py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            loading...
          </motion.p>
        )}

        {/* Empty state */}
        {!loading && products.length === 0 && (
          <motion.div
            className="glass-premium rounded-2xl p-8 text-center"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: smoothEase }}
          >
            <p className="font-thought text-muted-foreground/30 italic tracking-wider">
              nothing here yet
            </p>
          </motion.div>
        )}

        {/* Product grid */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                className="glass-premium rounded-2xl p-5 flex flex-col gap-3 group"
                initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.5, ease: smoothEase, delay: i * 0.08 }}
              >
                <div className="flex-1">
                  <h3 className="text-sm font-thought text-foreground/70 tracking-wide mb-1">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-xs font-thought text-muted-foreground/30 italic leading-relaxed">
                      {product.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/10">
                  <span className="text-base font-thought text-foreground/50 tracking-wide">
                    {product.unitAmount ? formatPrice(product.unitAmount, product.currency) : "—"}
                  </span>
                  <motion.button
                    onClick={() => handlePurchase(product)}
                    disabled={purchasing === product.id}
                    className="px-4 py-2 rounded-xl text-xs font-thought text-foreground/50 border border-primary/20 hover:border-primary/40 hover:text-foreground/70 transition-all duration-700 italic tracking-wider disabled:opacity-40"
                    whileTap={{ scale: 0.95 }}
                  >
                    {purchasing === product.id ? "..." : "buy"}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Navigation links */}
        <motion.div
          className="flex justify-center gap-6 mt-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <Link
            to="/connect/dashboard"
            className="text-xs font-thought text-muted-foreground/30 tracking-wider hover:text-muted-foreground/50 transition-all duration-500 italic"
          >
            ← dashboard
          </Link>
          <Link
            to="/"
            className="text-xs font-thought text-muted-foreground/30 tracking-wider hover:text-muted-foreground/50 transition-all duration-500 italic"
          >
            ← brainchild
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
