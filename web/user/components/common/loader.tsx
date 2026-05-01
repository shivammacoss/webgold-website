"use client";

import { motion } from "framer-motion";

interface LoaderProps {
  label?: string;
}

export function Loader({ label = "Loading" }: LoaderProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-bg">
      {/* Layer 1 — ambient warm glow that breathes */}
      <motion.div
        aria-hidden
        animate={{ opacity: [0.2, 0.45, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(45% 45% at 50% 50%, rgba(229,181,71,0.28) 0%, transparent 70%)",
        }}
      />

      {/* Layer 2 — subtle grid for depth (premium tech feel) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,241,232,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(245,241,232,0.4) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(circle at center, black 30%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(circle at center, black 30%, transparent 70%)",
        }}
      />

      <div className="relative flex flex-col items-center gap-12">
        <Orb />
        <ShimmerLabel label={label} />
      </div>
    </div>
  );
}

function Orb() {
  return (
    <div className="relative flex h-44 w-44 items-center justify-center">
      <Ripples />
      <OrbitingParticles />
      <CenterOrb />
    </div>
  );
}

/** Three concentric rings expand outward and fade — radar / sonar pulse. */
function Ripples() {
  return (
    <>
      {[0, 0.7, 1.4].map((delay, i) => (
        <motion.div
          key={i}
          className="absolute h-full w-full rounded-full border border-brand-gold/40"
          animate={{ scale: [0.35, 1.65], opacity: [0.75, 0] }}
          transition={{
            duration: 2.1,
            repeat: Infinity,
            delay,
            ease: "easeOut",
          }}
        />
      ))}
    </>
  );
}

/** Three glowing particles orbit the centre on the same circle, evenly spaced
 *  at 0° / 120° / 240°, each spinning at a slightly different speed. */
function OrbitingParticles() {
  const particles = [
    { startDeg: 0, duration: 2.8 },
    { startDeg: 120, duration: 3.4 },
    { startDeg: 240, duration: 3.0 },
  ];
  return (
    <>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute h-full w-full"
          initial={{ rotate: p.startDeg }}
          animate={{ rotate: p.startDeg + 360 }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "linear" }}
        >
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full"
            style={{
              top: 4,
              width: 11,
              height: 11,
              background:
                "radial-gradient(circle, #FFEFC9 0%, #F4D38A 50%, #E5B547 80%, transparent 100%)",
              boxShadow:
                "0 0 14px rgba(244,211,138,0.9), 0 0 28px rgba(229,181,71,0.5)",
            }}
          />
        </motion.div>
      ))}
    </>
  );
}

/** Glossy gold sphere in the centre with a specular highlight + soft pulse. */
function CenterOrb() {
  return (
    <motion.div
      className="relative rounded-full"
      style={{
        width: 68,
        height: 68,
        background:
          "radial-gradient(circle at 32% 30%, #FBE6B0 0%, #E5B547 55%, #8C5E12 100%)",
        boxShadow:
          "0 0 60px rgba(229,181,71,0.6), inset 0 -10px 18px rgba(0,0,0,0.4), inset 0 10px 18px rgba(255,255,255,0.22)",
      }}
      animate={{ scale: [1, 1.09, 1] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <div
        aria-hidden
        className="absolute rounded-full"
        style={{
          left: "22%",
          top: "18%",
          width: "32%",
          height: "26%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.7) 0%, transparent 70%)",
          filter: "blur(2px)",
        }}
      />
    </motion.div>
  );
}

/** Wordmark with a sweeping gold "shine" that travels left → right. */
function ShimmerLabel({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.span
        className="font-display text-2xl font-light tracking-tight-display"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(245,241,232,0.45) 0%, #F4D38A 45%, #FFFFFF 50%, #F4D38A 55%, rgba(245,241,232,0.45) 100%)",
          backgroundSize: "200% 100%",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          WebkitTextFillColor: "transparent",
        }}
        animate={{ backgroundPositionX: ["200%", "-200%"] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
      >
        mysafeGold
      </motion.span>
      {label && (
        <motion.span
          className="text-[10px] font-medium uppercase tracking-[0.4em] text-brand-fg-dim"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          {label}
        </motion.span>
      )}
    </div>
  );
}
