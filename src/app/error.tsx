"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ErrorPage({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const message =
    error instanceof Error && error.message
      ? error.message
      : "An unexpected error interrupted this page.";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-8" />
      </div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
        Something went wrong
      </p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">We burnt this page</h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">{message}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={() => retry()}>Try again</Button>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to home
        </Link>
      </div>
    </main>
  );
}
