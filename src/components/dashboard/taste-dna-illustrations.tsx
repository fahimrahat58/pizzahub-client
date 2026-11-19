/**
 * Self-contained inline-SVG artwork for the Taste DNA panel.
 *
 * Presentational only: no data fetching, no profile logic, no new dependencies.
 * Colours are either fixed food tones or theme-aware utility classes so the
 * illustrations stay readable in both light and dark mode.
 */

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const FLOAT_STYLES = `
@keyframes tdn-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
.tdn-float { animation: tdn-float 3.6s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .tdn-float { animation: none !important; }
}
`;

type Mood = "happy" | "sleepy" | "oops";

/** Friendly whole-pizza character used in the header, empty, error and loading states. */
export function PizzaMascot({
  mood = "happy",
  size = 64,
  className,
}: {
  mood?: Mood;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      className={cn("shrink-0", className)}
      aria-hidden="true"
      focusable="false"
    >
      <style>{FLOAT_STYLES}</style>
      <ellipse cx="48" cy="85" rx="24" ry="4" fill="currentColor" className="text-foreground/10" />
      <g className="tdn-float">
        <circle cx="48" cy="45" r="33" fill="#e89a45" />
        <circle cx="48" cy="45" r="33" fill="none" stroke="#c9741f" strokeWidth="2.5" />
        <circle cx="48" cy="45" r="26" fill="#fde7a3" />
        <circle cx="48" cy="45" r="26" fill="none" stroke="#f4cf7a" strokeWidth="1.5" />

        <g fill="#e9705f">
          <circle cx="37" cy="36" r="5" />
          <circle cx="60" cy="39" r="5.3" />
          <circle cx="45" cy="58" r="4.4" />
        </g>
        <g fill="#c95446" opacity="0.55">
          <circle cx="35.6" cy="34.8" r="1" />
          <circle cx="39" cy="37.6" r="0.9" />
          <circle cx="58.8" cy="37.6" r="1" />
          <circle cx="61.8" cy="41" r="0.9" />
          <circle cx="44.2" cy="57" r="0.9" />
        </g>
        <path d="M62 56c6-1 9-5 9-10-5 0-9 4-9 10Z" fill="#5fae6b" />

        <ellipse cx="31" cy="50" rx="4" ry="2.4" fill="#f4a09a" opacity="0.7" />
        <ellipse cx="65" cy="50" rx="4" ry="2.4" fill="#f4a09a" opacity="0.7" />

        {mood === "happy" ? (
          <>
            <ellipse cx="40" cy="44" rx="2.8" ry="3.6" fill="#5b3414" />
            <ellipse cx="56" cy="44" rx="2.8" ry="3.6" fill="#5b3414" />
            <circle cx="39.2" cy="42.8" r="0.9" fill="#fff" />
            <circle cx="55.2" cy="42.8" r="0.9" fill="#fff" />
            <path
              d="M41 53q7 7 14 0"
              fill="none"
              stroke="#5b3414"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </>
        ) : mood === "sleepy" ? (
          <>
            <path
              d="M36 44q4 4 8 0M52 44q4 4 8 0"
              fill="none"
              stroke="#5b3414"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path
              d="M43 53q5 4 10 0"
              fill="none"
              stroke="#5b3414"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M66 27h6l-6 6h6"
              fill="none"
              stroke="#8ea0b5"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : (
          <>
            <circle cx="40" cy="44" r="3.2" fill="#5b3414" />
            <circle cx="56" cy="44" r="3.2" fill="#5b3414" />
            <circle cx="39.4" cy="42.9" r="1" fill="#fff" />
            <circle cx="55.4" cy="42.9" r="1" fill="#fff" />
            <path
              d="M33 33l6 3"
              stroke="#5b3414"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M42 55q3-3 6 0t6 0"
              fill="none"
              stroke="#5b3414"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </>
        )}
      </g>
    </svg>
  );
}

const GlyphSvg = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <svg
    viewBox="0 0 24 24"
    className={cn("shrink-0", className)}
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);

/** Small cartoon topping glyph derived from the real ingredient name. */
export function ToppingGlyph({ name, className }: { name: string; className?: string }) {
  const value = name.toLocaleLowerCase();

  if (/pepperoni|salami|bacon|ham|sausage|chicken|beef|meat|bbq/.test(value)) {
    return (
      <GlyphSvg className={className}>
        <circle cx="9" cy="9" r="4" opacity="0.9" />
        <circle cx="16" cy="11" r="3.4" opacity="0.75" />
        <circle cx="11" cy="16" r="3" opacity="0.6" />
      </GlyphSvg>
    );
  }
  if (/mushroom/.test(value)) {
    return (
      <GlyphSvg className={className}>
        <path d="M4 12a8 8 0 0 1 16 0H4Z" />
        <path d="M10 12h4v5a2 2 0 0 1-4 0v-5Z" opacity="0.65" />
      </GlyphSvg>
    );
  }
  if (/olive/.test(value)) {
    return (
      <GlyphSvg className={className}>
        <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="4" />
        <circle cx="9" cy="9" r="1" opacity="0.6" />
      </GlyphSvg>
    );
  }
  if (/basil|herb|oregano|spinach|lettuce|green|leaf/.test(value)) {
    return (
      <GlyphSvg className={className}>
        <path d="M5 19C5 11 12 5 19 5c0 7-6 14-14 14Z" />
        <path d="M6 18 17 7" fill="none" stroke="var(--card)" strokeWidth="1" opacity="0.8" />
      </GlyphSvg>
    );
  }
  if (/pepper|jalape|chili|chilli|spicy/.test(value)) {
    return (
      <GlyphSvg className={className}>
        <circle cx="12" cy="13" r="7" fill="none" stroke="currentColor" strokeWidth="3.5" />
        <path d="M12 6V3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </GlyphSvg>
    );
  }
  if (/cheese|mozzarella|parmesan|feta|ricotta|cream/.test(value)) {
    return (
      <GlyphSvg className={className}>
        <path d="M4 18 20 6v12H4Z" opacity="0.9" />
        <circle cx="10" cy="15" r="1.4" fill="var(--card)" opacity="0.8" />
        <circle cx="15" cy="14" r="1" fill="var(--card)" opacity="0.8" />
      </GlyphSvg>
    );
  }
  if (/tomato|sauce/.test(value)) {
    return (
      <GlyphSvg className={className}>
        <circle cx="12" cy="13" r="8" opacity="0.9" />
        <path
          d="M12 5v3M9 6l3 2 3-2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </GlyphSvg>
    );
  }
  if (/pineapple/.test(value)) {
    return (
      <GlyphSvg className={className}>
        <path d="M12 3 19 12 12 21 5 12 12 3Z" opacity="0.9" />
        <path d="M8 12h8M12 8v8" fill="none" stroke="var(--card)" strokeWidth="1" opacity="0.7" />
      </GlyphSvg>
    );
  }
  if (/onion/.test(value)) {
    return (
      <GlyphSvg className={className}>
        <path
          d="M12 21c-5 0-8-4-8-9s3-9 8-9 8 4 8 9-3 9-8 9Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M12 19c-2.5-2-3.5-5-3.5-8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          opacity="0.7"
        />
      </GlyphSvg>
    );
  }
  return (
    <GlyphSvg className={className}>
      <path d="M12 3l2.2 6.1L20 11l-5.8 2L12 19l-2.2-6L4 11l5.8-1.9L12 3Z" opacity="0.9" />
      <circle cx="19" cy="18" r="1.4" opacity="0.5" />
    </GlyphSvg>
  );
}

/** Restrained, theme-aware chip colouring per topping family. */
export const toppingTone = (name: string): string => {
  const value = name.toLocaleLowerCase();
  if (/pepperoni|salami|bacon|ham|sausage|chicken|beef|meat|bbq/.test(value)) {
    return "border-rose-500/15 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }
  if (/mushroom|olive|basil|herb|oregano|spinach|lettuce|green|leaf|pepper|jalape|chili|chilli|spicy/.test(value)) {
    return "border-emerald-500/15 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }
  if (/cheese|mozzarella|parmesan|feta|ricotta|cream/.test(value)) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300";
  }
  if (/tomato|sauce|pineapple|onion/.test(value)) {
    return "border-orange-500/15 bg-orange-500/10 text-orange-700 dark:text-orange-300";
  }
  return "border-border/60 bg-secondary text-muted-foreground";
};

/** Compact circular progress meter for an existing 0-100 match score. */
export function MatchMeter({ score, className }: { score: number; className?: string }) {
  const percent = Math.max(0, Math.min(100, Math.round(score)));
  const radius = 17;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className={cn("relative size-12 shrink-0", className)}
      role="img"
      aria-label={`${percent}% Taste Match`}
    >
      <svg viewBox="0 0 44 44" className="size-full -rotate-90" aria-hidden="true" focusable="false">
        <circle
          cx="22"
          cy="22"
          r={radius}
          className="fill-orange-500/5 stroke-orange-500/15"
          strokeWidth="4"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          className="stroke-orange-500 transition-[stroke-dashoffset] duration-500"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center gap-px text-xs font-bold text-orange-600 dark:text-orange-300">
        {percent}
        <span className="text-[9px]">%</span>
      </span>
    </div>
  );
}
