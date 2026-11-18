import type { Metadata } from "next";
import { Toaster } from "sonner";

import { SessionSync } from "@/components/auth/session-sync";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const themeScript = `try{var t=localStorage.getItem("pizzahub-theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}`;

export const metadata: Metadata = {
  title: {
    default: "PizzaHub — Crave it. Order it. Love it.",
    template: "%s | PizzaHub",
  },
  description:
    "Discover handcrafted pizzas from independent kitchens, order in seconds, and track every step to your door.",
};

// The shared header reads the live auth session on the client. Blocking
// navigation keeps that shell and the route-scoped dashboard chrome in sync.
export const instant = false;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <SessionSync />
          <SiteHeader />
          <div className="flex flex-1 flex-col">{children}</div>
          <SiteFooter />
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
