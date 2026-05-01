import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";

import { RootProvider } from "@/providers/root-provider";

import "@/styles/globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "mysafeGold Admin",
  description: "Operator console for the mysafeGold platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-brand-bg text-brand-fg antialiased">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
