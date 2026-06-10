'use client'

import React, { useState } from "react";
import { AlertCircle, Copy, X } from "lucide-react";
import { toast } from "sonner";

export function StripeTestNotice() {
  const [isOpen, setIsOpen] = useState(true);

  const nextYearShort = String(new Date().getFullYear() + 1).slice(-2);
  const cardNumber = "4242 4242 4242 4242";

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text.replace(/\s/g, ""));
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <>
      {/* CLOSED STATE - floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-[300] flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg hover:scale-105 transition"
        >
          <AlertCircle className="size-6" />
        </button>
      )}

      {/* OPEN PANEL */}
      <div
        className={`
          fixed bottom-0 right-0 sm:bottom-4 sm:right-4 z-[300] w-full max-w-md
          origin-bottom-right transition-all duration-300 ease-out
          ${isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0"}
        `}
      >
        <div className="relative rounded-xl border border-amber-200 bg-amber-500 p-2 text-amber-900 shadow-lg">
          
          {/* close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute right-3 top-3 rounded text-amber-800 hover:bg-amber-400/30"
          >
            <X className="size-4" />
          </button>

          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 flex-shrink-0 text-amber-700" />

            <div className="flex-1 space-y-2">
              <p className="text-sm font-semibold text-amber-950">
                Payment Test Mode Active
              </p>

              <div className="grid gap-1.5">
                <div className="flex items-center justify-between rounded-lg border border-amber-200/40 bg-amber-100/60 px-2.5 py-1.5 font-mono text-xs">
                  <span>
                    Card: <strong>{cardNumber}</strong>
                  </span>

                  <button
                    onClick={() => handleCopy(cardNumber, "Card number")}
                    className="rounded p-1 hover:bg-amber-200/50"
                  >
                    <Copy className="size-3.5" />
                  </button>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 rounded-lg border border-amber-200/40 bg-amber-100/60 px-2.5 py-1.5 font-mono text-xs">
                    Expires: <strong>05/{nextYearShort}</strong>
                  </div>

                  <div className="flex flex-1 items-center justify-between rounded-lg border border-amber-200/40 bg-amber-100/60 px-2.5 py-1.5 font-mono text-xs">
                    <span>
                      CVC: <strong>424</strong>
                    </span>

                    <button
                      onClick={() => handleCopy("424", "CVC")}
                      className="rounded p-1 hover:bg-amber-200/50"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}