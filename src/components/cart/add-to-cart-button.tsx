"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function AddToCartButton({
  menuItemId,
  quantity = 1,
  label = "Add to cart",
  variant = "outline",
  size = "sm",
  disabled = false,
  className,
}: {
  menuItemId: string;
  quantity?: number;
  label?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  disabled?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const { addItem, actionPending } = useCart();
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);

  const handleClick = async () => {
    if (pendingRef.current || actionPending || sessionPending) return;

    if (!session?.user) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (session.user.isBlocked === true) {
      router.push("/blocked");
      return;
    }
    if (session.user.role !== "customer") {
      toast.error("Only customer accounts can place orders.");
      return;
    }

    pendingRef.current = true;
    setPending(true);
    try {
      await addItem(menuItemId, quantity);
      toast.success("Added to your cart");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add this pizza to your cart");
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || pending || actionPending || sessionPending}
      aria-busy={pending}
      onClick={() => void handleClick()}
    >
      <ShoppingCart className="size-4" aria-hidden="true" />
      {pending ? "Adding..." : label}
    </Button>
  );
}
