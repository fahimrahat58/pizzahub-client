"use client";

import Link from "next/link";

import { PaymentStatusBadge, PaymentTypeBadge } from "@/components/payments/payment-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/payment-api";
import type { TransactionDto } from "@/lib/types";

const dashboardPath = {
  customer: "/dashboard/customer",
  vendor: "/dashboard/vendor",
  admin: "/dashboard/admin",
} as const;

export function TransactionTable({
  transactions,
  audience,
  onSelect,
}: {
  transactions: TransactionDto[];
  audience: keyof typeof dashboardPath;
  onSelect?: (transaction: TransactionDto) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Date</th>
            <th className="py-2 pr-4 font-medium">Type</th>
            {audience !== "customer" ? (
              <th className="py-2 pr-4 font-medium">Vendor</th>
            ) : null}
            {audience !== "admin" ? (
              <th className="py-2 pr-4 font-medium">Restaurant</th>
            ) : null}
            {audience !== "customer" ? (
              <th className="py-2 pr-4 font-medium">Customer</th>
            ) : null}
            <th className="py-2 pr-4 font-medium">Order</th>
            {audience === "vendor" ? (
              <th className="py-2 pr-4 font-medium">Order date</th>
            ) : null}
            <th className="py-2 pr-4 font-medium">Amount</th>
            <th className="py-2 pr-4 font-medium">Provider</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 pr-4 font-medium">Refunded</th>
            <th className="py-2 font-medium"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr
              key={transaction.id}
              className="border-b border-border/60 last:border-0"
            >
              <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground">
                {new Date(transaction.createdAt).toLocaleDateString()}
              </td>
              <td className="py-3 pr-4">
                <PaymentTypeBadge type={transaction.paymentType} />
              </td>
              {audience !== "customer" ? (
                <td className="py-3 pr-4">
                  <p className="font-medium">{transaction.vendorName}</p>
                  <p className="text-xs text-muted-foreground">
                    {transaction.vendorEmail}
                  </p>
                </td>
              ) : null}
              {audience !== "admin" ? (
                <td className="py-3 pr-4 text-muted-foreground">
                  {transaction.restaurantName ?? "—"}
                </td>
              ) : null}
              {audience !== "customer" ? (
                <td className="py-3 pr-4">
                  {transaction.customerName ? (
                    <>
                      <p className="font-medium">{transaction.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.customerReference ?? transaction.customerEmail ?? "—"}
                      </p>
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              ) : null}
              <td className="py-3 pr-4">
                {transaction.orderId ? (
                  <div className="space-y-0.5">
                    {transaction.orderNumber ? (
                      <p className="font-medium">{transaction.orderNumber}</p>
                    ) : null}
                    <Link
                      href={`${dashboardPath[audience]}/orders/${transaction.orderId}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {transaction.orderId.slice(-8)}
                    </Link>
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              {audience === "vendor" ? (
                <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground">
                  {transaction.orderCreatedAt
                    ? new Date(transaction.orderCreatedAt).toLocaleDateString()
                    : "—"}
                </td>
              ) : null}
              <td className="py-3 pr-4 font-medium whitespace-nowrap">
                {formatMoney(transaction.amount, transaction.currency)}
              </td>
              <td className="py-3 pr-4 capitalize text-muted-foreground">
                {transaction.paymentMethod ?? "—"}
              </td>
              <td className="py-3 pr-4">
                {transaction.paymentStatus ? (
                  <PaymentStatusBadge status={transaction.paymentStatus} />
                ) : (
                  <Badge variant="outline" className="capitalize">
                    {transaction.status}
                  </Badge>
                )}
              </td>
              <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground">
                {transaction.refundedAmount > 0
                  ? formatMoney(transaction.refundedAmount, transaction.currency)
                  : "—"}
              </td>
              <td className="py-3">
                {onSelect ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelect(transaction)}
                  >
                    Details
                  </Button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
