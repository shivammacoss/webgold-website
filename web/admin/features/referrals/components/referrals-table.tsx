"use client";

import { Column, DataTable } from "@/components/ui/data-table";
import { formatINR } from "@/lib/utils";

import type { AdminReferralRow } from "../types";

export function ReferralsTable({ rows }: { rows: AdminReferralRow[] | undefined }) {
  const columns: Column<AdminReferralRow>[] = [
    { key: "referrer", label: "Referrer", render: (r) => r.referrer_email ?? "—" },
    { key: "referee", label: "Referee", render: (r) => r.referee_email ?? "—" },
    {
      key: "bonus",
      label: "Bonus",
      className: "text-right tabular-nums",
      render: (r) => formatINR(r.bonus_inr),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
            r.status === "PAID"
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-white/10 text-brand-fg/60"
          }`}
        >
          {r.status}
        </span>
      ),
    },
    {
      key: "created",
      label: "Created",
      render: (r) => new Date(r.created_at).toLocaleString(),
    },
    {
      key: "paid",
      label: "Paid",
      render: (r) => (r.paid_at ? new Date(r.paid_at).toLocaleString() : "—"),
    },
  ];
  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      emptyLabel="No referrals yet."
    />
  );
}
