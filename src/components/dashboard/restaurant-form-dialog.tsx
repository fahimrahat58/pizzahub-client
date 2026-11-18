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
import type { RestaurantDto } from "@/lib/types";

const restaurantSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(1000),
  image: z.url("Upload a restaurant image"),
  address: z.string().trim().min(5, "Enter a full address").max(250),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(30),
  openingHours: z.string().trim().max(120).optional(),
});

type RestaurantValues = z.infer<typeof restaurantSchema>;

const emptyValues: RestaurantValues = {
  name: "",
  description: "",
  image: "",
  address: "",
  phone: "",
  openingHours: "",
};

const valuesFrom = (restaurant: RestaurantDto): RestaurantValues => ({
  name: restaurant.name,
  description: restaurant.description,
  image: restaurant.image,
  address: restaurant.address,
  phone: restaurant.phone,
  openingHours: restaurant.openingHours ?? "",
});

type RestaurantResponse = {
  success: boolean;
  message: string;
  restaurant: RestaurantDto;
};

export function RestaurantFormDialog({
  open,
  onOpenChange,
  restaurant,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant?: RestaurantDto | null;
  onSaved: (restaurant: RestaurantDto, created: boolean) => void;
}) {
  const form = useForm<RestaurantValues>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: emptyValues,
  });
  const saving = form.formState.isSubmitting;

  useEffect(() => {
    if (!open) return;
    form.reset(restaurant ? valuesFrom(restaurant) : emptyValues);
    form.clearErrors();
    // Only reset when the dialog target changes, not on every list refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, restaurant?.id]);

  const save = async (values: RestaurantValues) => {
    const payload = {
      ...values,
      openingHours: values.openingHours?.trim() || null,
    };
    try {
      const created = !restaurant;
      const data = created
        ? await apiFetch<RestaurantResponse>("/api/restaurants/mine", {
            method: "POST",
            body: payload,
          })
        : await apiFetch<RestaurantResponse>(
            `/api/restaurants/mine/${restaurant!.id}`,
            { method: "PUT", body: payload },
          );
      toast.success(data.message);
      onSaved(data.restaurant, created);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save restaurant",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {restaurant ? `Edit ${restaurant.name}` : "Add a restaurant"}
          </DialogTitle>
          <DialogDescription>
            Restaurant details are shown on your public page and help customers
            find your menu.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((values) => void save(values))} className="space-y-4">
          <ImageUpload
            value={form.watch("image")}
            onChange={(url) =>
              form.setValue("image", url, { shouldValidate: true })
            }
            label="Restaurant cover image"
            aspect="aspect-[16/7]"
          />
          {form.formState.errors.image ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.image.message}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="restaurantFormName">Name</Label>
              <Input id="restaurantFormName" {...form.register("name")} />
              {form.formState.errors.name ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="restaurantFormPhone">Phone</Label>
              <Input id="restaurantFormPhone" {...form.register("phone")} />
              {form.formState.errors.phone ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.phone.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="restaurantFormDescription">Description</Label>
            <Textarea id="restaurantFormDescription" {...form.register("description")} />
            {form.formState.errors.description ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.description.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="restaurantFormAddress">Address</Label>
              <Input id="restaurantFormAddress" {...form.register("address")} />
              {form.formState.errors.address ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.address.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="restaurantFormHours">Opening hours</Label>
              <Input
                id="restaurantFormHours"
                placeholder="Daily, 11am–11pm"
                {...form.register("openingHours")}
              />
            </div>
          </div>

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
              {restaurant ? "Save changes" : "Create restaurant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
