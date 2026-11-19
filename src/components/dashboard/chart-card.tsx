import { BarChart3 } from "lucide-react";

import { EmptyState } from "@/components/shared/ui-kit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardMetricPoint } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ChartPoint = DashboardMetricPoint;
export type ChartVariant = "bar" | "line" | "donut";

const chartColor = (index: number) => `var(--chart-${(index % 5) + 1})`;

export function ChartCard({
  title,
  description,
  data,
  variant = "bar",
  formatValue = (value) => String(value),
  emptyMessage = "No data yet",
  className,
}: {
  title: string;
  description?: string;
  data: ChartPoint[];
  variant?: ChartVariant;
  formatValue?: (value: number) => string;
  emptyMessage?: string;
  className?: string;
}) {
  const max = Math.max(...data.map((point) => point.value), 1);
  const total = data.reduce((sum, point) => sum + point.value, 0);
  const summary = data
    .map((point) => `${point.label}: ${formatValue(point.value)}`)
    .join(", ");

  if (!data.length || total === 0) {
    return (
      <Card className={cn("min-w-0", className)}>
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">{title}</CardTitle>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<BarChart3 className="size-5" />}
            title={emptyMessage}
            description="This chart will update automatically when real data is available."
          />
        </CardContent>
      </Card>
    );
  }

  const linePoints = data.map((point, index) => ({
    x: data.length === 1 ? 50 : (index / (data.length - 1)) * 100,
    y: 36 - (point.value / max) * 30,
  }));
  const donutSegments = data.map((point, index) => ({
    point,
    index,
    percent: (point.value / total) * 100,
    offset: data
      .slice(0, index)
      .reduce((sum, previous) => sum + (previous.value / total) * 100, 0),
  }));

  return (
    <Card className={cn("min-w-0", className)}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </CardHeader>
      <CardContent className="min-w-0">
        <figure>
          {variant === "bar" ? (
            <ul className="space-y-4" role="list">
              {data.map((point, index) => (
                <li key={point.label} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-muted-foreground">{point.label}</span>
                    <span className="shrink-0 font-semibold tabular-nums">
                      {formatValue(point.value)}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{
                        width: `${Math.max((point.value / max) * 100, point.value > 0 ? 4 : 0)}%`,
                        backgroundColor: chartColor(index),
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {variant === "line" ? (
            <div className="space-y-3">
              <svg
                viewBox="0 0 100 40"
                preserveAspectRatio="none"
                className="h-40 w-full"
                role="img"
                aria-label={`${title}: ${summary}`}
              >
                {[10, 20, 30].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    x2="100"
                    y1={y}
                    y2={y}
                    stroke="var(--border)"
                    strokeWidth="0.4"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                <polyline
                  points={linePoints.map(({ x, y }) => `${x},${y}`).join(" ")}
                  fill="none"
                  stroke={chartColor(0)}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
                {linePoints.map(({ x, y }, index) => (
                  <circle
                    key={data[index].label}
                    cx={x}
                    cy={y}
                    r="1.2"
                    fill="var(--card)"
                    stroke={chartColor(0)}
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </svg>
              <ul
                className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 xl:grid-cols-7"
                role="list"
              >
                {data.map((point) => (
                  <li key={point.label} className="rounded-lg bg-muted/50 px-2 py-1.5">
                    <p className="truncate text-muted-foreground">{point.label}</p>
                    <p className="font-semibold tabular-nums">{formatValue(point.value)}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {variant === "donut" ? (
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
              <div className="relative mx-auto size-36 shrink-0 sm:size-40">
                <svg
                  viewBox="0 0 42 42"
                  className="size-full -rotate-90"
                  role="img"
                  aria-label={`${title}: ${summary}`}
                >
                  <circle
                    cx="21"
                    cy="21"
                    r="15.915"
                    fill="none"
                    stroke="var(--muted)"
                    strokeWidth="6"
                  />
                  {donutSegments.map(({ point, index, percent, offset }) => (
                    <circle
                      key={point.label}
                      cx="21"
                      cy="21"
                      r="15.915"
                      fill="none"
                      stroke={chartColor(index)}
                      strokeWidth="6"
                      pathLength={100}
                      strokeDasharray={`${percent} ${100 - percent}`}
                      strokeDashoffset={-offset}
                    />
                  ))}
                </svg>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold tabular-nums">{total}</span>
                  <span className="text-[11px] text-muted-foreground">Total</span>
                </div>
              </div>
              <ul className="grid w-full flex-1 gap-2 text-sm" role="list">
                {data.map((point, index) => (
                  <li key={point.label} className="flex items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: chartColor(index) }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">
                      {point.label}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums">
                      {formatValue(point.value)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <figcaption className="sr-only">{title}. {summary}.</figcaption>
        </figure>
      </CardContent>
    </Card>
  );
}

export function ChartCardSkeleton() {
  return (
    <Card className="min-w-0" aria-hidden="true">
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-3 w-52 max-w-full" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-2.5 w-full rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
