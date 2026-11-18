/**
 * Canonical menu categories used by the homepage, the public menu filter, and
 * the vendor Add/Edit Menu form. The stored value is the name itself so the
 * existing `category` API query parameter keeps working unchanged.
 */
export const MENU_CATEGORIES = [
  "Classic Pizzas",
  "Vegetarian Pizzas",
  "Meat Lovers",
  "Specialty / Gourmet Pizzas",
  "Sides & Appetizers",
  "Beverages & Desserts",
] as const;

export type MenuCategory = (typeof MENU_CATEGORIES)[number];

const normalize = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLowerCase();

/** Canonical categories first, followed by any distinct values from the API. */
export const mergeCategories = (values: string[]): string[] => {
  const merged = [...MENU_CATEGORIES] as string[];
  for (const value of values) {
    const trimmed = value.trim();
    if (
      trimmed &&
      !merged.some((existing) => normalize(existing) === normalize(trimmed))
    ) {
      merged.push(trimmed);
    }
  }
  return merged;
};

/** Maps case/spacing variants (and URL values) back to a displayable option. */
export const canonicalizeCategory = (
  value: string,
  options: string[] = [...MENU_CATEGORIES],
): string => {
  const normalized = normalize(value);
  return (
    options.find((option) => normalize(option) === normalized) ?? value.trim()
  );
};
