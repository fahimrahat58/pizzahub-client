import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type ChartPoint = {
  label: string;
  value: number;
};

export function ChartCard({
  title,
  description,
  data,
}: {
  title: string;
  description?: string;
  data: ChartPoint[];
}) {
  const max = Math.max(...data.map((point) => point.value), 1);

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </CardHeader>
      <CardContent>
        <ul className="space-y-4" role="img" aria-label={title}>
          {data.map((point, index) => (
            <li key={point.label} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{point.label}</span>
                <span className="font-semibold tabular-nums">{point.value}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{
                    width: `${Math.max((point.value / max) * 100, point.value > 0 ? 4 : 0)}%`,
                    backgroundColor: `var(--chart-${(index % 5) + 1})`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
