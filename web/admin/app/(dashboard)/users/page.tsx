"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { useUsers } from "@/features/users/api/list-users";
import { UsersTable } from "@/features/users/components/users-table";

export default function UsersPage() {
  const { data, isError, error } = useUsers();

  return (
    <div>
      <PageHeader title="Users" subtitle="Every wallet on the platform." />
      <Card className="p-0">
        {isError ? (
          <p className="p-8 text-center text-sm text-red-400">
            {error instanceof Error ? error.message : "failed to load"}
          </p>
        ) : (
          <UsersTable rows={data} />
        )}
      </Card>
    </div>
  );
}
