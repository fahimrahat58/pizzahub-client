import { Ban } from "lucide-react";

import { LinkButton } from "@/components/shared/ui-kit";

export const metadata = { title: "Account blocked" };

export default function BlockedPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-24">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <Ban className="size-6" />
        </div>
        <h1 className="mt-5 text-2xl font-bold">Account suspended</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your PizzaHub account has been blocked by an administrator. Please contact
          support if you believe this was a mistake.
        </p>
        <div className="mt-6">
          <LinkButton href="/" variant="outline">Back home</LinkButton>
        </div>
      </div>
    </main>
  );
}
