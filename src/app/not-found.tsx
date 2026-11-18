import Link from "next/link";
import { Pizza } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
        <Pizza className="size-8" />
      </div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
        404 · Page not found
      </p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">This slice is missing</h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        The page you were looking for does not exist, has moved, or is no longer on the menu.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={cn(buttonVariants())}>
          Back to home
        </Link>
        <Link href="/menu" className={cn(buttonVariants({ variant: "outline" }))}>
          Browse the menu
        </Link>
      </div>
    </main>
  );
}
