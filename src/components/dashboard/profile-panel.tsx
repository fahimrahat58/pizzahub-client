"use client";

import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ProfileImageUpload } from "@/components/dashboard/profile-image-upload";
import { ErrorState } from "@/components/shared/ui-kit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import type { UserDto } from "@/lib/types";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  businessName: z.string().trim().max(120).optional(),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((value) => value === "" || value.length >= 7, "Enter a valid phone number")
    .optional(),
  address: z
    .string()
    .trim()
    .max(250)
    .refine((value) => value === "" || value.length >= 5, "Enter a full address")
    .optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

export function ProfilePanel({ role }: { role: "customer" | "vendor" | "admin" }) {
  const [profile, setProfile] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", businessName: "", phone: "", address: "" },
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ success: boolean; user: UserDto }>("/api/users/me");
      setProfile(data.user);
      form.reset({
        name: data.user.name,
        businessName: data.user.businessName ?? "",
        phone: data.user.phone ?? "",
        address: data.user.address ?? "",
      });
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Could not load profile";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const saveProfile = async (values: ProfileValues) => {
    try {
      const data = await apiFetch<{ success: boolean; user: UserDto }>("/api/users/me", {
        method: "PATCH",
        body: {
          name: values.name,
          businessName: role === "vendor" ? values.businessName || null : undefined,
          phone: role === "vendor" ? values.phone || null : undefined,
          address: role === "vendor" ? values.address || null : undefined,
        },
      });
      setProfile(data.user);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save profile");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" /> Loading profile...
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Profile photo</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileImageUpload
            image={profile?.image ?? ""}
            onSaved={(user) => setProfile(user)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit((values) => void saveProfile(values))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profileName">Name</Label>
              <Input id="profileName" {...form.register("name")} />
              {form.formState.errors.name ? (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="profileEmail">Email</Label>
              <Input id="profileEmail" value={profile?.email ?? ""} disabled />
              <p className="text-xs text-muted-foreground">
                Managed by your sign-in provider and cannot be changed here.
              </p>
            </div>
            {role === "vendor" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="profileBusiness">Restaurant / business name</Label>
                  <Input id="profileBusiness" {...form.register("businessName")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profilePhone">Phone number</Label>
                  <Input id="profilePhone" {...form.register("phone")} />
                  {form.formState.errors.phone ? (
                    <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profileAddress">Address</Label>
                  <Textarea id="profileAddress" {...form.register("address")} />
                  {form.formState.errors.address ? (
                    <p className="text-xs text-destructive">{form.formState.errors.address.message}</p>
                  ) : null}
                </div>
              </>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="font-medium capitalize">{profile?.role}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="text-xs text-muted-foreground">Plan</p>
                <p className="font-medium capitalize">{profile?.subscriptionPlan}</p>
              </div>
            </div>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
