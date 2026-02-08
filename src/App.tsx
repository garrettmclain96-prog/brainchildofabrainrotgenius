import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy-load Stripe Connect pages — they're not part of the core app experience
const ConnectDashboard = lazy(() => import("./pages/ConnectDashboard"));
const ConnectStorefront = lazy(() => import("./pages/ConnectStorefront"));
const ConnectSuccess = lazy(() => import("./pages/ConnectSuccess"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <Routes>
            <Route path="/" element={<Index />} />

            {/* Stripe Connect routes */}
            <Route path="/connect/dashboard" element={<ConnectDashboard />} />
            {/* TODO: In production, use a readable slug instead of the Stripe account ID */}
            <Route path="/connect/store/:accountId" element={<ConnectStorefront />} />
            <Route path="/connect/success" element={<ConnectSuccess />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
