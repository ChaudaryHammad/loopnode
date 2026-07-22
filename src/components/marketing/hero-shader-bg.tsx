"use client";

import React, { useEffect, useState } from "react";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";

/**
 * Health Mesh hero — Shader Gradient water plane.
 * Soft teal / paper / mist palette with grain + light mouse parallax.
 */
export function HeroShaderBg() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [azimuth, setAzimuth] = useState(180);
  const [polar, setPolar] = useState(95);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setAzimuth(180 + x * 32);
    setPolar(95 + y * 18);
  }

  if (reducedMotion) {
    return <div className="ln-hero-mesh" aria-hidden />;
  }

  return (
    <div className="absolute inset-0" aria-hidden onPointerMove={onPointerMove}>
      <ShaderGradientCanvas
        className="absolute inset-0"
        style={{ width: "100%", height: "100%" }}
        pixelDensity={1.2}
        fov={45}
        pointerEvents="none"
        lazyLoad
      >
        <ShaderGradient
          control="props"
          animate="on"
          type="waterPlane"
          shader="defaults"
          uSpeed={0.18}
          uStrength={1.6}
          uDensity={1.05}
          uFrequency={5.2}
          uAmplitude={0}
          color1="#9fd4cc"
          color2="#efe9df"
          color3="#b7c8dc"
          reflection={0.08}
          lightType="3d"
          brightness={1.2}
          grain="on"
          grainBlending={0.45}
          cAzimuthAngle={azimuth}
          cPolarAngle={polar}
          cDistance={3.9}
          cameraZoom={1}
          positionX={0}
          positionY={0.4}
          positionZ={0}
          rotationX={0}
          rotationY={0}
          rotationZ={0}
          enableTransition
          smoothTime={0.35}
        />
      </ShaderGradientCanvas>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_35%,rgba(242,243,245,0.35),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--ln-bg)]" />
    </div>
  );
}
