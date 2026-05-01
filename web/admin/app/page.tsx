"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Loader } from "@/components/common/loader";
import { tokenStore } from "@/features/auth/store/auth-store";

export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(tokenStore.getAccess() ? "/dashboard" : "/login");
  }, [router]);
  return <Loader />;
}
