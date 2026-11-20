"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { TransactionTable } from "@/components/payments/transaction-table";
import { EmptyState, ErrorState, PaginationControls } from "@/components/shared/ui-kit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMyPayments } from "@/lib/payment-api";
import type { Pagination, PaymentStatus, TransactionDto } from "@/lib/types";

const STATUSES: PaymentStatus[] = ["pending", "paid", "failed", "refunded"];

export function PaymentHistory() {
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });
  const [status, setStatus] = useState<PaymentStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyPayments({
        page,
        limit: 20,
        ...(status === "all" ? {} : { status }),
      });
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load payments");
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Payment history</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Verified Stripe payments for your orders.
          </p>
        </div>
        <select
          aria-label="Filter payments by status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as PaymentStatus | "all");
            setPage(1);
          }}
          className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs outline-none sm:w-44"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </option>
          ))}
        </select>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" /> Loading payments...
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : transactions.length ? (
          <>
            <TransactionTable transactions={transactions} audience="customer" />
            <PaginationControls
              page={pagination.page}
              pages={pagination.pages}
              onPageChange={setPage}
            />
          </>
        ) : (
          <EmptyState
            title="No payments yet"
            description="Payments for your orders will appear here after Stripe confirms them."
          />
        )}
      </CardContent>
    </Card>
  );
}
