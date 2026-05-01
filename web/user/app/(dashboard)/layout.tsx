"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Loader } from "@/components/common/loader";
import { SceneBackground } from "@/components/common/scene-background";
import { BottomNav, SideNav } from "@/components/layout/app-nav";
import { tokenStore } from "@/features/auth/store/auth-store";
import { startHeartbeat } from "@/features/audit/api/heartbeat";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!tokenStore.getAccess()) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  // Fire an audit heartbeat every 2 minutes while the user is in the dashboard.
  // The cleanup stops the timer on logout or route change to /login.
  useEffect(() => {
    if (!ready) return;
    return startHeartbeat();
  }, [ready]);

  if (!ready) return <Loader />;

  return (
    <div className="relative flex min-h-screen">
      <SceneBackground />
      <SideNav />
      <main className="flex-1 px-4 pb-28 pt-6 md:px-10 md:pb-10">{children}</main>
      <BottomNav />
    </div>
  );
}
