"use client";

import { Column, DataTable } from "@/components/ui/data-table";
import { formatGrams } from "@/lib/utils";

import type { AdminFD } from "../types";

export function FDsTable({ rows }: { rows: AdminFD[] | undefined }) {
  const columns: Column<AdminFD>[] = [
    { key: "user", label: "User", render: (r) => r.user_email ?? `#${r.user_id}` },
    { key: "plan", label: "Plan", render: (r) => r.plan_name },
    {
      key: "principal",
      label: "Principal",
      className: "text-right tabular-nums",
      render: (r) => formatGrams(r.principal_grams),
    },
    {
      key: "apr",
      label: "APR",
      className: "text-right",
      render: (r) => `${r.apr_pct}%`,
    },
    {
      key: "matures",
      label: "Matures",
      render: (r) => new Date(r.maturity_date).toLocaleDateString(),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
            r.status === "ACTIVE"
              ? "bg-emerald-500/20 text-emerald-300"
              : r.status === "MATURED"
                ? "bg-brand-gold/20 text-brand-gold"
                : "bg-white/10 text-brand-fg/60"
          }`}
        >
          {r.status}
        </span>
      ),
    },
    {
      key: "payout",
      label: "Payout",
      className: "text-right tabular-nums",
      render: (r) => (r.payout_grams != null ? formatGrams(r.payout_grams) : "—"),
    },
  ];
  return <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} emptyLabel="No FDs yet." />;
}
