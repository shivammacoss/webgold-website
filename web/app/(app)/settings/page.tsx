"use client";

import { Globe, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHero } from "@/components/ui/section-hero";
import { tokenStore } from "@/lib/api";
import { CURRENCIES, useCurrency } from "@/lib/currency";
import { useMe, useRate } from "@/lib/queries";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { data: me } = useMe();
  const { data: rate } = useRate();
  const { currency, setCurrency } = useCurrency();
  const router = useRouter();

  const logout = () => {
    tokenStore.clear();
    router.push("/login");
  };

  const usdInr = rate?.usd_inr;

  return (
    <div className="mx-auto max-w-3xl">
      <SectionHero
        eyebrow="Account"
        title="Settings."
        subtitle="Profile, preferences, and security."
      />

      <Card className="mb-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-gold/20">
            <User className="h-5 w-5 text-brand-gold" />
          </div>
          <div>
            <p className="font-display font-light text-2xl">{me?.full_name ?? "—"}</p>
            <p className="text-sm text-brand-fg/60">{me?.email ?? ""}</p>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wider text-brand-fg/50">Phone</dt>
            <dd className="mt-1 text-sm">{me?.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-brand-fg/50">Member since</dt>
            <dd className="mt-1 text-sm">
              {me ? new Date(me.created_at).toLocaleDateString() : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-brand-fg/50">Referral code</dt>
            <dd className="mt-1 font-medium text-sm tracking-wider">{me?.referral_code ?? "—"}</dd>
          </div>
        </dl>
      </Card>

      <Card className="mb-4">
        <div className="mb-6 flex items-center gap-3">
          <Globe className="h-5 w-5 text-brand-fg/60" />
          <div>
            <h2 className="font-display font-light text-xl">Display currency</h2>
            <p className="text-sm text-brand-fg/60">
              Choose how prices show across the app. Wallet balance is stored in INR
              and converted at the live market rate.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {CURRENCIES.map((c) => {
            const inrPer = rate?.fx?.[c.code];
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => setCurrency(c.code)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-xl border px-3 py-3 text-left transition-colors",
                  currency === c.code
                    ? "border-brand-gold bg-brand-gold/10"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{c.flag}</span>
                  <span className="font-mono text-sm font-medium tracking-wider">
                    {c.code}
                  </span>
                </div>
                <span className="text-[11px] text-brand-fg/60">{c.name}</span>
                {inrPer !== undefined && c.code !== "INR" && (
                  <span className="mt-0.5 text-[10px] tabular-nums text-brand-fg/40">
                    1 {c.code} = ₹{inrPer < 1 ? inrPer.toFixed(4) : inrPer.toFixed(2)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {usdInr && (
          <p className="mt-4 text-xs text-brand-fg/50">
            Live FX from Yahoo Finance · refreshed every minute
          </p>
        )}
      </Card>

      <Card>
        <h2 className="mb-2 font-display font-light text-xl">Sign out</h2>
        <p className="mb-4 text-sm text-brand-fg/60">
          You'll need to log in again to access your wallet and FDs.
        </p>
        <Button variant="danger" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </Card>
    </div>
  );
}
