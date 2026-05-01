"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useRegister } from "../api/register";

export function RegisterForm() {
  const router = useRouter();
  const register = useRegister();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    referral_code: "",
  });
  const [err, setErr] = useState<string | null>(null);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await register.mutateAsync({
        ...form,
        phone: form.phone || null,
        referral_code: form.referral_code || null,
      });
      router.push("/home");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "signup failed");
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-up">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] text-brand-fg-dim">
        Get started
      </p>
      <h1 className="mb-3 font-display text-5xl font-light tracking-tight-display md:text-6xl">
        Start saving in <span className="text-brand-gold">gold</span>.
      </h1>
      <p className="mb-10 text-brand-fg-dim">Two minutes to your first gram.</p>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input placeholder="Full name" value={form.full_name} onChange={update("full_name")} required />
        <Input type="email" placeholder="Email" value={form.email} onChange={update("email")} required />
        <Input type="tel" placeholder="Phone (optional)" value={form.phone} onChange={update("phone")} />
        <Input
          type="password"
          placeholder="Password (min 6 chars)"
          value={form.password}
          onChange={update("password")}
          minLength={6}
          required
        />
        <Input
          placeholder="Referral code (optional)"
          value={form.referral_code}
          onChange={update("referral_code")}
        />
        {err && <p className="text-sm text-red-400">{err}</p>}
        <Button type="submit" disabled={register.isPending} size="lg" variant="gold">
          {register.isPending ? "Creating…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-brand-fg/60">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-fg underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
