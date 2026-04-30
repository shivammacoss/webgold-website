"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BottomNav, SideNav } from "@/components/ui/app-nav";
import { SceneBackground } from "@/components/ui/scene-background";
import { tokenStore } from "@/lib/api";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!tokenStore.getAccess()) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-brand-fg/50">
        Loading…
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen">
      <SceneBackground />
      <SideNav />
      <main className="flex-1 px-4 pb-28 pt-6 md:px-10 md:pb-10">{children}</main>
      <BottomNav />
    </div>
  );
}
