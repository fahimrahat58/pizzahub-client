import { Badge } from "@/components/ui/badge";
import type { PaymentStatus, PaymentType } from "@/lib/types";
import { cn } from "@/lib/utils";

const paymentStyles: Record<PaymentStatus, string> = {
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  paid: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  failed: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  refunded: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
};

const typeStyles: Record<PaymentType, string> = {
  customer_order: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  vendor_subscription: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("capitalize", paymentStyles[status])}
    >
      {status}
    </Badge>
  );
}

export function PaymentTypeBadge({ type }: { type: PaymentType }) {
  return (
    <Badge
      variant="outline"
      className={cn(typeStyles[type])}
    >
      {type === "customer_order" ? "Order" : "Subscription"}
    </Badge>
  );
}
