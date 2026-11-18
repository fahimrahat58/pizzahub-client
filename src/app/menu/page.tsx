import type { Metadata } from "next";

import { MenuBrowser } from "@/components/public/menu-browser";
import { PageHeader } from "@/components/shared/ui-kit";

export const metadata: Metadata = {
  title: "Browse menu",
  description: "Explore approved pizzas from PizzaHub vendors.",
};

export default function MenuPage() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="The good stuff"
        title="Browse the menu"
        description="Search by name or ingredient, filter by category, and save the pizzas you love."
      />
      <div className="mt-8">
        <MenuBrowser />
      </div>
    </main>
  );
}
