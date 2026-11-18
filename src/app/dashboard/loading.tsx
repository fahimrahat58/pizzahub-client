export default function DashboardLoading() {
  return (
    <div data-dashboard-shell className="flex min-h-dvh bg-muted/20" aria-busy="true">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-background p-4 lg:flex">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded-lg bg-muted/70" />
          ))}
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex h-16 items-center border-b border-border bg-background px-6">
          <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="p-6">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="mt-4 h-9 w-72 max-w-full animate-pulse rounded bg-muted" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-xl border border-border/70 bg-card" />
            ))}
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="h-64 animate-pulse rounded-xl border border-border/70 bg-card" />
            <div className="h-64 animate-pulse rounded-xl border border-border/70 bg-card" />
          </div>
        </div>
      </div>
    </div>
  );
}
