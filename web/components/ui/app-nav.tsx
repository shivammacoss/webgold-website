"use client";

import { Coins, Home, Share2, Settings, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/home",       label: "Home",       Icon: Home },
  { href: "/portfolio",  label: "Portfolio",  Icon: Coins },
  { href: "/wallet",     label: "Wallet",     Icon: Wallet },
  { href: "/referrals",  label: "Referrals",  Icon: Share2 },
  { href: "/settings",   label: "Settings",   Icon: Settings },
] as const;

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.07] bg-brand-bg/85 backdrop-blur-md md:hidden">
      <ul className="mx-auto flex max-w-md justify-around px-2 py-2">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = path === href || path?.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex min-w-[60px] flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-medium transition-colors",
                  active ? "text-brand-gold" : "text-brand-fg-dim",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SideNav() {
  const path = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-white/[0.07] bg-brand-bg/60 p-6 backdrop-blur-sm md:flex md:flex-col">
      <Link href="/home" className="mb-12 inline-flex items-baseline gap-1.5">
        <span className="font-display text-2xl font-light tracking-tight-display">
          mysafe<span className="text-brand-gold">Gold</span>
        </span>
      </Link>
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = path === href || path?.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-gold/10 text-brand-gold"
                    : "text-brand-fg-dim hover:bg-white/5 hover:text-brand-fg",
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2 : 1.5} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
