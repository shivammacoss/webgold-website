"use client";

import { Column, DataTable } from "@/components/ui/data-table";
import { formatGrams, formatINR } from "@/lib/utils";

import type { AdminTransaction } from "../types";

export function TransactionsTable({ rows }: { rows: AdminTransaction[] | undefined }) {
  const columns: Column<AdminTransaction>[] = [
    {
      key: "when",
      label: "When",
      render: (r) => new Date(r.created_at).toLocaleString(),
    },
    {
      key: "user",
      label: "User",
      render: (r) => r.user_email ?? `#${r.user_id}`,
    },
    {
      key: "type",
      label: "Type",
      render: (r) => <span className="font-mono text-xs">{r.type}</span>,
    },
    {
      key: "amount",
      label: "INR",
      className: "text-right tabular-nums",
      render: (r) => (r.amount_inr ? formatINR(r.amount_inr) : "—"),
    },
    {
      key: "gold",
      label: "Gold",
      className: "text-right tabular-nums",
      render: (r) => (r.gold_grams ? formatGrams(r.gold_grams) : "—"),
    },
    {
      key: "rate",
      label: "Rate/g",
      className: "text-right tabular-nums",
      render: (r) => (r.rate_inr_per_gram ? formatINR(r.rate_inr_per_gram) : "—"),
    },
    { key: "status", label: "Status", render: (r) => r.status },
  ];
  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      emptyLabel="No transactions yet."
    />
  );
}
