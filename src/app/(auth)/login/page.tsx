"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleLogo } from "@/components/shared/google-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { postAuthDestination } from "@/lib/roles";

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

type LoginValues = z.infer<typeof loginSchema>;

const friendlySignInError = (message?: string | null): string => {
  const detail = (message ?? "").toLowerCase();
  if (/block|suspend|disabled/.test(detail)) return "Your account has been blocked.";
  if (
    /invalid|incorrect|unauthorized|not found|bad credential|email or password/.test(detail)
  ) {
    return "Invalid email or password.";
  }
  return "Something went wrong. Please try again.";
};

export default function LoginPage() {
  const router = useRouter();
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { data: session, isPending } = authClient.useSession();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!isPending && session?.user) {
      router.replace(
        session.user.isBlocked === true
          ? "/blocked"
          : postAuthDestination(session.user.role),
      );
    }
  }, [isPending, router, session]);

  const onSubmit = async (values: LoginValues) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    try {
      const { error } = await authClient.signIn.email({
        email: values.email.toLowerCase(),
        password: values.password,
      });

      if (error) {
        toast.error(friendlySignInError(error.message), { id: "sign-in-error" });
        return;
      }

      // Read the role from the server-backed session after the cookies are set.
      // The sign-in response is not used for authorization.
      const session = await authClient.getSession();
      if (session.error || !session.data?.user) {
        toast.error("Something went wrong. Please try again.", { id: "sign-in-error" });
        return;
      }

      if (session.data.user.isBlocked === true) {
        toast.error("Your account has been blocked.", { id: "sign-in-error" });
        router.replace("/blocked");
        return;
      }

      toast.success("Signed in successfully!", { id: "sign-in-success" });
      router.replace(postAuthDestination(session.data.user.role));
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.", { id: "sign-in-error" });
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
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
      title="Welcome back"
      subtitle="Sign in to continue to your PizzaHub dashboard."
      footer={
        <>
          New to PizzaHub?{" "}
          <Link href="/register" className="font-semibold text-orange-500 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form
        onSubmit={(event) => {
          void handleSubmit(onSubmit)(event);
        }}
        className="space-y-5"
      >
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

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your password"
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
          {errors.password ? (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          ) : null}
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={submitting || isSubmitting}
          aria-busy={submitting || isSubmitting}
        >
          {submitting || isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitting || isSubmitting ? "Signing in..." : "Sign in"}
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
        {googleLoading ? <Loader2 className="size-4 animate-spin" /> : <GoogleLogo />}
        Continue with Google
      </Button>
    </AuthShell>
  );
}
