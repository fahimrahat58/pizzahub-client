"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ImageUpload } from "@/components/shared/ui-kit";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import type { MenuItemDto, RestaurantDto } from "@/lib/types";

const menuSchema = z.object({
  restaurantId: z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, "Select one of your restaurants"),
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(100),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(1000),
  category: z.string().trim().min(2).max(40),
  price: z.number().positive("Price must be greater than 0").max(1000),
  ingredients: z.string().trim().min(1, "Add at least one ingredient"),
  image: z.url("Upload a menu image"),
  isActive: z.boolean(),
});

type MenuValues = z.infer<typeof menuSchema>;

const selectClass =
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function MenuFormDialog({
  open,
  onOpenChange,
  restaurants,
  defaultRestaurantId,
  item,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurants: RestaurantDto[];
  defaultRestaurantId?: string | null;
  item?: MenuItemDto | null;
  onSaved: () => void;
}) {
  const form = useForm<MenuValues>({
    resolver: zodResolver(menuSchema),
    defaultValues: {
      restaurantId: "",
      name: "",
      description: "",
      category: "Pizza",
      price: 12,
      ingredients: "",
      image: "",
      isActive: true,
    },
  });
  const saving = form.formState.isSubmitting;

  useEffect(() => {
    if (!open) return;
    const preferred =
      item?.restaurantId ??
      defaultRestaurantId ??
      (restaurants.length === 1 ? restaurants[0].id : "");
    form.reset({
      restaurantId: preferred,
      name: item?.name ?? "",
      description: item?.description ?? "",
      category: item?.category ?? "Pizza",
      price: item?.price ?? 12,
      ingredients: item?.ingredients.join(", ") ?? "",
      image: item?.image ?? "",
      isActive: item?.isActive ?? true,
    });
    form.clearErrors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id, defaultRestaurantId, restaurants.length]);

  const save = async (values: MenuValues) => {
    const payload = {
      restaurantId: values.restaurantId,
      name: values.name,
      description: values.description,
      category: values.category,
      price: Number(values.price),
      ingredients: values.ingredients
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
      image: values.image,
      isActive: values.isActive,
    };
    try {
      if (item) {
        await apiFetch(`/api/menu/vendor/${item.id}`, {
          method: "PATCH",
          body: payload,
        });
        toast.success("Pizza updated");
      } else {
        await apiFetch("/api/menu/vendor", {
          method: "POST",
          body: payload,
        });
        toast.success("Pizza published");
      }
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save pizza");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item ? "Edit pizza" : "Add a new pizza"}</DialogTitle>
          <DialogDescription>
            New pizzas are published immediately and visible on your public menu.
            Unpublished items never count toward the free plan limit.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((values) => void save(values))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="menuRestaurant">Restaurant</Label>
            <select
              id="menuRestaurant"
              className={selectClass}
              {...form.register("restaurantId")}
            >
              <option value="">Select a restaurant</option>
              {restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
            {form.formState.errors.restaurantId ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.restaurantId.message}
              </p>
            ) : null}
          </div>

          <ImageUpload
            value={form.watch("image")}
            onChange={(url) =>
              form.setValue("image", url, { shouldValidate: true })
            }
          />
          {form.formState.errors.image ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.image.message}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="menuName">Name</Label>
              <Input id="menuName" {...form.register("name")} />
              {form.formState.errors.name ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="menuCategory">Category</Label>
              <Input id="menuCategory" {...form.register("category")} />
              {form.formState.errors.category ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.category.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="menuDescription">Description</Label>
            <Textarea id="menuDescription" {...form.register("description")} />
            {form.formState.errors.description ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.description.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="menuPrice">Price (USD)</Label>
              <Input
                id="menuPrice"
                type="number"
                step="0.01"
                min="0"
                {...form.register("price", { valueAsNumber: true })}
              />
              {form.formState.errors.price ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.price.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="menuIngredients">Ingredients (comma separated)</Label>
              <Input
                id="menuIngredients"
                placeholder="Tomato, mozzarella, basil"
                {...form.register("ingredients")}
              />
              {form.formState.errors.ingredients ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.ingredients.message}
                </p>
              ) : null}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4" {...form.register("isActive")} />
            Published (visible and orderable on your public menu)
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {item ? "Save changes" : "Publish pizza"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
