import { Suspense } from "react";
import type { Metadata } from "next";
import { Toaster } from "sonner";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Suspense fallback={<div className="h-16 border-b border-border/70 bg-background" />}>
          <SiteHeader />
        </Suspense>
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
