"use client";

import React, { useEffect, useState } from "react";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";

/**
 * Health Mesh hero — Shader Gradient water plane.
 * Fixed camera (no mouse-driven prop updates) so the mesh animates smoothly.
 */
export function HeroShaderBg() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    // Defer WebGL mount one frame so layout is stable (avoids initial hitch).
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (reducedMotion || !ready) {
    return <div className="ln-hero-mesh" aria-hidden />;
  }

  return (
    <div className="absolute inset-0" aria-hidden>
      <ShaderGradientCanvas
        className="absolute inset-0"
        style={{ width: "100%", height: "100%" }}
        pixelDensity={1}
        fov={45}
        pointerEvents="none"
        lazyLoad={false}
      >
        <ShaderGradient
          control="props"
          animate="on"
          type="waterPlane"
          shader="defaults"
          uSpeed={0.12}
          uStrength={1.4}
          uDensity={1}
          uFrequency={5}
          uAmplitude={0}
          color1="#9fd4cc"
          color2="#efe9df"
          color3="#b7c8dc"
          reflection={0.08}
          lightType="3d"
          brightness={1.15}
          grain="on"
          grainBlending={0.35}
          cAzimuthAngle={180}
          cPolarAngle={95}
          cDistance={3.9}
          cameraZoom={1}
          positionX={0}
          positionY={0.4}
          positionZ={0}
          rotationX={0}
          rotationY={0}
          rotationZ={0}
          enableTransition={false}
        />
      </ShaderGradientCanvas>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_35%,rgba(242,243,245,0.35),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--ln-bg)]" />
    </div>
  );
}
