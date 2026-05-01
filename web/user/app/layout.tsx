import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import Script from "next/script";

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
  title: "mysafeGold — Live gold investing & Gold FDs",
  description:
    "Buy digital gold at the live market rate, lock into Gold FDs, manage your wallet — all in one place.",
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
        {/* Razorpay Checkout — exposes window.Razorpay globally. Loaded
            once at the layout level so the deposit sheet can open it instantly. */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
