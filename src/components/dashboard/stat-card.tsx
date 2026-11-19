import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  className,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  className?: string;
}) {
  return (
    <Card className={cn("min-w-0 border-border/70 bg-card", className)}>
      <CardContent className="flex items-start gap-3 p-4 sm:p-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="break-words text-2xl font-bold tabular-nums">{value}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
          {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatCardSkeleton() {
  return (
    <Card className="min-w-0 border-border/70 bg-card">
      <CardContent className="flex items-start gap-3 p-4 sm:p-5" aria-hidden="true">
        <Skeleton className="size-10 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-24 max-w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
