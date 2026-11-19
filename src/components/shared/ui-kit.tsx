"use client";

import {
  useRef,
  useState,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import Link from "next/link";
import { AlertCircle, ImagePlus, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { uploadImage } from "@/lib/api";
import type { ApprovalStatus, OrderStatus } from "@/lib/types";

export function Brand({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("text-2xl font-black tracking-tight", className)}
      aria-label="PizzaHub home"
    >
      <span className="text-orange-500">Pizza</span>Hub
    </Link>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon ?? <AlertCircle className="size-5" />}
      </div>
      <h3 className="font-semibold">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={<AlertCircle className="size-5 text-destructive" />}
      title="Something went wrong"
      description={message}
      action={
        onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        ) : undefined
      }
    />
  );
}

const orderStyles: Record<OrderStatus, string> = {
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  accepted: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  preparing: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  out_for_delivery: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  delivered: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  cancelled: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  rejected: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("capitalize", orderStyles[status])}
    >
      {status.replaceAll("_", " ")}
    </Badge>
  );
}

export function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  const styles: Record<ApprovalStatus, string> = {
    pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    rejected: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  };
  return (
    <Badge variant="outline" className={cn("capitalize", styles[status])}>
      {status}
    </Badge>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  destructive,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ImageUpload({
  value,
  onChange,
  onUploadingChange,
  label = "Food photo",
  hint = "JPG, PNG, WebP or GIF up to 4 MB",
  aspect = "aspect-[4/3]",
}: {
  value: string;
  onChange: (url: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
  label?: string;
  hint?: string;
  aspect?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);
  const [uploading, setUploading] = useState(false);

  const setUploadState = (next: boolean) => {
    uploadingRef.current = next;
    setUploading(next);
    onUploadingChange?.(next);
  };

  const handleFile = async (file?: File) => {
    if (!file || uploadingRef.current) return;
    setUploadState(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadState(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <label
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-border bg-muted/20 text-center transition hover:border-orange-500/60",
          aspect,
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          disabled={uploading}
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
        {value ? (
          // External ImgBB URLs are intentionally rendered without optimization.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Selected upload preview"
            className="absolute inset-0 size-full object-cover"
          />
        ) : null}
        <div
          className={cn(
            "relative z-10 flex flex-col items-center gap-2 rounded-lg bg-background/75 px-4 py-3 backdrop-blur-xs",
            value && "opacity-0 transition hover:opacity-100",
          )}
        >
          {uploading ? (
            <Loader2 className="size-6 animate-spin text-orange-500" />
          ) : (
            <ImagePlus className="size-6 text-orange-500" />
          )}
          <span className="text-sm font-medium">
            {uploading ? "Uploading..." : value ? "Change image" : "Choose an image"}
          </span>
        </div>
      </label>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Upload className="size-3" /> {hint}
      </p>
    </div>
  );
}

export function PaginationControls({
  page,
  pages,
  onPageChange,
}: {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 pt-4">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {pages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}

export function LinkButton({
  href,
  children,
  variant = "default",
  size = "default",
  className,
  onClick,
}: {
  href: string;
  children: ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant, size }), className)}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
