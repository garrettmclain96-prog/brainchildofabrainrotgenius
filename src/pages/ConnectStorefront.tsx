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
import { stripeConnect } from "@/lib/stripe-connect";

interface Product {
  id: string;
  name: string;
  description: string;
  priceId: string;
  unitAmount: number;
  currency: string;
}

export default function ConnectStorefront() {
  const { accountId } = useParams<{ accountId: string }>();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [purchasing, setPurchasing] = useState<string>(""); // product ID being purchased

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

      // Redirect to Stripe's hosted checkout page
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
      <h1 style={{ fontSize: "1.75rem", fontWeight: 600, marginBottom: "0.25rem" }}>
        Storefront
      </h1>
      <p style={{ fontSize: "0.85rem", opacity: 0.5, marginBottom: "2rem" }}>
        {/* TODO: Replace account ID with a friendly store name in production */}
        Account: {accountId}
      </p>

      {/* Error message */}
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

      {/* Loading state */}
      {loading && (
        <p style={{ textAlign: "center", opacity: 0.5, padding: "3rem 0" }}>
          Loading products...
        </p>
      )}

      {/* Empty state */}
      {!loading && products.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            borderRadius: "0.75rem",
            border: "1px solid",
          }}
          className="bg-card border-border"
        >
          <p style={{ opacity: 0.5 }}>No products available yet.</p>
        </div>
      )}

      {/* Product grid */}
      {!loading && products.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1rem",
          }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              style={{
                padding: "1.25rem",
                borderRadius: "0.75rem",
                border: "1px solid",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
              className="bg-card border-border"
            >
              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                  {product.name}
                </h3>
                {product.description && (
                  <p style={{ fontSize: "0.85rem", opacity: 0.6 }}>{product.description}</p>
                )}
              </div>

              <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "1.25rem", fontWeight: 700 }}>
                  {product.unitAmount ? formatPrice(product.unitAmount, product.currency) : "—"}
                </span>
                <button
                  onClick={() => handlePurchase(product)}
                  disabled={purchasing === product.id}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.5rem",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    opacity: purchasing === product.id ? 0.6 : 1,
                  }}
                  className="bg-primary text-primary-foreground"
                >
                  {purchasing === product.id ? "..." : "Buy"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Navigation links */}
      <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginTop: "2rem" }}>
        <Link
          to="/connect/dashboard"
          style={{
            fontSize: "0.85rem",
            textDecoration: "none",
            opacity: 0.5,
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          ← Dashboard
        </Link>
        <Link
          to="/"
          style={{
            fontSize: "0.85rem",
            textDecoration: "none",
            opacity: 0.5,
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          ← Brainchild
        </Link>
      </div>
    </div>
  );
}
