"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  Beef,
  Flame,
  Heart,
  Pizza,
  Salad,
  Sparkles,
  Wallet,
} from "lucide-react";

import {
  MatchMeter,
  PizzaMascot,
  ToppingGlyph,
  toppingTone,
} from "@/components/dashboard/taste-dna-illustrations";
import { PizzaCard } from "@/components/public/cards";
import { EmptyState, LinkButton } from "@/components/shared/ui-kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getTasteDna } from "@/lib/recommendations";
import type { TasteDnaResponse, TasteScoreEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

const categoryIcon = (name: string) => {
  const value = name.toLocaleLowerCase();
  if (/veg|plant|garden|green|salad|mushroom/.test(value)) return Salad;
  if (/meat|bbq|beef|chicken|pepperoni|sausage/.test(value)) return Beef;
  if (/dessert|sweet|gourmet|special|premium|signature/.test(value)) return Sparkles;
  if (/classic|traditional|original/.test(value)) return Pizza;
  return Flame;
};

const PRICE_ZONES = ["Budget-friendly", "Mid-range", "Premium"] as const;

const LoadingState = () => (
  <div className="space-y-8" aria-busy="true">
    <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
      <PizzaMascot mood="happy" size={40} />
      <div className="min-w-0">
        <p className="text-sm font-semibold">Rolling in your flavors…</p>
        <p className="text-xs text-muted-foreground">Preparing a profile from your own activity.</p>
      </div>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-32 rounded-2xl" />
    </div>
    <div className="flex flex-wrap gap-2">
      {[0, 1, 2, 3, 4].map((index) => (
        <Skeleton key={index} className="h-7 w-24 rounded-full" />
      ))}
    </div>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[0, 1, 2, 3].map((index) => (
        <Skeleton key={index} className="h-80 rounded-2xl" />
      ))}
    </div>
  </div>
);

const IngredientChip = ({ entry }: { entry: TasteScoreEntry }) => (
  <Badge
    variant="secondary"
    className={cn("gap-1.5 rounded-full border px-3 py-1", toppingTone(entry.name))}
  >
    <span className="flex items-center">
      <ToppingGlyph name={entry.name} className="size-3.5" />
    </span>
    {entry.name}
    <span className="text-[10px] opacity-70">{entry.signals}</span>
  </Badge>
);

/** Three-zone strip driven only by the server-provided budget label. */
const PriceZoneMeter = ({ label }: { label: string }) => {
  const activeIndex = PRICE_ZONES.findIndex((zone) => zone === label);
  return (
    <div className="flex items-end gap-1.5" aria-hidden="true">
      {PRICE_ZONES.map((zone, index) => (
        <div key={zone} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <span
            className={cn(
              "h-1.5 w-full rounded-full",
              index === activeIndex
                ? "bg-gradient-to-r from-chart-1 to-chart-2 shadow-sm shadow-primary/30"
                : "bg-muted",
            )}
          />
          <span
            className={cn(
              "text-center text-[10px] leading-tight",
              index === activeIndex
                ? "font-semibold text-primary dark:text-primary"
                : "text-muted-foreground",
            )}
          >
            {zone}
          </span>
        </div>
      ))}
    </div>
  );
};

const reasonIcon = (reason: string) => {
  const value = reason.toLocaleLowerCase();
  if (value.includes("price")) return Wallet;
  if (value.includes("ingredient")) return Sparkles;
  if (value.includes("enjoy")) return Flame;
  return Heart;
};

export function TasteDnaPanel({
  favoriteIds = [],
  onChanged,
}: {
  favoriteIds?: string[];
  onChanged?: () => void;
}) {
  const [data, setData] = useState<TasteDnaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    const request = ++requestRef.current;
    setLoading(true);
    setError("");
    try {
      const result = await getTasteDna();
      if (request === requestRef.current) setData(result);
    } catch (loadError) {
      if (request === requestRef.current) {
        setError(loadError instanceof Error ? loadError.message : "Could not load your taste profile");
      }
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }, []);

  // The panel is only mounted when the Taste DNA tab is opened, so this runs
  // on demand rather than on every dashboard visit.
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  if (loading) return <LoadingState />;

  if (error) {
    // Mirrors the shared ErrorState (same message and retry action) while
    // swapping in the pizza illustration. API error handling is unchanged.
    return (
      <EmptyState
        icon={<PizzaMascot mood="oops" size={40} />}
        title="Something went wrong"
        description={error}
        action={
          <Button variant="outline" onClick={() => void load()}>
            Try again
          </Button>
        }
      />
    );
  }

  if (!data) return null;

  const { profile, recommendations } = data;
  const { budgetRange } = profile;
  const hasRange = budgetRange.min != null && budgetRange.max != null;
  const maxCategoryScore = Math.max(1, ...profile.topCategories.map((entry) => entry.score));

  if (profile.totalSignals === 0) {
    return (
      <EmptyState
        icon={<PizzaMascot mood="sleepy" size={40} />}
        title="Your Taste DNA is still waiting"
        description="This little pizza is still snoozing. Order a few pizzas or save some favorites and we'll build a taste profile from your own activity."
        action={<LinkButton href="/menu">Explore the menu</LinkButton>}
      />
    );
  }

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-chart-1/15 to-chart-2/10 ring-1 ring-primary/20 dark:from-chart-1/20 dark:to-chart-2/10">
              <PizzaMascot mood="happy" size={56} />
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-xl">Your Taste DNA</CardTitle>
              <p className="text-sm leading-relaxed text-muted-foreground">{profile.summary}</p>
            </div>
          </div>
          <Badge variant="secondary" className="w-fit shrink-0">
            {profile.status === "developing" ? "Still developing" : "Ready"}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border/70 bg-card p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Activity className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold">{profile.totalSignals}</p>
              <p className="text-xs text-muted-foreground">Analyzed preference signals</p>
            </div>
          </div>
          <div className="min-w-0 rounded-xl border border-border/70 bg-card p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Wallet className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold">{budgetRange.label}</p>
                <p className="text-xs text-muted-foreground">
                  {hasRange
                    ? `$${budgetRange.min!.toFixed(2)} - $${budgetRange.max!.toFixed(2)} from ${budgetRange.sampleSize} order${budgetRange.sampleSize === 1 ? "" : "s"}`
                    : "Not enough purchase history"}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <PriceZoneMeter label={budgetRange.label} />
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Flame className="size-5 text-primary" /> Your Favorite Flavors
        </h2>
        {profile.favoriteIngredients.length ? (
          <div className="flex flex-wrap gap-2">
            {profile.favoriteIngredients.map((entry) => (
              <IngredientChip key={entry.name} entry={entry} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Ingredients will appear here as you order and save pizzas.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Pizza className="size-5 text-primary" /> Your Favorite Categories
        </h2>
        {profile.topCategories.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {profile.topCategories.map((entry) => {
              const Icon = categoryIcon(entry.name);
              return (
                <Card key={entry.name} className="overflow-hidden transition-shadow hover:shadow-md">
                  <CardContent className="flex min-w-0 flex-col gap-2 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-chart-1/25 to-chart-2/10 text-primary dark:from-chart-1/25 dark:to-chart-2/10 dark:text-primary">
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{entry.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.signals} signal{entry.signals === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <div
                      className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                      title={`Relative affinity score: ${entry.score}`}
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-chart-1 to-chart-2"
                        style={{ width: `${(entry.score / maxCategoryScore) * 100}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Categories will appear here once your activity points to a clear preference.
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Heart className="size-5 text-primary" /> Recommended For You
        </h2>
        {recommendations.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recommendations.map(({ item, matchScore, reasons }) => (
              <div key={item.id} className="flex min-w-0 flex-col">
                <PizzaCard
                  item={item}
                  favorite={favoriteIds.includes(item.id)}
                  onChanged={onChanged}
                />
                <div className="mt-2 flex items-start gap-2.5 rounded-xl border border-primary/15 bg-primary/5 p-2.5">
                  <MatchMeter score={matchScore} />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="text-[11px] font-semibold text-primary dark:text-primary">
                      Taste Match
                    </p>
                    {reasons.length ? (
                      <div className="flex flex-wrap gap-1">
                        {reasons.map((reason, index) => {
                          const Icon = reasonIcon(reason);
                          return (
                            <span
                              key={`${reason}-${index}`}
                              className="inline-flex items-center gap-1 rounded-full bg-card/80 px-1.5 py-0.5 text-[10px] leading-tight text-muted-foreground ring-1 ring-primary/10"
                            >
                              <Icon className="size-3 shrink-0 text-primary" />
                              {reason}
                            </span>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<PizzaMascot mood="happy" size={40} />}
            title="No recommendations yet"
            description="There isn't enough eligible pizza data to match your taste right now. Keep exploring the menu."
            action={<LinkButton href="/menu">Browse pizzas</LinkButton>}
          />
        )}
      </section>
    </div>
  );
}
