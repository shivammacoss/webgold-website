"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tryGetBrowserGeo } from "@/lib/geolocation";

import { useAdminLogin } from "../api/login";

export function AdminLoginForm() {
  const router = useRouter();
  const login = useAdminLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      const geo = await tryGetBrowserGeo();
      await login.mutateAsync({ input: { email, password }, geo });
      router.push("/dashboard");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "login failed");
    }
  };

  return (
    <div className="w-full max-w-sm">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-brand-fg-dim">
        Operator console
      </p>
      <h1 className="mb-8 font-display text-3xl font-light tracking-tight-display">
        Admin sign-in
      </h1>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <Input
          type="email"
          placeholder="Admin email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {err && <p className="text-xs text-red-400">{err}</p>}
        <Button type="submit" disabled={login.isPending} variant="gold" size="lg">
          {login.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
