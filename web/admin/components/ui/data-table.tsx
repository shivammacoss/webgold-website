"use client";

import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  label: string;
  className?: string;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  rows: T[] | undefined;
  columns: Column<T>[];
  emptyLabel?: string;
  rowKey: (row: T) => string | number;
}

export function DataTable<T>({
  rows,
  columns,
  emptyLabel = "Nothing to show.",
  rowKey,
}: DataTableProps<T>) {
  if (!rows) {
    return <p className="py-8 text-center text-sm text-brand-fg/60">Loading…</p>;
  }
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-brand-fg/60">{emptyLabel}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.08] text-left text-xs uppercase tracking-wider text-brand-fg-dim">
            {columns.map((c) => (
              <th key={c.key} className={cn("px-3 py-3 font-medium", c.className)}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
              {columns.map((c) => (
                <td key={c.key} className={cn("px-3 py-3", c.className)}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
