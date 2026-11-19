import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CreditCard, Headphones, Mail, MapPin, Phone } from "lucide-react";

import { LinkButton } from "@/components/shared/ui-kit";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supportContact } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Contact Support",
  description:
    "Get in touch with PizzaHub support about orders, vendor accounts, or Premium billing.",
};

export default function ContactSupportPage() {
  return (
    <div className="hero-glow flex-1 overflow-x-clip">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <header className="space-y-5">
          <div className="flex items-center gap-2 text-orange-500">
            <Headphones className="size-5" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">Help &amp; support</p>
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Contact Support
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Need a hand with an order, your vendor account, or Premium billing? Reach
            the PizzaHub team using the details below and we will do our best to help.
          </p>
        </header>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Get in touch</CardTitle>
            </CardHeader>
            <CardContent className="gap-4">
              <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                    <Mail className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Email support</p>
                    <p className="break-all text-sm text-muted-foreground">
                      {supportContact.email}
                    </p>
                  </div>
                </div>
                <a
                  href={supportContact.emailHref}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/80"
                >
                  Email us <ArrowUpRight className="size-4" />
                </a>
              </div>

              <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                    <Phone className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Call support</p>
                    <p className="break-all text-sm text-muted-foreground">
                      {supportContact.phone}
                    </p>
                  </div>
                </div>
                <a
                  href={supportContact.phoneHref}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-4 text-sm font-medium transition hover:bg-muted"
                >
                  Call us <ArrowUpRight className="size-4" />
                </a>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/30 p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                  <MapPin className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Address</p>
                  <p className="break-words text-sm text-muted-foreground">
                    {supportContact.address}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-orange-500/25 bg-gradient-to-br from-orange-500/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CreditCard className="size-5 text-orange-500" /> For vendors
                </CardTitle>
              </CardHeader>
              <CardContent className="gap-4 text-sm leading-relaxed text-muted-foreground">
                <p>
                  For questions about Premium plans, payments, or your billing cycle,
                  check your subscription page first. You can review your current plan,
                  refresh its status, and open the Stripe Billing Portal there.
                </p>
                <p>
                  If you contact us about billing, include the subscription ID shown on
                  that page so we can find the right account more quickly.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/dashboard/vendor/subscription"
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/80"
                  >
                    Manage subscription
                  </Link>
                  <Link
                    href="/dashboard/vendor"
                    className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium transition hover:bg-muted"
                  >
                    Vendor dashboard
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardContent className="gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="w-fit">
                  Quick links
                </Badge>
                <Link href="/terms-of-use" className="w-fit hover:text-orange-600 dark:hover:text-orange-400">
                  Read our Terms of Use
                </Link>
                <Link href="/" className="w-fit hover:text-orange-600 dark:hover:text-orange-400">
                  Back to the PizzaHub home page
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <LinkButton href="/dashboard/vendor/subscription">
            <ArrowLeft className="size-4" /> Back to subscription
          </LinkButton>
          <LinkButton href="/" variant="outline">
            Back to home
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
