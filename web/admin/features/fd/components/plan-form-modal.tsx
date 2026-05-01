"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useCreatePlan } from "../api/create-plan";
import { useUpdatePlan } from "../api/update-plan";
import type { AdminFDPlan } from "../types";

interface Props {
  /** When set, the modal is in edit mode. Omit for create. */
  plan?: AdminFDPlan | null;
  onClose: () => void;
}

interface FormState {
  name: string;
  lockInDays: string;
  aprPct: string;
  minGrams: string;
}

const empty: FormState = {
  name: "",
  lockInDays: "",
  aprPct: "",
  minGrams: "",
};

export function PlanFormModal({ plan, onClose }: Props) {
  const isEdit = !!plan;
  const create = useCreatePlan();
  const update = useUpdatePlan();
  const [form, setForm] = useState<FormState>(empty);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (plan) {
      setForm({
        name: plan.name,
        lockInDays: String(plan.lock_in_days),
        aprPct: String(plan.apr_pct),
        minGrams: String(plan.min_grams),
      });
    } else {
      setForm(empty);
    }
    setErr(null);
  }, [plan]);

  const update_ = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    const lockInDays = parseInt(form.lockInDays, 10);
    const aprPct = parseFloat(form.aprPct);
    const minGrams = parseFloat(form.minGrams);

    if (!form.name.trim()) return setErr("Name is required");
    if (!Number.isFinite(lockInDays) || lockInDays <= 0)
      return setErr("Lock-in days must be a positive integer");
    if (!Number.isFinite(aprPct) || aprPct <= 0 || aprPct > 100)
      return setErr("APR % must be between 0 and 100");
    if (!Number.isFinite(minGrams) || minGrams <= 0)
      return setErr("Minimum grams must be greater than zero");

    const input = {
      name: form.name.trim(),
      lock_in_days: lockInDays,
      apr_pct: aprPct,
      min_grams: minGrams,
    };

    try {
      if (isEdit && plan) {
        await update.mutateAsync({ id: plan.id, input });
      } else {
        await create.mutateAsync(input);
      }
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "save failed");
    }
  };

  const pending = create.isPending || update.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-brand-bg p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-light">
              {isEdit ? "Edit FD plan" : "Create FD plan"}
            </h2>
            <p className="mt-1 text-xs text-brand-fg-dim">
              These plans appear on the user app's "Start a Gold FD" sheet.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-brand-fg-dim hover:bg-white/5 hover:text-brand-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <Field label="Plan name">
            <Input
              placeholder="e.g. Gold Saver — 90 days"
              value={form.name}
              onChange={update_("name")}
              required
              maxLength={120}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Lock-in (days)">
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="90"
                value={form.lockInDays}
                onChange={update_("lockInDays")}
                required
              />
            </Field>
            <Field label="Interest rate (% APR)">
              <Input
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                placeholder="4.5"
                value={form.aprPct}
                onChange={update_("aprPct")}
                required
              />
            </Field>
          </div>

          <Field label="Minimum grams">
            <Input
              type="number"
              min="0.001"
              step="0.001"
              placeholder="0.1"
              value={form.minGrams}
              onChange={update_("minGrams")}
              required
            />
          </Field>

          {err && <p className="text-xs text-red-400">{err}</p>}

          <div className="mt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending} variant="gold" size="sm">
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create plan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-brand-fg-dim">
        {label}
      </span>
      {children}
    </label>
  );
}
