import { DashboardChromeStyles } from "@/components/dashboard/dashboard-chrome-styles";
import { ChartCardSkeleton } from "@/components/dashboard/chart-card";
import { StatCardSkeleton } from "@/components/dashboard/stat-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div data-dashboard-shell className="flex min-h-dvh w-full bg-muted/20" aria-busy="true">
      <DashboardChromeStyles />
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <Skeleton className="h-8 w-32" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </aside>
      <div className="min-w-0 max-w-none flex-1">
        <div className="flex h-16 items-center border-b border-border bg-background px-4 sm:px-6">
          <Skeleton className="h-4 w-48 max-w-full" />
        </div>
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-9 w-72 max-w-full" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <StatCardSkeleton key={index} />
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <ChartCardSkeleton />
            <ChartCardSkeleton />
            <ChartCardSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
