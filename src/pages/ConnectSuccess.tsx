/**
 * Connect Success Page
 * 
 * Displayed after a successful Stripe Checkout payment.
 * Shows a confirmation message and links back to the storefront or dashboard.
 * 
 * URL: /connect/success
 * Query params:
 *   - session_id: The Checkout Session ID (provided by Stripe)
 */

import { useSearchParams, Link } from "react-router-dom";

export default function ConnectSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
        textAlign: "center",
      }}
      className="bg-background text-foreground"
    >
      {/* Success icon */}
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.75rem",
          marginBottom: "1.5rem",
        }}
        className="bg-decay-fresh/15 text-decay-fresh"
      >
        ✓
      </div>

      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>
        Payment Successful
      </h1>
      <p style={{ opacity: 0.6, marginBottom: "0.5rem", maxWidth: "400px" }}>
        Your payment has been processed. Thank you for your purchase.
      </p>

      {/* Show session ID for reference */}
      {sessionId && (
        <p style={{ fontSize: "0.75rem", opacity: 0.3, marginBottom: "2rem", wordBreak: "break-all" }}>
          Session: {sessionId}
        </p>
      )}

      {/* Navigation links */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          to="/connect/dashboard"
          style={{
            padding: "0.6rem 1.2rem",
            borderRadius: "0.5rem",
            fontSize: "0.9rem",
            fontWeight: 500,
            textDecoration: "none",
          }}
          className="bg-primary text-primary-foreground"
        >
          Go to Dashboard
        </Link>
        <Link
          to="/"
          style={{
            padding: "0.6rem 1.2rem",
            borderRadius: "0.5rem",
            fontSize: "0.9rem",
            textDecoration: "none",
            border: "1px solid",
          }}
          className="bg-transparent border-border text-muted-foreground hover:text-foreground"
        >
          Back to Brainchild
        </Link>
      </div>
    </div>
  );
}
