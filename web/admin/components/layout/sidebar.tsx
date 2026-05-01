"use client";

import {
  Coins,
  LayoutDashboard,
  LogOut,
  Receipt,
  Share2,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { tokenStore } from "@/features/auth/store/auth-store";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", Icon: LayoutDashboard },
  { href: "/users", label: "Users", Icon: Users },
  { href: "/transactions", label: "Transactions", Icon: Receipt },
  { href: "/fds", label: "Gold FDs", Icon: Coins },
  { href: "/gold", label: "Gold rate", Icon: TrendingUp },
  { href: "/referrals", label: "Referrals", Icon: Share2 },
] as const;

export function Sidebar() {
  const path = usePathname();
  const router = useRouter();

  const logout = () => {
    tokenStore.clear();
    router.replace("/login");
  };

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-white/[0.07] bg-brand-bg/60 p-5">
      <Link href="/dashboard" className="mb-10 inline-flex items-baseline gap-1.5">
        <span className="font-display text-xl font-light tracking-tight-display">
          mysafe<span className="text-brand-gold">Gold</span>
        </span>
        <span className="text-[10px] uppercase tracking-widest text-brand-fg-dim">Admin</span>
      </Link>
      <ul className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = path === href || path?.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-gold/10 text-brand-gold"
                    : "text-brand-fg-dim hover:bg-white/5 hover:text-brand-fg",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={active ? 2 : 1.5} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <button
        onClick={logout}
        className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-brand-fg-dim transition-colors hover:bg-white/5 hover:text-brand-fg"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.5} />
        Sign out
      </button>
    </aside>
  );
}
