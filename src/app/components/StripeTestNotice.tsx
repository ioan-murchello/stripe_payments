'use client'

import React from "react";
import { AlertCircle, Copy } from "lucide-react";
import { toast } from "sonner";

export function StripeTestNotice() {
  // Check if your public Stripe key is a test key (starts with pk_test)
  const isStripeTestMode =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_test_");

  // 🌍 CHANGED: Now it shows on production/uploaded sites IF you are still using Stripe Test Mode
  if (!isStripeTestMode && process.env.NODE_ENV !== "development") {
    return null;
  }

  // Dynamically calculate next year (e.g., in 2026, this becomes '27')
  const nextYearShort = String(new Date().getFullYear() + 1).slice(-2);
  const cardNumber = "4242 4242 4242 4242";

  const handleCopy = (text: string, label: string) => {
    // Removes spaces before copying to clipboard
    navigator.clipboard.writeText(text.replace(/\s/g, ""));
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="fixed bottom-4 right-4 w-full max-w-md mx-auto rounded-xl border border-amber-200 bg-amber-500 p-4 text-amber-900 shadow-sm z-[300]">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-5 flex-shrink-0 text-amber-600" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-semibold leading-none text-amber-800">
            Payment Test Mode Active
          </p>
          <p className="text-xs text-amber-700/90 leading-relaxed">
            Use the following credentials on the Stripe Checkout page to
            simulate a successful payment:
          </p>

          <div className="grid grid-cols-1 gap-1.5 pt-1">
            {/* Card Number Row */}
            <div className="flex items-center justify-between rounded-lg bg-amber-100/60 px-2.5 py-1.5 font-mono text-xs border border-amber-200/40">
              <span>
                Card: <strong className="text-amber-950">{cardNumber}</strong>
              </span>
              <button
                onClick={() => handleCopy(cardNumber, "Card number")}
                className="text-amber-600 hover:text-amber-800 transition-colors p-0.5 rounded hover:bg-amber-200/50"
                title="Copy Card Number"
              >
                <Copy className="size-3.5" />
              </button>
            </div>

            {/* Expiry Date & CVC Row */}
            <div className="flex gap-2">
              <div className="flex-1 rounded-lg bg-amber-100/60 px-2.5 py-1.5 font-mono text-xs border border-amber-200/40">
                Expires:{" "}
                <strong className="text-amber-950">05/{nextYearShort}</strong>
              </div>

              <div className="flex-1 rounded-lg bg-amber-100/60 px-2.5 py-1.5 font-mono text-xs border border-amber-200/40 flex items-center justify-between">
                <span>
                  CVC: <strong className="text-amber-950">424</strong>
                </span>
                <button
                  onClick={() => handleCopy("424", "CVC")}
                  className="text-amber-600 hover:text-amber-800 transition-colors p-0.5 rounded hover:bg-amber-200/50"
                  title="Copy CVC"
                >
                  <Copy className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
