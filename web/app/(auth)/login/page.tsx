"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, tokenStore } from "@/lib/api";
import type { TokenPair } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const data = await api<TokenPair>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        auth: false,
      });
      tokenStore.set(data.access_token, data.refresh_token);
      router.push("/home");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "login failed");
    } finally {
      setLoading(false);
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
      <p className="mb-10 text-brand-fg-dim">Log in to your mysafeGold wallet.</p>

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
        <Button type="submit" disabled={loading} size="lg" variant="gold">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-brand-fg/60">
        New here?{" "}
        <Link href="/signup" className="text-brand-fg underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
