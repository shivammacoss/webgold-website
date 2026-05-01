"use client";

import { LogIn, ScrollText } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Column, DataTable } from "@/components/ui/data-table";
import { formatGrams, formatINR } from "@/lib/utils";

import { useImpersonate } from "../api/impersonate";
import type { AdminUserRow } from "../types";

import { UserLogsModal } from "./user-logs-modal";

export function UsersTable({ rows }: { rows: AdminUserRow[] | undefined }) {
  const impersonate = useImpersonate();
  const [logsFor, setLogsFor] = useState<AdminUserRow | null>(null);

  const columns: Column<AdminUserRow>[] = [
    {
      key: "email",
      label: "Email",
      render: (r) => (
        <span className="flex items-center gap-2">
          {r.email}
          {r.is_admin && (
            <span className="rounded-full bg-brand-gold/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-brand-gold">
              admin
            </span>
          )}
        </span>
      ),
    },
    { key: "name", label: "Name", render: (r) => r.full_name },
    { key: "phone", label: "Phone", render: (r) => r.phone || "—" },
    {
      key: "inr",
      label: "INR",
      className: "text-right tabular-nums",
      render: (r) => (r.inr_balance != null ? formatINR(r.inr_balance) : "—"),
    },
    {
      key: "gold",
      label: "Gold",
      className: "text-right tabular-nums",
      render: (r) => (r.gold_grams != null ? formatGrams(r.gold_grams) : "—"),
    },
    {
      key: "fds",
      label: "FDs",
      className: "text-right",
      render: (r) => r.active_fds ?? 0,
    },
    {
      key: "code",
      label: "Referral",
      render: (r) => <span className="font-mono text-xs">{r.referral_code}</span>,
    },
    {
      key: "joined",
      label: "Joined",
      render: (r) => new Date(r.created_at).toLocaleDateString(),
    },
    {
      key: "actions",
      label: "",
      className: "text-right whitespace-nowrap",
      render: (r) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setLogsFor(r)}
            title="View login activity"
          >
            <ScrollText className="h-3.5 w-3.5" />
            Logs
          </Button>
          {!r.is_admin && (
            <Button
              size="sm"
              variant="outline"
              disabled={impersonate.isPending}
              onClick={() => impersonate.mutate(r.id)}
              title="Open the customer app signed in as this user"
            >
              <LogIn className="h-3.5 w-3.5" />
              Login as user
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        emptyLabel="No users yet."
      />
      {logsFor && (
        <UserLogsModal user={logsFor} onClose={() => setLogsFor(null)} />
      )}
    </>
  );
}
