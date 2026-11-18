import type { Metadata } from "next";
import { Toaster } from "sonner";

import { SessionSync } from "@/components/auth/session-sync";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PizzaHub — Crave it. Order it. Love it.",
    template: "%s | PizzaHub",
  },
  description:
    "Discover handcrafted pizzas from independent kitchens, order in seconds, and track every step to your door.",
};

// The shared header reads the live pathname and auth session. With Cache
// Components enabled, those request-time values cannot be placed in the static
// shell, so opted-out blocking navigation is the documented fix for this app.
export const instant = false;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <SessionSync />
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
