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
import { motion } from "framer-motion";
import { FogBackground } from "@/components/FogBackground";

const smoothEase: [number, number, number, number] = [0.23, 1, 0.32, 1];

export default function ConnectSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Atmospheric background layers */}
      <FogBackground />
      <div className="noise-overlay" />
      <div className="vignette" />

      {/* Content */}
      <div className="relative z-10 px-6 text-center max-w-md mx-auto">
        {/* Success glow */}
        <motion.div
          className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{
            background: "radial-gradient(circle, hsl(var(--decay-fresh) / 0.15) 0%, transparent 70%)",
            boxShadow: "0 0 40px hsl(var(--decay-fresh) / 0.1)",
          }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: smoothEase }}
        >
          <motion.span
            className="text-decay-fresh/60 text-2xl font-thought"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            ✓
          </motion.span>
        </motion.div>

        <motion.h1
          className="font-display text-foreground/70 tracking-[0.2em] text-lg uppercase mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: smoothEase }}
        >
          complete
        </motion.h1>

        <motion.p
          className="font-thought text-muted-foreground/40 text-sm italic tracking-wide mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: smoothEase }}
        >
          your payment has been processed
        </motion.p>

        {/* Show session ID for reference */}
        {sessionId && (
          <motion.p
            className="text-[10px] font-sans text-muted-foreground/20 tracking-widest mb-8 break-all"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            {sessionId}
          </motion.p>
        )}

        {/* Navigation links */}
        <motion.div
          className="flex gap-4 flex-wrap justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: smoothEase }}
        >
          <Link
            to="/connect/dashboard"
            className="px-5 py-2.5 rounded-xl text-sm font-thought text-foreground/60 bg-primary/20 border border-primary/20 hover:bg-primary/30 hover:text-foreground/80 transition-all duration-700 italic tracking-wide"
          >
            dashboard
          </Link>
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl text-sm font-thought text-foreground/40 border border-border/30 hover:border-border/50 hover:text-foreground/60 transition-all duration-700 italic tracking-wide"
          >
            brainchild
          </Link>
        </motion.div>

        {/* Ambient status */}
        <motion.p
          className="absolute bottom-8 left-0 right-0 text-[10px] font-sans text-muted-foreground/15 tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 3, delay: 1 }}
        >
          something exchanged hands
        </motion.p>
      </div>
    </div>
  );
}
