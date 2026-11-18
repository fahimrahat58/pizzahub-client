import { ShieldAlert } from "lucide-react";

import { LinkButton } from "@/components/shared/ui-kit";

export const metadata = { title: "Unauthorized" };

export default function UnauthorizedPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-24">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="size-6" />
        </div>
        <h1 className="mt-5 text-2xl font-bold">You don&apos;t have access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account role doesn&apos;t allow access to that area. If you think this is a
          mistake, contact an administrator.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <LinkButton href="/" variant="outline">Back home</LinkButton>
          <LinkButton href="/menu">Browse menu</LinkButton>
        </div>
      </div>
    </main>
  );
}
