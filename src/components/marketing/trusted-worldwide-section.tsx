"use client";

import React from "react";
import { motion } from "framer-motion";
import { WorldMap } from "@/components/maps/world-map";
import { getMarketingMapPoints } from "@/lib/marketing-map-points";

const VIEWPORT = { once: true, margin: "-50px" };

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
  },
});

export function TrustedWorldwideSection() {
  const points = getMarketingMapPoints();

  return (
    <section className="border-t border-border/20 overflow-hidden">
      <div className="mx-auto max-w-[88rem] px-4 py-10 md:py-14">
        <motion.div
          variants={fadeUp(0)}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          className="mb-8 text-center md:mb-10"
        >
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Trusted from around the world
          </h2>
        </motion.div>

        <motion.div
          variants={fadeUp(0.06)}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          <WorldMap points={points} variant="marketing" height={460} />
        </motion.div>
      </div>
    </section>
  );
}
