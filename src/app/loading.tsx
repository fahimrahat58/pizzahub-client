export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading page"
      className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8"
    >
      <div className="h-3 w-32 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-10 w-2/3 max-w-xl animate-pulse rounded bg-muted" />
      <div className="mt-3 h-4 w-full max-w-2xl animate-pulse rounded bg-muted/70" />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border border-border/70 bg-card">
            <div className="aspect-[4/3] animate-pulse bg-muted" />
            <div className="space-y-3 p-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted/70" />
              <div className="h-8 w-full animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
