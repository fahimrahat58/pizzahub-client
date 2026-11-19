"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Eye, EyeOff, Info, Loader2, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AuthShell } from "@/components/auth/auth-shell";
import { ImageUpload } from "@/components/shared/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { postAuthDestination } from "@/lib/roles";
import { cn } from "@/lib/utils";

const registerSchema = z
  .object({
    role: z.enum(["customer", "vendor"]),
    name: z.string().trim().min(2, "Enter your full name"),
    email: z.email("Enter a valid email address"),
    password: z
      .string()
      .min(6, "Use at least 6 characters")
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/[A-Z]/, "Include an uppercase letter"),
    confirmPassword: z.string(),
    image: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

type RegisterValues = z.infer<typeof registerSchema>;

const friendlyAuthError = (message: string): string => {
  if (/already|exist|duplicate|taken/i.test(message)) {
    return "An account with that email already exists. Try signing in instead.";
  }
  if (/internal server|unavailable|failed to fetch|network/i.test(message)) {
    return "We couldn't complete registration right now. Please try again in a moment.";
  }
  return message;
};

export default function RegisterPage() {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "customer",
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      image: "",
    },
  });

  const role = watch("role");

  const onSubmit = async (values: RegisterValues) => {
    // A profile image may still be in flight; submitting early would create an
    // account without the uploaded URL.
    if (imageUploading) return;
    try {
      const { data, error } = await authClient.signUp.email({
        name: values.name,
        email: values.email.toLowerCase(),
        password: values.password,
        role: values.role,
        ...(values.image ? { image: values.image } : {}),
      });

      if (error) {
        toast.error(friendlyAuthError(error.message ?? "Registration failed"));
        return;
      }

      // Use the freshly loaded server session. The signup response is only a
      // fallback and never the form's client-supplied role.
      const session = await authClient.getSession();
      const role = session.data?.user.role ?? data?.user.role;
      if (session.error || !role) {
        toast.error("We couldn't load your session. Please try again.");
        return;
      }

      toast.success("Welcome to PizzaHub!");
      router.replace(postAuthDestination(role));
      router.refresh();
    } catch (error) {
      toast.error(
        friendlyAuthError(error instanceof Error ? error.message : "Registration failed"),
      );
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/auth/callback",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-in failed");
      setGoogleLoading(false);
    }
  };

  return (
    <AuthShell
      title="Sign Up"
      subtitle="Choose how you want to use PizzaHub. You can always change your role later."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-orange-500 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit((values) => void onSubmit(values))} className="space-y-5">
        <div className="space-y-2">
          <Label>Account Role</Label>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                value: "customer" as const,
                label: "Customer",
                description: "Order your favourite pizzas",
                icon: ShoppingBag,
              },
              {
                value: "vendor" as const,
                label: "Vendor (Restaurant Owner)",
                description: "Manage a restaurant and menu",
                icon: Building2,
              },
            ].map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setValue("role", option.value)}
                  aria-pressed={role === option.value}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition",
                    role === option.value
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-border hover:border-orange-500/50",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5",
                      role === option.value ? "text-orange-500" : "text-muted-foreground",
                    )}
                  />
                  <span className="text-sm font-semibold">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" autoComplete="name" placeholder="Jane Doe" {...register("name")} />
          {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register("email")}
          />
          {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
        </div>

        <ImageUpload
          value={watch("image") ?? ""}
          onChange={(url) => setValue("image", url, { shouldValidate: true })}
          onUploadingChange={setImageUploading}
          label="Profile Image (optional)"
          hint="JPG, PNG, WebP or GIF up to 5 MB. You can skip this step."
          aspect="aspect-[3/1]"
        />

        {role === "vendor" ? (
          <div className="flex gap-3 rounded-xl border border-orange-500/25 bg-orange-500/5 p-4 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-orange-500" />
            <p className="text-muted-foreground">
              Just create your account for now. You can add your restaurant,
              photos, and menu from the vendor dashboard after signing in.
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                className="pr-10"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use at least 6 characters with one uppercase and one lowercase letter.
            </p>
            {errors.password ? (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repeat password"
                className="pr-10"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((visible) => !visible)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition hover:text-foreground"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                aria-pressed={showConfirmPassword}
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.confirmPassword ? (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            ) : null}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isSubmitting || imageUploading}
        >
          {isSubmitting || imageUploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <UtensilsCrossed className="size-4" />
          )}
          {imageUploading
            ? "Finishing image upload..."
            : isSubmitting
              ? "Creating account..."
              : "Sign Up"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={googleLoading}
        onClick={() => void handleGoogle()}
      >
        {googleLoading ? <Loader2 className="size-4 animate-spin" /> : null}
        Continue with Google
      </Button>
    </AuthShell>
  );
}
