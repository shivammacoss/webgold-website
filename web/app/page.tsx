import { ArrowRight, Coins, Lock, ShieldCheck, TrendingUp } from "lucide-react";
import Link from "next/link";

import { BackgroundPaths } from "@/components/ui/background-paths";
import { SceneBackground } from "@/components/ui/scene-background";

const features = [
  {
    Icon: TrendingUp,
    title: "Live market rates",
    body: "Buy and sell 24K gold at real-time prices, refreshed every minute from international futures.",
  },
  {
    Icon: Lock,
    title: "Gold Fixed Deposits",
    body: "Lock in for 90, 180, or 365 days and earn extra grams at maturity — up to 7% APR.",
  },
  {
    Icon: Coins,
    title: "Your wallet, your gold",
    body: "Top up, withdraw, and track every transaction with full ledger transparency.",
  },
  {
    Icon: ShieldCheck,
    title: "Built for trust",
    body: "Atomic ledger, end-to-end auth, and a complete audit trail on every action.",
  },
];

const fdPlans = [
  { days: 90, apr: 4.5, label: "Gold Saver" },
  { days: 180, apr: 5.5, label: "Gold Plus" },
  { days: 365, apr: 7.0, label: "Gold Max" },
];

const stats = [
  { label: "Live spot pricing", value: "24K · INR/g" },
  { label: "Lowest entry", value: "₹10" },
  { label: "FD return up to", value: "7% APR" },
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <SceneBackground />

      {/* Top nav */}
      <header className="relative z-10 px-6 py-6 md:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href="/"
            className="font-display text-xl font-light tracking-tight-display"
          >
            mysafe<span className="text-brand-gold">Gold</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full px-5 py-2 text-sm font-medium text-brand-fg-dim transition-colors hover:text-brand-fg"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-brand-gold px-5 py-2 text-sm font-medium text-black transition-colors hover:bg-brand-gold-soft"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 overflow-hidden px-6 pb-20 pt-12 md:px-12 md:pb-32 md:pt-20">
        <BackgroundPaths />
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-brand-gold/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-brand-gold animate-fade-up">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
            Live · 24K Gold
          </p>
          <h1 className="mx-auto max-w-4xl font-display text-5xl font-light leading-[0.95] tracking-tight-display text-brand-fg animate-fade-up [animation-delay:80ms] md:text-8xl">
            Own gold.<br />
            <span className="text-brand-gold">Grow gold.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-brand-fg-dim animate-fade-up [animation-delay:160ms] md:text-xl">
            Buy digital 24K gold at the live market rate, or lock it into a Gold
            Fixed Deposit. Real prices. Real returns. Zero paperwork.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 animate-fade-up [animation-delay:240ms]">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-brand-gold py-3 pl-7 pr-2 text-base font-semibold text-black transition-all hover:gap-3 hover:bg-brand-gold-soft"
            >
              Start investing
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black transition-transform group-hover:scale-110">
                <ArrowRight className="h-4 w-4 text-brand-gold" />
              </span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3 text-base font-medium text-brand-fg transition-colors hover:bg-white/5"
            >
              I have an account
            </Link>
          </div>

          {/* Stat strip */}
          <div className="mx-auto mt-20 grid max-w-3xl grid-cols-3 gap-px rounded-2xl border border-white/[0.08] bg-white/[0.04] p-px animate-fade-up [animation-delay:320ms]">
            {stats.map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 bg-brand-bg/40 px-4 py-6 first:rounded-l-2xl last:rounded-r-2xl"
              >
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-brand-fg-dim">
                  {label}
                </span>
                <span className="font-display text-2xl font-light tabular-nums text-brand-fg md:text-3xl">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why mysafeGold */}
      <section className="relative z-10 border-t border-white/[0.06] px-6 py-24 md:px-12 md:py-32">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-brand-fg-dim">
            Why mysafeGold
          </p>
          <h2 className="mb-16 max-w-3xl font-display text-4xl font-light leading-[1.05] tracking-tight-display md:text-6xl">
            A modern way to own and grow gold.
          </h2>

          <div className="grid grid-cols-1 gap-px rounded-2xl border border-white/[0.06] bg-white/[0.04] p-px md:grid-cols-2 lg:grid-cols-4">
            {features.map(({ Icon, title, body }) => (
              <div
                key={title}
                className="flex flex-col gap-4 bg-brand-bg/60 p-8 transition-colors hover:bg-brand-surface/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-xl font-light tracking-tight">{title}</h3>
                <p className="text-sm leading-relaxed text-brand-fg-dim">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FD plans */}
      <section className="relative z-10 border-t border-white/[0.06] px-6 py-24 md:px-12 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-brand-gold">
                Gold Fixed Deposits
              </p>
              <h2 className="max-w-2xl font-display text-4xl font-light leading-[1.05] tracking-tight-display md:text-6xl">
                Earn up to <span className="text-brand-gold">7%</span> in extra
                gold.
              </h2>
            </div>
            <p className="max-w-md text-base leading-relaxed text-brand-fg-dim md:text-lg">
              Lock in your grams for 90, 180, or 365 days. At maturity, your
              wallet is credited with principal plus interest — paid in gold.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {fdPlans.map((p, i) => (
              <div
                key={p.days}
                className={`flex flex-col gap-4 rounded-2xl border p-8 transition-colors ${
                  i === 2
                    ? "border-brand-gold/40 bg-brand-gold/[0.03]"
                    : "border-white/[0.07] bg-brand-surface/50 hover:border-white/[0.15]"
                }`}
              >
                <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-brand-fg-dim">
                  {p.label}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-6xl font-light tabular-nums text-brand-gold">
                    {p.apr}
                  </span>
                  <span className="font-display text-2xl font-light text-brand-fg-dim">
                    %
                  </span>
                  <span className="ml-1 text-sm text-brand-fg-dim">APR</span>
                </div>
                <span className="text-sm text-brand-fg-dim">
                  {p.days}-day lock-in
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 border-t border-white/[0.06] px-6 py-24 md:px-12 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 font-display text-4xl font-light leading-tight tracking-tight-display md:text-6xl">
            Start with as little as{" "}
            <span className="text-brand-gold">₹10</span>.
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-base text-brand-fg-dim md:text-lg">
            Two minutes to your first gram. Live rates, your wallet, zero
            paperwork.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-brand-gold py-3 pl-7 pr-2 text-base font-semibold text-black transition-all hover:gap-3 hover:bg-brand-gold-soft"
            >
              Create your wallet
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black transition-transform group-hover:scale-110">
                <ArrowRight className="h-4 w-4 text-brand-gold" />
              </span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3 text-base font-medium text-brand-fg transition-colors hover:bg-white/5"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] px-6 py-10 md:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 text-xs text-brand-fg-dim md:flex-row md:items-center">
          <span className="font-display text-base font-light text-brand-fg">
            mysafe<span className="text-brand-gold">Gold</span>
          </span>
          <span>
            © 2026 mysafeGold. Live gold prices for demo only — not a regulated
            investment product.
          </span>
        </div>
      </footer>
    </main>
  );
}
