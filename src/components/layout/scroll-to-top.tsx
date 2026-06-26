"use client";

import React, { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="scroll-top"
          initial={{ opacity: 0, scale: 0.7, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 16 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          onClick={scrollTop}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full flex items-center justify-center
            bg-card/80 border border-white/10 backdrop-blur-xl shadow-lg
            hover:bg-primary/20 hover:border-primary/40 hover:shadow-[0_0_20px_-4px_rgba(var(--primary-rgb,100,120,255),0.5)]
            transition-all duration-300 group"
        >
          <ArrowUp className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
