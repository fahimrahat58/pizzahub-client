"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { PaymentStatusBadge, PaymentTypeBadge } from "@/components/payments/payment-badges";
import { TransactionTable } from "@/components/payments/transaction-table";
import { EmptyState, ErrorState, PaginationControls } from "@/components/shared/ui-kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  formatMoney,
  getAdminTransaction,
  getAdminTransactions,
  refundAdminTransaction,
} from "@/lib/payment-api";
import type {
  AdminStats,
  Pagination,
  PaymentStatus,
  PaymentType,
  TransactionDto,
} from "@/lib/types";

const STATUSES: PaymentStatus[] = ["pending", "paid", "failed", "refunded"];
const TYPES: PaymentType[] = ["customer_order", "vendor_subscription"];

const selectClass =
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs outline-none sm:w-44";

export function AdminTransactionsPanel({ stats }: { stats?: AdminStats }) {
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PaymentStatus | "all">("all");
  const [type, setType] = useState<PaymentType | "all">("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [detail, setDetail] = useState<TransactionDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refunding, setRefunding] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminTransactions({
        page,
        limit: 20,
        search,
        ...(status === "all" ? {} : { status }),
        ...(type === "all" ? {} : { type }),
      });
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load transactions");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, type]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const openDetail = async (transaction: TransactionDto) => {
    setDetailLoading(true);
    setRefundAmount("");
    setRefundReason("");
    try {
      const data = await getAdminTransaction(transaction.id);
      setDetail(data.transaction);
    } catch (detailError) {
      toast.error(detailError instanceof Error ? detailError.message : "Could not load transaction");
    } finally {
      setDetailLoading(false);
    }
  };

  const remaining =
    detail && detail.paymentType === "customer_order"
      ? Math.max(0, Math.round((detail.amount - detail.refundedAmount) * 100) / 100)
      : 0;

  const submitRefund = async () => {
    if (!detail || refunding) return;
    const amount = refundAmount.trim() ? Number(refundAmount) : undefined;
    if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0)) {
      toast.error("Enter a valid refund amount.");
      return;
    }
    if (amount !== undefined && amount > remaining) {
      toast.error(`You can refund at most ${formatMoney(remaining, detail.currency)}.`);
      return;
    }

    setRefunding(true);
    try {
      const data = await refundAdminTransaction(detail.id, {
        ...(amount !== undefined ? { amount } : {}),
        ...(refundReason.trim() ? { reason: refundReason.trim() } : {}),
      });
      setDetail(data.transaction);
      setRefundAmount("");
      setRefundReason("");
      toast.success(data.message ?? "Refund issued");
      await load();
    } catch (refundError) {
      toast.error(refundError instanceof Error ? refundError.message : "Could not issue refund");
    } finally {
      setRefunding(false);
    }
  };

  return (
    <div className="space-y-5">
      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Order payments"
            value={stats.totalOrderPayments ?? 0}
            icon={CreditCard}
          />
          <StatCard
            label="Order payment revenue"
            value={formatMoney(stats.orderPaymentRevenue ?? 0, "usd")}
            icon={CreditCard}
          />
        </div>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-lg">Payment transactions</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              All Stripe-verified payments, including customer orders and vendor subscriptions.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-wrap">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search transactions"
                className="w-full pl-9 sm:w-56"
                placeholder="Vendor, customer, order, Stripe ID"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>
            <select
              aria-label="Filter transactions by type"
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
              aria-label="Filter transactions by status"
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
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 size-5 animate-spin" /> Loading transactions...
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={() => void load()} />
          ) : transactions.length ? (
            <>
              <TransactionTable
                transactions={transactions}
                audience="admin"
                onSelect={(transaction) => void openDetail(transaction)}
              />
              <PaginationControls
                page={pagination.page}
                pages={pagination.pages}
                onPageChange={setPage}
              />
            </>
          ) : (
            <EmptyState title="No payment transactions found" description="Try a different filter or search." />
          )}
        </CardContent>
      </Card>

      <Dialog
        open={detail !== null || detailLoading}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction details</DialogTitle>
            <DialogDescription>
              Stripe-verified payment record. Refunds are issued against the original payment.
            </DialogDescription>
          </DialogHeader>
          {detailLoading || !detail ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 size-5 animate-spin" /> Loading transaction...
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <PaymentTypeBadge type={detail.paymentType} />
                {detail.paymentStatus ? (
                  <PaymentStatusBadge status={detail.paymentStatus} />
                ) : (
                  <Badge variant="outline" className="capitalize">{detail.status}</Badge>
                )}
                <span className="text-lg font-semibold">
                  {formatMoney(detail.amount, detail.currency)}
                </span>
              </div>

              <div className="grid gap-3 rounded-xl border border-border/70 p-4 text-sm sm:grid-cols-2">
                <Detail label="Transaction ID" value={detail.id} mono />
                <Detail label="Created" value={new Date(detail.createdAt).toLocaleString()} />
                <Detail label="Vendor" value={detail.vendorName} />
                <Detail label="Vendor email" value={detail.vendorEmail} />
                <Detail label="Customer" value={detail.customerName ?? "—"} />
                <Detail label="Customer email" value={detail.customerEmail ?? "—"} />
                <Detail label="Restaurant" value={detail.restaurantName ?? "—"} />
                <Detail label="Order ID" value={detail.orderId ?? "—"} mono />
                <Detail label="Stripe Session" value={detail.stripeSessionId ?? "—"} mono />
                <Detail label="Payment Intent" value={detail.stripePaymentIntentId ?? "—"} mono />
                <Detail label="Webhook Event" value={detail.stripeEventId ?? "—"} mono />
                <Detail label="Description" value={detail.description ?? "—"} />
              </div>

              {detail.refunds.length ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Refund history</p>
                  {detail.refunds.map((refund) => (
                    <div
                      key={refund.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 p-3 text-xs"
                    >
                      <span className="font-mono">{refund.stripeRefundId}</span>
                      <span>{formatMoney(refund.amount, refund.currency)}</span>
                      <span className="text-muted-foreground">
                        {new Date(refund.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}

              {detail.paymentType === "customer_order" ? (
                <div className="space-y-3 border-t border-border/70 pt-4">
                  <p className="text-sm font-semibold">Issue a Stripe refund</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="refund-amount">
                        Amount ({formatMoney(remaining, detail.currency)} available)
                      </Label>
                      <Input
                        id="refund-amount"
                        type="number"
                        min="0.01"
                        max={remaining}
                        step="0.01"
                        placeholder="Leave blank for a full refund"
                        value={refundAmount}
                        disabled={remaining <= 0 || refunding}
                        onChange={(event) => setRefundAmount(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="refund-reason">Reason (optional)</Label>
                      <Input
                        id="refund-reason"
                        maxLength={200}
                        placeholder="Customer request"
                        value={refundReason}
                        disabled={remaining <= 0 || refunding}
                        onChange={(event) => setRefundReason(event.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    disabled={remaining <= 0 || refunding}
                    onClick={() => void submitRefund()}
                  >
                    {refunding ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                    {remaining <= 0 ? "Fully refunded" : "Issue refund"}
                  </Button>
                </div>
              ) : (
                <p className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                  Subscription payments are managed through the billing tools and cannot be refunded here.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetail(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={mono ? "truncate font-mono text-xs break-all" : "break-words"}>
        {value}
      </p>
    </div>
  );
}
