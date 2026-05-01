"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { useAllTransactions } from "@/features/transactions/api/list-transactions";
import { TransactionsTable } from "@/features/transactions/components/transactions-table";

export default function TransactionsPage() {
  const { data, isError, error } = useAllTransactions();

  return (
    <div>
      <PageHeader title="Transactions" subtitle="Every ledger entry across all users." />
      <Card className="p-0">
        {isError ? (
          <p className="p-8 text-center text-sm text-red-400">
            {error instanceof Error ? error.message : "failed to load"}
          </p>
        ) : (
          <TransactionsTable rows={data} />
        )}
      </Card>
    </div>
  );
}
