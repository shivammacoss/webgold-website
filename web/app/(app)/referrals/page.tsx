"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/card";
import { SectionHero } from "@/components/ui/section-hero";
import { useCurrency } from "@/lib/currency";
import { useReferrals } from "@/lib/queries";

export default function ReferralsPage() {
  const { data } = useReferrals();
  const [copied, setCopied] = useState(false);
  const { formatMoney } = useCurrency();

  const code = data?.code ?? "—";

  const copy = async () => {
    if (!data?.code) return;
    await navigator.clipboard.writeText(data.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <SectionHero
        eyebrow="Invite"
        title="Referrals."
        subtitle={`Bring friends to mysafeGold — both of you get ${formatMoney(50)} on their first deposit.`}
      />

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <span className="text-xs uppercase tracking-wider text-brand-fg/50">Your code</span>
          <p className="font-display font-light text-5xl tracking-widest md:text-6xl">{code}</p>
          <Button onClick={copy} variant="ghost" className="self-start">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy code"}
          </Button>
        </Card>

        <StatCard
          label="Total earned"
          value={data ? formatMoney(data.total_bonus_inr) : "—"}
          hint={`${data?.referrals.length ?? 0} friends joined`}
        />
      </div>

      <Card>
        <h2 className="mb-4 font-display font-light text-2xl">Friends you've referred</h2>
        {!data || data.referrals.length === 0 ? (
          <p className="text-sm text-brand-fg/60">Share your code — your bonuses show up here.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-white/[0.06]">
            {data.referrals.map((r) => (
              <li key={r.referee_email} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm">{r.referee_email}</p>
                  <p className="text-xs text-brand-fg/50">
                    Joined {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={
                      r.status === "PAID" ? "text-emerald-400" : "text-brand-fg/60"
                    }
                  >
                    {r.status === "PAID" ? formatMoney(r.bonus_inr) : "Pending"}
                  </p>
                  <p className="text-xs text-brand-fg/50">{r.status}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
