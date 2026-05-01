"use client";

import { MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type GeoPermissionState,
  readGeoPermissionState,
  tryGetBrowserGeo,
} from "@/lib/geolocation";

import { useLogin } from "../api/login";

export function LoginForm() {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [permState, setPermState] = useState<GeoPermissionState | null>(null);

  // Read the current geolocation permission state on mount so we can warn the
  // user before they click Sign in if the browser is silently blocking us.
  useEffect(() => {
    let cancelled = false;
    readGeoPermissionState().then((s) => {
      if (!cancelled) setPermState(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      const geo = await tryGetBrowserGeo();
      // Refresh the chip in case the user just answered the prompt.
      setPermState(geo ? "granted" : await readGeoPermissionState());
      await login.mutateAsync({ input: { email, password }, geo });
      router.push("/home");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "login failed");
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-up">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] text-brand-fg-dim">
        Sign in
      </p>
      <h1 className="mb-3 font-display text-5xl font-light tracking-tight-display md:text-6xl">
        Welcome back.
      </h1>
      <p className="mb-6 text-brand-fg-dim">Log in to your mysafeGold wallet.</p>

      <GeoPermissionBanner state={permState} />

      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {err && <p className="text-sm text-red-400">{err}</p>}
        <Button type="submit" disabled={login.isPending} size="lg" variant="gold">
          {login.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-brand-fg/60">
        New here?{" "}
        <Link href="/register" className="text-brand-fg underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

function GeoPermissionBanner({ state }: { state: GeoPermissionState | null }) {
  if (!state || state === "granted") return null;

  if (state === "denied") {
    return (
      <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <div>
            <p className="font-medium text-amber-200">Location is blocked</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-100/80">
              Click the lock icon next to the URL → <strong>Site settings</strong> →
              set <strong>Location</strong> to <strong>Allow</strong> → reload this
              page. Without this, your activity log shows IP-based location only,
              which is often inaccurate.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (state === "unsupported") {
    return (
      <div className="mb-6 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-xs text-brand-fg/60">
        Your browser doesn't support precise location — activity log will use
        approximate IP-based location.
      </div>
    );
  }

  // "prompt"
  return (
    <div className="mb-6 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-xs text-brand-fg/70">
      <span className="inline-flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5" />
        After clicking Sign in, allow location so your activity log is accurate.
      </span>
    </div>
  );
}
