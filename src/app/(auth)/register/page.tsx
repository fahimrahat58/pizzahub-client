"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

type UserRole = "customer" | "vendor";

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState<UserRole>("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordValid = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(password);

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    if (!passwordValid) {
      toast.error(
        "Password must contain uppercase, lowercase and at least 8 characters",
      );
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });

      if (error) {
        toast.error(error.message || "Registration failed");
        return;
      }

      const createdRole = data?.user?.role === "vendor" ? "vendor" : "customer";

      toast.success("Account created successfully!");

      router.replace(`/dashboard/${createdRole}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard/customer",
      });
    } catch {
      toast.error("Google sign in failed");
    }
  };

  return (
    <main className="min-h-screen bg-[#100d0b] px-4 py-12 text-white">
      <div className="mx-auto grid min-h-[80vh] max-w-6xl items-center gap-12 lg:grid-cols-2">
        <section className="hidden lg:block">
          <Link href="/" className="text-3xl font-black tracking-tight">
            <span className="text-orange-500">Pizza</span>Hub
          </Link>

          <p className="mt-8 max-w-lg text-5xl font-bold leading-tight">
            Your favorite pizza, delivered with love.
          </p>

          <p className="mt-5 max-w-md text-lg text-stone-400">
            Join PizzaHub and discover delicious pizzas from restaurants around
            you.
          </p>
        </section>

        <section className="mx-auto w-full max-w-md rounded-2xl border border-stone-800 bg-[#1b1714] p-6 shadow-2xl sm:p-8">
          <div className="mb-7 text-center">
            <Link href="/" className="text-2xl font-black lg:hidden">
              <span className="text-orange-500">Pizza</span>Hub
            </Link>

            <h1 className="mt-3 text-3xl font-bold">Create Account</h1>
            <p className="mt-2 text-sm text-stone-400">
              Sign up to get started with PizzaHub
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">
                I want to join as
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("customer")}
                  className={`rounded-xl border p-3 text-sm font-semibold transition ${
                    role === "customer"
                      ? "border-orange-500 bg-orange-500/10 text-orange-400"
                      : "border-stone-700 text-stone-400 hover:border-stone-500"
                  }`}
                >
                  Customer
                </button>

                <button
                  type="button"
                  onClick={() => setRole("vendor")}
                  className={`rounded-xl border p-3 text-sm font-semibold transition ${
                    role === "vendor"
                      ? "border-orange-500 bg-orange-500/10 text-orange-400"
                      : "border-stone-700 text-stone-400 hover:border-stone-500"
                  }`}
                >
                  Vendor
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="name" className="mb-2 block text-sm">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-lg border border-stone-700 bg-[#100d0b] px-4 py-3 outline-none transition focus:border-orange-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-stone-700 bg-[#100d0b] px-4 py-3 outline-none transition focus:border-orange-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                className="w-full rounded-lg border border-stone-700 bg-[#100d0b] px-4 py-3 outline-none transition focus:border-orange-500"
              />

              <p className="mt-2 text-xs text-stone-500">
                At least 8 characters, including uppercase and lowercase
                letters.
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full rounded-lg border border-stone-700 bg-[#100d0b] px-4 py-3 outline-none transition focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-orange-500 px-4 py-3 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-stone-700" />
            <span className="text-xs text-stone-500">OR</span>
            <div className="h-px flex-1 bg-stone-700" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full rounded-lg border border-stone-700 px-4 py-3 font-medium transition hover:bg-stone-800"
          >
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-stone-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-orange-400 hover:text-orange-300"
            >
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
