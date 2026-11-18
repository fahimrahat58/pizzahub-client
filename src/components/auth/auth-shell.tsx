import type { ReactNode } from "react";
import Link from "next/link";
import { ChefHat, Clock3, MapPin, Star } from "lucide-react";

import { Brand } from "@/components/shared/ui-kit";

const highlights = [
  { icon: ChefHat, title: "Independent kitchens", text: "Discover pizzas you won't find anywhere else." },
  { icon: Clock3, title: "Live order tracking", text: "Follow your pizza from oven to doorstep." },
  { icon: MapPin, title: "Local delivery", text: "Support restaurants right around the corner." },
];

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="hero-glow flex flex-1 items-stretch">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:py-16">
        <section className="hidden flex-col justify-center lg:flex">
          <Brand className="text-3xl" />
          <h1 className="mt-12 max-w-xl text-balance text-5xl font-bold leading-[1.05] tracking-tight xl:text-6xl">
            Great pizza starts with a{" "}
            <span className="text-orange-500">great ordering experience.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Join PizzaHub to explore neighbourhood favourites, save the pizzas you
            love, and order with confidence.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {highlights.map(({ icon: Icon, title: heading, text }) => (
              <div
                key={heading}
                className="rounded-xl border border-border/70 bg-card/70 p-4 backdrop-blur-xs"
              >
                <Icon className="size-5 text-orange-500" />
                <h2 className="mt-3 text-sm font-semibold">{heading}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
            <div className="rounded-xl border border-border/70 bg-card/70 p-4 backdrop-blur-xs sm:col-span-2">
              <div className="flex items-center gap-1 text-orange-500">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="size-4 fill-current" />
                ))}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Loved by pizza nights, date nights, and everything in between.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <Brand />
          </div>
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xl shadow-black/5 sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-7">{children}</div>
            <div className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">
              {footer}
            </div>
          </div>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            By continuing you agree to our{" "}
            <Link href="/" className="underline underline-offset-2">
              terms of use
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
