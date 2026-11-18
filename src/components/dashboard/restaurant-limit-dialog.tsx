"use client";

import { useRouter } from "next/navigation";
import { Crown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function RestaurantLimitDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  const goToSubscription = () => {
    onOpenChange(false);
    router.push("/dashboard/vendor/subscription");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 shadow-2xl shadow-black/10 ring-orange-500/20 dark:shadow-black/50 dark:ring-orange-400/20 sm:max-w-lg"
      >
        <div className="relative bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent px-6 pt-7 pb-6 sm:px-8">
          <div className="pointer-events-none absolute -top-12 -right-12 size-36 rounded-full bg-orange-500/10 blur-2xl" />
          <div className="relative mb-5 flex size-12 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-600 ring-1 ring-orange-500/20 dark:text-orange-400">
            <Crown className="size-6" />
          </div>
          <DialogHeader className="relative gap-3 pr-8">
            <DialogTitle className="text-xl leading-tight font-semibold sm:text-2xl">
              Restaurant Limit Reached
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              You&apos;ve reached your limit of 3 restaurants on your current plan.
              Upgrade to Premium to add more restaurants and grow your business.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="border-t border-border/70 bg-muted/20 px-6 py-5 sm:px-8">
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
            >
              Go Back
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={goToSubscription}
            >
              Upgrade to Premium
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
