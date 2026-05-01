"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDeletePlan } from "@/features/fd/api/delete-plan";
import { useAllFDs } from "@/features/fd/api/list-fds";
import { useFDPlans } from "@/features/fd/api/list-plans";
import { FDsTable } from "@/features/fd/components/fds-table";
import { PlanFormModal } from "@/features/fd/components/plan-form-modal";
import type { AdminFDPlan } from "@/features/fd/types";

export default function FDsPage() {
  const fds = useAllFDs();
  const plans = useFDPlans();
  const deletePlan = useDeletePlan();

  // null  = closed
  // {}    = create mode
  // plan  = edit mode
  const [editing, setEditing] = useState<AdminFDPlan | null | undefined>(null);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  const onDelete = async (p: AdminFDPlan) => {
    setDeleteErr(null);
    if (!confirm(`Delete plan "${p.name}"? This can't be undone.`)) return;
    try {
      await deletePlan.mutateAsync(p.id);
    } catch (e) {
      setDeleteErr(e instanceof Error ? e.message : "delete failed");
    }
  };

  return (
    <div>
      <PageHeader
        title="Gold FDs"
        subtitle="All deposits across the platform."
        actions={
          <Button variant="gold" size="sm" onClick={() => setEditing(undefined)}>
            <Plus className="h-3.5 w-3.5" />
            New plan
          </Button>
        }
      />

      <Card className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-light">FD plans</h2>
          <span className="text-xs text-brand-fg-dim">
            Edit a plan to change its interest rate
          </span>
        </div>
        {deleteErr && (
          <p className="mb-3 text-xs text-red-400">{deleteErr}</p>
        )}
        {plans.data ? (
          plans.data.length === 0 ? (
            <p className="text-sm text-brand-fg-dim">
              No plans yet. Click <strong>New plan</strong> to create one.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {plans.data.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-col gap-3 rounded-lg border border-white/[0.08] bg-white/[0.02] p-4"
                >
                  <div>
                    <p className="font-display text-lg font-light">{p.name}</p>
                    <p className="mt-1 text-xs text-brand-fg-dim">
                      {p.lock_in_days}d · <span className="text-brand-gold">{p.apr_pct}%</span>{" "}
                      APR · min {p.min_grams} g
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing(p)}
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={deletePlan.isPending}
                      onClick={() => onDelete(p)}
                      className="text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : (
          <p className="text-sm text-brand-fg-dim">Loading…</p>
        )}
      </Card>

      <Card className="p-0">
        {fds.isError ? (
          <p className="p-8 text-center text-sm text-red-400">
            {fds.error instanceof Error ? fds.error.message : "failed to load"}
          </p>
        ) : (
          <FDsTable rows={fds.data} />
        )}
      </Card>

      {editing !== null && (
        <PlanFormModal plan={editing ?? null} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
