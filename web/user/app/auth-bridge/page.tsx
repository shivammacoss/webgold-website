"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Loader } from "@/components/common/loader";
import { tokenStore } from "@/features/auth/store/auth-store";

/**
 * Hands a freshly-minted impersonation token-pair into the user app.
 * Triggered from the admin "Login as user" button on /admin/users.
 *
 * Cross-origin localStorage isn't writable directly (admin runs on :3001,
 * user app on :3000), so the admin opens this page with the tokens in the
 * query string. We persist them under the user app's keys, then redirect
 * to /home. The URL is replaced so the tokens don't linger in browser history.
 */
export default function AuthBridgePage() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const access = params.get("access");
    const refresh = params.get("refresh");
    if (!access || !refresh) {
      setError("Missing impersonation tokens.");
      return;
    }
    tokenStore.set(access, refresh);
    // Strip the tokens from history before navigating away.
    window.history.replaceState({}, "", "/auth-bridge");
    router.replace("/home");
  }, [params, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-red-400">
        {error}
      </div>
    );
  }
  return <Loader label="Signing you in…" />;
}
