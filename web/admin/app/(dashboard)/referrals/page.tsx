"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { useAdminReferrals } from "@/features/referrals/api/list-referrals";
import { ReferralsTable } from "@/features/referrals/components/referrals-table";

export default function ReferralsAdminPage() {
  const { data, isError, error } = useAdminReferrals();

  return (
    <div>
      <PageHeader title="Referrals" subtitle="Bonuses paid and pending." />
      <Card className="p-0">
        {isError ? (
          <p className="p-8 text-center text-sm text-red-400">
            {error instanceof Error ? error.message : "failed to load"}
          </p>
        ) : (
          <ReferralsTable rows={data} />
        )}
      </Card>
    </div>
  );
}
