"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Receipt,
  RotateCcw,
  Search,
} from "lucide-react";

import { OrderStatusBadge } from "@/components/shared/ui-kit";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  PaginationControls,
} from "@/components/shared/ui-kit";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/stat-card";
import { PaymentStatusBadge, PaymentTypeBadge } from "@/components/payments/payment-badges";
import { TransactionTable } from "@/components/payments/transaction-table";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { formatMoney, getVendorPayments } from "@/lib/payment-api";
import type {
  Pagination,
  PaymentStatus,
  PaymentSummary,
  PaymentType,
  RestaurantDto,
  TransactionDto,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUSES: PaymentStatus[] = ["pending", "paid", "failed", "refunded"];
const TYPES: PaymentType[] = ["customer_order", "vendor_subscription"];
const SORTS = [
  { value: "newest", label: "Newest payment" },
  { value: "oldest", label: "Oldest payment" },
  { value: "amount_desc", label: "Amount: high to low" },
  { value: "amount_asc", label: "Amount: low to high" },
] as const;

const EMPTY_SUMMARY: PaymentSummary = {
  total: 0,
  customerOrders: 0,
  subscriptions: 0,
  paidCount: 0,
  pendingCount: 0,
  failedCount: 0,
  refundedCount: 0,
  paidAmount: 0,
  refundedAmount: 0,
  currency: "usd",
};

const selectClass =
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs outline-none sm:w-48";

const formatDateTime = (value: string | null): string =>
  value ? new Date(value).toLocaleString() : "—";

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 break-words text-sm font-medium">{value}</div>
    </div>
  );
}

export function VendorTransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });
  const [summary, setSummary] = useState<PaymentSummary>(EMPTY_SUMMARY);
  const [restaurants, setRestaurants] = useState<RestaurantDto[]>([]);
  const [status, setStatus] = useState<PaymentStatus | "all">("all");
  const [type, setType] = useState<PaymentType | "all">("all");
  const [sort, setSort] = useState<(typeof SORTS)[number]["value"]>("newest");
  const [restaurantId, setRestaurantId] = useState("all");
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<TransactionDto | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    let active = true;
    apiFetch<{ success: boolean; restaurants: RestaurantDto[] }>("/api/restaurants/mine")
      .then((data) => {
        if (active) setRestaurants(data.restaurants);
      })
      .catch(() => {
        // The filter simply shows "All restaurants" if this optional lookup fails.
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchDraft.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchDraft]);

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const data = await getVendorPayments({
        page,
        limit: 20,
        sort,
        ...(status === "all" ? {} : { status }),
        ...(type === "all" ? {} : { type }),
        ...(search ? { search } : {}),
        ...(restaurantId === "all" ? {} : { restaurantId }),
      });
      if (currentRequest !== requestId.current) return;
      setTransactions(data.transactions);
      setPagination(data.pagination);
      setSummary(data.summary ?? EMPTY_SUMMARY);
    } catch (loadError) {
      if (currentRequest !== requestId.current) return;
      setError(loadError instanceof Error ? loadError.message : "Could not load payment history");
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [page, restaurantId, search, sort, status, type]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Vendor payments"
        title="Payment history"
        description="Confirmed customer order payments and subscription receipts for your own restaurants."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }, (_, index) => <StatCardSkeleton key={index} />)
        ) : (
          <>
            <StatCard
              label="Payments"
              value={summary.total}
              icon={Receipt}
              hint={`${summary.customerOrders} orders · ${summary.subscriptions} subscriptions`}
            />
            <StatCard
              label="Paid amount"
              value={formatMoney(summary.paidAmount, summary.currency)}
              icon={CheckCircle2}
              hint={`${summary.paidCount} confirmed payments`}
            />
            <StatCard
              label="Refunded"
              value={formatMoney(summary.refundedAmount, summary.currency)}
              icon={RotateCcw}
              hint={`${summary.refundedCount} refunded payments`}
            />
            <StatCard
              label="Needs attention"
              value={summary.failedCount + summary.pendingCount}
              icon={AlertTriangle}
              hint={`${summary.failedCount} failed · ${summary.pendingCount} pending`}
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle>Payment ledger</CardTitle>
          <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap">
            <div className="relative sm:col-span-2 lg:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Order no., customer, restaurant"
                aria-label="Search payment history"
                className="pl-9"
              />
            </div>
            <select
              aria-label="Filter payments by type"
              value={type}
              onChange={(event) => {
                setType(event.target.value as PaymentType | "all");
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="all">All types</option>
              {TYPES.map((value) => (
                <option key={value} value={value}>
                  {value === "customer_order" ? "Customer orders" : "Subscriptions"}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter payments by status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as PaymentStatus | "all");
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="all">All statuses</option>
              {STATUSES.map((value) => (
                <option key={value} value={value}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter payments by restaurant"
              value={restaurantId}
              onChange={(event) => {
                setRestaurantId(event.target.value);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="all">All restaurants</option>
              {restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Sort payments"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as (typeof SORTS)[number]["value"]);
                setPage(1);
              }}
              className={selectClass}
            >
              {SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 size-5 animate-spin" /> Loading payment history...
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={() => void load()} />
          ) : transactions.length ? (
            <>
              <TransactionTable
                transactions={transactions}
                audience="vendor"
                onSelect={setSelected}
              />
              <PaginationControls
                page={pagination.page}
                pages={pagination.pages}
                onPageChange={setPage}
              />
            </>
          ) : (
            <EmptyState
              title="No payments found"
              description="Try clearing your filters. New customer payments and subscription receipts will appear here automatically."
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Payment details</DialogTitle>
            <DialogDescription>
              Verified payment information for this transaction.
            </DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <PaymentTypeBadge type={selected.paymentType} />
                {selected.paymentStatus ? (
                  <PaymentStatusBadge status={selected.paymentStatus} />
                ) : (
                  <Badge variant="outline" className="capitalize">
                    {selected.status}
                  </Badge>
                )}
                {selected.orderStatus ? (
                  <OrderStatusBadge status={selected.orderStatus} />
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Detail label="Amount" value={formatMoney(selected.amount, selected.currency)} />
                <Detail label="Provider" value={selected.paymentMethod ?? "—"} />
                <Detail label="Payment date" value={formatDateTime(selected.createdAt)} />
                <Detail label="Order date" value={formatDateTime(selected.orderCreatedAt)} />
                <Detail label="Customer" value={selected.customerName ?? "Guest customer"} />
                <Detail label="Customer reference" value={selected.customerReference ?? "—"} />
                <Detail
                  label="Restaurant"
                  value={selected.restaurantName ?? (selected.plan ? "Subscription" : "—")}
                />
                <Detail label="Order number" value={selected.orderNumber ?? "—"} />
                <Detail
                  label="Payment reference"
                  value={
                    selected.stripeSessionId
                      ? `${selected.stripeSessionId.slice(0, 16)}…`
                      : selected.stripeInvoiceId
                        ? `${selected.stripeInvoiceId.slice(0, 16)}…`
                        : "—"
                  }
                />
                <Detail
                  label="Refunded"
                  value={
                    selected.refundedAmount > 0
                      ? formatMoney(selected.refundedAmount, selected.currency)
                      : "—"
                  }
                />
              </div>

              {selected.description ? (
                <p className="rounded-lg border border-border/70 p-3 text-sm text-muted-foreground">
                  {selected.description}
                </p>
              ) : null}

              <DialogFooter className="gap-2">
                {selected.orderId ? (
                  <Link
                    href={`/dashboard/vendor/orders/${selected.orderId}`}
                    className={cn(buttonVariants({ variant: "outline" }))}
                    onClick={() => setSelected(null)}
                  >
                    View order details
                  </Link>
                ) : null}
                <Button variant="ghost" onClick={() => setSelected(null)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
