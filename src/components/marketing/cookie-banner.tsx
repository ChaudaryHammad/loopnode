"use client";

import React, { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if the cookie is already set
    const consent = document.cookie.split("; ").find(row => row.startsWith("loopnode-cookie-consent="));
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleConsent = (value: "accepted" | "declined") => {
    // Set cookie for 1 year
    const d = new Date();
    d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
    document.cookie = `loopnode-cookie-consent=${value};expires=${d.toUTCString()};path=/`;
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-[22rem] z-50 bg-card/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden"
        >
          {/* Subtle glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[50px] -z-10 pointer-events-none" />
          
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary rounded-xl shrink-0 mt-0.5">
              <Cookie className="w-5 h-5" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-extrabold text-foreground tracking-tight">Manage Cookies</h4>
                <button 
                  onClick={() => handleConsent("declined")}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 bg-white/5 hover:bg-white/10 rounded-full"
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <p className="text-xs text-muted-foreground leading-relaxed mb-5 font-medium">
                We use non-essential cookies to analyze traffic and improve your experience. Read our <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link> for details.
              </p>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleConsent("accepted")}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-2.5 px-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleConsent("declined")}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-foreground border border-white/10 text-xs font-bold py-2.5 px-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
