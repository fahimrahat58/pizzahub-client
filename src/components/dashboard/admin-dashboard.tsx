"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ClipboardList,
  CreditCard,
  Loader2,
  Pizza,
  ShieldCheck,
  Store,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import { AdminReviewsPanel } from "@/components/dashboard/admin-reviews-panel";
import { AdminTransactionsPanel } from "@/components/dashboard/admin-transactions-panel";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DashboardOverviewSkeleton } from "@/components/dashboard/dashboard-overview-skeleton";
import { OrderCard } from "@/components/dashboard/order-card";
import { ProfilePanel } from "@/components/dashboard/profile-panel";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  ApprovalBadge,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/shared/ui-kit";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { billingIntervalLabel } from "@/lib/subscriptions";
import type {
  AdminDashboardResponse,
  DashboardSummary,
  DashboardSummaryResponse,
  ListResponse,
  MenuItemDto,
  OrderDto,
  Pagination,
  SubscriptionEventDto,
  UserDto,
  UserRole,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { useHashTab } from "@/lib/use-hash-tab";

const TABS = ["overview", "menu", "users", "billing", "transactions", "orders", "reviews", "profile"] as const;
type Tab = (typeof TABS)[number];

const tabLabels: Record<Tab, string> = {
  overview: "Overview",
  menu: "Menu moderation",
  users: "Users",
  billing: "Billing",
  transactions: "Transactions",
  orders: "Orders",
  reviews: "Reviews",
  profile: "Profile",
};

type MenuDecision = {
  item: MenuItemDto;
  action: "hide" | "restore";
};

type AdminStatsPayload = AdminDashboardResponse & {
  stats: AdminDashboardResponse["stats"] & { hiddenMenuItems: number };
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatOptionalDate = (value: string | null) => (value ? formatDate(value) : "—");

export function AdminDashboard() {
  const [tab, setTab] = useHashTab<Tab>("overview", TABS);
  const { data: session } = authClient.useSession();

  const [summary, setSummary] = useState<AdminStatsPayload | null>(null);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemDto[]>([]);
  const [menuSearchInput, setMenuSearchInput] = useState("");
  const [menuSearch, setMenuSearch] = useState("");
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [coreLoading, setCoreLoading] = useState(true);
  const [coreError, setCoreError] = useState("");

  const [users, setUsers] = useState<UserDto[]>([]);
  const [usersPagination, setUsersPagination] = useState<Pagination | null>(null);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [userPage, setUserPage] = useState(1);

  const [billingVendors, setBillingVendors] = useState<UserDto[]>([]);
  const [billingSearchInput, setBillingSearchInput] = useState("");
  const [billingSearch, setBillingSearch] = useState("");
  const [billingLoading, setBillingLoading] = useState(true);
  const [billingError, setBillingError] = useState("");
  const [billingHistory, setBillingHistory] = useState<{
    vendor: UserDto;
    events: SubscriptionEventDto[];
  } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [decision, setDecision] = useState<MenuDecision | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [deleteMenuItemTarget, setDeleteMenuItemTarget] = useState<MenuItemDto | null>(null);
  const [blockTarget, setBlockTarget] = useState<UserDto | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<UserDto | null>(null);
  const [roleChange, setRoleChange] = useState<{
    user: UserDto;
    role: "customer" | "vendor";
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const loadCore = useCallback(async () => {
    setCoreLoading(true);
    setCoreError("");
    try {
      const menuParams = new URLSearchParams({ limit: "50" });
      if (menuSearch.trim()) menuParams.set("search", menuSearch.trim());
      const [statsData, menuData, orderData, summaryData] = await Promise.all([
        apiFetch<AdminStatsPayload>("/api/admin/stats"),
        apiFetch<ListResponse<MenuItemDto>>(`/api/menu/admin/all?${menuParams}`),
        apiFetch<{ success: boolean; orders: OrderDto[] }>("/api/orders/admin?limit=50"),
        apiFetch<DashboardSummaryResponse>("/api/dashboard/summary"),
      ]);
      setSummary(statsData);
      setDashboardSummary(summaryData.summary);
      setMenuItems(menuData.items);
      setOrders(orderData.orders);
    } catch (error) {
      setCoreError(error instanceof Error ? error.message : "Could not load admin data");
    } finally {
      setCoreLoading(false);
    }
  }, [menuSearch]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError("");
    try {
      const params = new URLSearchParams({
        page: String(userPage),
        limit: "20",
      });
      if (search.trim()) params.set("search", search.trim());
      if (roleFilter !== "all") params.set("role", roleFilter);
      const data = await apiFetch<{
        success: boolean;
        users: UserDto[];
        pagination: Pagination;
      }>(`/api/users/admin?${params}`);
      setUsers(data.users);
      setUsersPagination(data.pagination);
    } catch (error) {
      setUsersError(error instanceof Error ? error.message : "Could not load users");
    } finally {
      setUsersLoading(false);
    }
  }, [roleFilter, search, userPage]);

  const loadBilling = useCallback(async () => {
    setBillingLoading(true);
    setBillingError("");
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (billingSearch.trim()) params.set("search", billingSearch.trim());
      const data = await apiFetch<{ success: boolean; vendors: UserDto[] }>(
        `/api/users/admin/subscriptions?${params}`,
      );
      setBillingVendors(data.vendors);
    } catch (error) {
      setBillingError(error instanceof Error ? error.message : "Could not load billing data");
    } finally {
      setBillingLoading(false);
    }
  }, [billingSearch]);

  const openBillingHistory = async (vendor: UserDto) => {
    setHistoryLoading(true);
    try {
      const data = await apiFetch<{
        success: boolean;
        vendor: UserDto;
        events: SubscriptionEventDto[];
      }>(`/api/users/admin/subscriptions/${vendor.id}/history`);
      setBillingHistory(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load billing history");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(loadCore);
  }, [loadCore]);

  useEffect(() => {
    void Promise.resolve().then(loadUsers);
  }, [loadUsers]);

  useEffect(() => {
    void Promise.resolve().then(loadBilling);
  }, [loadBilling]);

  const refresh = useCallback(async () => {
    await Promise.all([loadCore(), loadUsers(), loadBilling()]);
  }, [loadBilling, loadCore, loadUsers]);

  const openDecision = (item: MenuItemDto, action: MenuDecision["action"]) => {
    setDecision({ item, action });
    setRejectionReason("");
  };

  const submitDecision = async () => {
    if (!decision) return;
    setBusy(true);
    try {
      const restoring = decision.action === "restore";
      const body: Record<string, unknown> = {
        approvalStatus: restoring ? "approved" : "rejected",
        isActive: restoring,
      };
      if (!restoring && rejectionReason.trim()) {
        body.rejectionReason = rejectionReason.trim();
      }
      const response = await apiFetch<{ message?: string }>(
        `/api/menu/admin/${decision.item.id}/approval`,
        { method: "PATCH", body },
      );
      toast.success(response.message ?? (restoring ? "Menu item restored" : "Menu item hidden"));
      setDecision(null);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update menu item");
    } finally {
      setBusy(false);
    }
  };

  const deleteMenuItem = async () => {
    if (!deleteMenuItemTarget) return;
    setBusy(true);
    try {
      const response = await apiFetch<{ message?: string }>(
        `/api/menu/admin/${deleteMenuItemTarget.id}`,
        { method: "DELETE" },
      );
      toast.success(response.message ?? "Menu item deleted");
      setDeleteMenuItemTarget(null);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete menu item");
    } finally {
      setBusy(false);
    }
  };

  const toggleBlock = async () => {
    if (!blockTarget) return;
    setBusy(true);
    try {
      const response = await apiFetch<{ message?: string }>(
        `/api/users/admin/${blockTarget.id}/block`,
        { method: "PATCH", body: { isBlocked: !blockTarget.isBlocked } },
      );
      toast.success(response.message ?? "User updated");
      setBlockTarget(null);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update user");
    } finally {
      setBusy(false);
    }
  };

  const submitRoleChange = async () => {
    if (!roleChange) return;
    if (roleChange.user.role === "admin" || roleChange.user.id === session?.user?.id) {
      setRoleChange(null);
      return;
    }
    setBusy(true);
    try {
      const response = await apiFetch<{ message?: string }>(
        `/api/users/admin/${roleChange.user.id}/role`,
        { method: "PATCH", body: { role: roleChange.role } },
      );
      toast.success(response.message ?? "Role updated");
      setRoleChange(null);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not change role");
    } finally {
      setBusy(false);
    }
  };

  const deleteUser = async () => {
    if (!deleteUserTarget) return;
    if (deleteUserTarget.role === "admin" || deleteUserTarget.id === session?.user?.id) {
      setDeleteUserTarget(null);
      return;
    }
    setBusy(true);
    try {
      const response = await apiFetch<{ message?: string }>(
        `/api/users/admin/${deleteUserTarget.id}`,
        { method: "DELETE" },
      );
      toast.success(response.message ?? "User deleted");
      setDeleteUserTarget(null);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete user");
    } finally {
      setBusy(false);
    }
  };

  const charts = dashboardSummary?.charts;
  const statCards = dashboardSummary
    ? [
        { label: "Total users", value: dashboardSummary.stats.totalUsers ?? 0, icon: UsersRound },
        { label: "Vendors", value: dashboardSummary.stats.totalVendors ?? 0, icon: ShieldCheck },
        { label: "Customers", value: dashboardSummary.stats.totalCustomers ?? 0, icon: UsersRound },
        { label: "Restaurants", value: dashboardSummary.stats.totalRestaurants ?? 0, icon: Store },
        { label: "Menu items", value: dashboardSummary.stats.totalMenuItems ?? 0, icon: Pizza },
        { label: "Pending items", value: dashboardSummary.stats.pendingMenuItems ?? 0, icon: ClipboardList },
        { label: "Orders", value: dashboardSummary.stats.totalOrders, icon: ClipboardList },
        { label: "Transactions", value: dashboardSummary.stats.totalTransactions ?? 0, icon: CreditCard },
      ]
    : [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin control centre"
        title={tab === "overview" ? "Platform overview" : tabLabels[tab]}
        description="Review new listings, moderate users, and keep an eye on every order."
      />

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {TABS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              "rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
              tab === value && "bg-primary/10 text-primary",
            )}
          >
            {tabLabels[value]}
          </button>
        ))}
      </div>

      {coreLoading &&
      tab !== "users" &&
      tab !== "billing" &&
      tab !== "transactions" &&
      tab !== "reviews" &&
      tab !== "profile" ? (
        <DashboardOverviewSkeleton />
      ) : coreError &&
        tab !== "users" &&
        tab !== "billing" &&
        tab !== "transactions" &&
        tab !== "reviews" &&
        tab !== "profile" ? (
        <ErrorState message={coreError} onRetry={() => void loadCore()} />
      ) : tab === "overview" && !dashboardSummary ? (
        <ErrorState message="Your dashboard summary is unavailable." onRetry={() => void loadCore()} />
      ) : tab === "overview" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {statCards.map(({ label, value, icon: Icon }) => (
              <StatCard key={label} label={label} value={value} icon={Icon} />
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <ChartCard
              title="Order activity"
              description="Orders placed across PizzaHub over the last 7 days."
              data={charts?.orderTrend ?? []}
              variant="line"
              emptyMessage="No orders in the last 7 days"
            />
            <ChartCard
              title="Order status"
              description="All platform orders by current status."
              data={charts?.orderStatus ?? []}
              variant="donut"
              emptyMessage="No orders yet"
            />
            <ChartCard
              title="Order value"
              description="Value of orders placed over the last 7 days."
              data={charts?.orderValueTrend ?? []}
              variant="line"
              formatValue={(value) => `$${value.toFixed(2)}`}
              emptyMessage="No order value yet"
            />
            <ChartCard
              title="New accounts"
              description="Registrations over the last 7 days."
              data={charts?.userGrowth ?? []}
              variant="line"
              emptyMessage="No new accounts"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent users</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {summary?.recentUsers.length ? (
                  summary.recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant="outline" className="capitalize">{user.role}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No users yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent orders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {summary?.recentOrders.length ? (
                  summary.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{order.orderNumber}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {order.menuItemSnapshot.name} · {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        ${order.totalPrice.toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No orders yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold">Recent menu items</h2>
            {menuItems.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {menuItems.slice(0, 6).map((item) => (
                  <ModerationCard
                    key={item.id}
                    item={item}
                    onDecide={openDecision}
                    onDelete={setDeleteMenuItemTarget}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No menu items yet"
                description="Pizzas published by vendors will appear here."
              />
            )}
          </div>
        </div>
      ) : tab === "menu" ? (
        <div className="space-y-5">
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              setMenuSearch(menuSearchInput.trim());
            }}
          >
            <div className="min-w-48 flex-1 space-y-1.5">
              <Label htmlFor="menuSearch">Search menu items</Label>
              <Input
                id="menuSearch"
                placeholder="Name, category, or location"
                value={menuSearchInput}
                onChange={(event) => setMenuSearchInput(event.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
            {menuSearch ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setMenuSearchInput("");
                  setMenuSearch("");
                }}
              >
                Clear
              </Button>
            ) : null}
          </form>

          {menuItems.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {menuItems.map((item) => (
                <ModerationCard
                  key={item.id}
                  item={item}
                  onDecide={openDecision}
                  onDelete={setDeleteMenuItemTarget}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Pizza className="size-5" />}
              title={menuSearch ? "No matching menu items" : "No menu items yet"}
              description={
                menuSearch
                  ? "Try a different name, category, or location."
                  : "Pizzas submitted by vendors will appear here."
              }
            />
          )}
        </div>
      ) : tab === "users" ? (
        <div className="space-y-5">
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(searchInput.trim());
              setUserPage(1);
            }}
          >
            <div className="min-w-48 flex-1 space-y-1.5">
              <Label htmlFor="userSearch">Search users</Label>
              <Input
                id="userSearch"
                placeholder="Name or email"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="roleFilter">Role</Label>
              <Select
                value={roleFilter}
                onValueChange={(value) => {
                  setRoleFilter(value as "all" | UserRole);
                  setUserPage(1);
                }}
              >
                <SelectTrigger id="roleFilter" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="customer">Customers</SelectItem>
                  <SelectItem value="vendor">Vendors</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Search</Button>
          </form>

          {usersLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="mr-2 size-5 animate-spin" /> Loading users...
            </div>
          ) : usersError ? (
            <ErrorState message={usersError} onRetry={() => void loadUsers()} />
          ) : users.length ? (
            <div className="space-y-3">
              {users.map((user) => {
                const isSelf = user.id === session?.user?.id;
                return (
                  <Card key={user.id}>
                    <CardContent className="flex flex-wrap items-center gap-4 py-4">
                      <div className="min-w-40 flex-1">
                        <p className="font-medium">
                          {user.name}
                          {user.isBlocked ? (
                            <Badge variant="destructive" className="ml-2">Blocked</Badge>
                          ) : null}
                        </p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Joined {formatDate(user.createdAt)}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Role</Label>
                        <Select
                          value={user.role}
                          disabled={user.role === "admin" || isSelf || busy}
                          onValueChange={(value) => {
                            const role = value as "customer" | "vendor";
                            if (role !== user.role) setRoleChange({ user, role });
                          }}
                        >
                          <SelectTrigger className="w-32" aria-label={`Role for ${user.name}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Customer</SelectItem>
                            <SelectItem value="vendor">Vendor</SelectItem>
                            {user.role === "admin" ? (
                              <SelectItem value="admin">Admin</SelectItem>
                            ) : null}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant={user.isBlocked ? "outline" : "destructive"}
                        size="sm"
                        disabled={user.role === "admin" || isSelf}
                        onClick={() => setBlockTarget(user)}
                      >
                        {user.isBlocked ? "Unblock" : "Block"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={user.role === "admin" || isSelf || busy}
                        onClick={() => setDeleteUserTarget(user)}
                      >
                        Delete
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No users found" description="Try a different search or role filter." />
          )}

          {usersPagination && usersPagination.pages > 1 ? (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={userPage <= 1}
                onClick={() => setUserPage((page) => Math.max(1, page - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {userPage} of {usersPagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={userPage >= usersPagination.pages}
                onClick={() => setUserPage((page) => page + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </div>
      ) : tab === "billing" ? (
        <div className="space-y-5">
          <PageHeader
            eyebrow="Read-only billing"
            title="Vendor subscriptions"
            description="Billing data is synced from verified Stripe webhooks. Admins cannot change plans here."
          />

          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              setBillingSearch(billingSearchInput.trim());
            }}
          >
            <div className="min-w-48 flex-1 space-y-1.5">
              <Label htmlFor="billingSearch">Search vendors</Label>
              <Input
                id="billingSearch"
                placeholder="Name, email, or business"
                value={billingSearchInput}
                onChange={(event) => setBillingSearchInput(event.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          {billingLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="mr-2 size-5 animate-spin" /> Loading billing data...
            </div>
          ) : billingError ? (
            <ErrorState message={billingError} onRetry={() => void loadBilling()} />
          ) : billingVendors.length ? (
            <div className="space-y-3">
              {billingVendors.map((vendor) => (
                <Card key={vendor.id}>
                  <CardContent className="flex flex-wrap items-start gap-4 py-4">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <CreditCard className="size-5" />
                    </div>
                    <div className="min-w-52 flex-1 space-y-1.5">
                      <p className="font-medium">
                        {vendor.businessName || vendor.name}
                        {vendor.isPremium ? (
                          <Badge className="ml-2 bg-primary text-primary-foreground">Premium</Badge>
                        ) : (
                          <Badge variant="outline" className="ml-2">Free</Badge>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{vendor.email}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Status: <strong>{vendor.subscriptionStatus}</strong></span>
                        {vendor.billingInterval ? (
                          <span>
                            Cycle: <strong>{billingIntervalLabel(vendor.billingInterval)}</strong>
                          </span>
                        ) : null}
                        <span>Expires: {formatOptionalDate(vendor.subscriptionExpiresAt)}</span>
                        {vendor.cancelAtPeriodEnd ? (
                          <span className="text-amber-600 dark:text-amber-400">
                            Cancels {vendor.cancelAt ? formatDate(vendor.cancelAt) : "at period end"}
                          </span>
                        ) : null}
                        {vendor.endedAt ? (
                          <span className="text-destructive">
                            Ended: {formatDate(vendor.endedAt)}
                          </span>
                        ) : null}
                        {vendor.canceledAt ? (
                          <span className="text-destructive">
                            Canceled: {formatDate(vendor.canceledAt)}
                          </span>
                        ) : null}
                      </div>
                      <div className="space-y-0.5 font-mono text-[11px] text-muted-foreground">
                        <p className="break-all">Customer: {vendor.stripeCustomerId ?? "—"}</p>
                        <p className="break-all">Subscription: {vendor.stripeSubscriptionId ?? "—"}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={historyLoading}
                      onClick={() => void openBillingHistory(vendor)}
                    >
                      {historyLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                      History
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState title="No vendors found" description="Try a different search term." />
          )}

          {billingHistory ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Billing history · {billingHistory.vendor.businessName || billingHistory.vendor.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {billingHistory.events.length ? (
                  billingHistory.events.map((event) => (
                    <div
                      key={event.stripeEventId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">{event.description ?? event.type}</p>
                        <p className="font-mono text-xs text-muted-foreground">{event.stripeEventId}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {event.plan ? <Badge variant="secondary">{event.plan}</Badge> : null}
                        {event.billingInterval ? (
                          <Badge variant="outline">{billingIntervalLabel(event.billingInterval)}</Badge>
                        ) : null}
                        {event.status ? <span>{event.status}</span> : null}
                        <span>{formatDate(event.createdAt)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No billing events recorded yet.</p>
                )}
              </CardContent>
            </Card>
          ) : null}

        </div>
      ) : tab === "transactions" ? (
        <AdminTransactionsPanel stats={summary?.stats} />
      ) : tab === "orders" ? (
        orders.length ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} role="admin" />
            ))}
          </div>
        ) : (
          <EmptyState title="No orders yet" description="Customer orders will appear here." />
        )
      ) : tab === "reviews" ? (
        <AdminReviewsPanel />
      ) : (
        <ProfilePanel role="admin" />
      )}

      <Dialog open={decision !== null} onOpenChange={(open) => !open && setDecision(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision?.action === "restore" ? "Restore menu item" : "Hide menu item"}
            </DialogTitle>
            <DialogDescription>
              {decision
                ? decision.action === "restore"
                  ? `“${decision.item.name}” will be visible and orderable again.`
                  : `“${decision.item.name}” will be hidden from customers and unavailable to order.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {decision?.action === "hide" ? (
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Reason (optional)</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                maxLength={300}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="Why is this item being hidden?"
              />
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecision(null)}>Cancel</Button>
            <Button
              variant={decision?.action === "hide" ? "destructive" : "default"}
              disabled={busy}
              onClick={() => void submitDecision()}
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {decision?.action === "restore" ? "Restore" : "Hide"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={blockTarget !== null}
        onOpenChange={(open) => !open && setBlockTarget(null)}
        title={blockTarget?.isBlocked ? "Unblock this user?" : "Block this user?"}
        description={
          blockTarget?.isBlocked
            ? `${blockTarget.name} will be able to sign in and use the platform again.`
            : `${blockTarget?.name ?? "This user"} will be signed out and unable to access the platform.`
        }
        confirmLabel={blockTarget?.isBlocked ? "Unblock user" : "Block user"}
        destructive={!blockTarget?.isBlocked}
        pending={busy}
        onConfirm={() => void toggleBlock()}
      />

      <ConfirmDialog
        open={deleteMenuItemTarget !== null}
        onOpenChange={(open) => !open && setDeleteMenuItemTarget(null)}
        title="Delete menu item?"
        description={
          deleteMenuItemTarget
            ? `“${deleteMenuItemTarget.name}” will be permanently removed. Its favorites will also be removed.`
            : ""
        }
        confirmLabel="Delete item"
        destructive
        pending={busy}
        onConfirm={() => void deleteMenuItem()}
      />

      <ConfirmDialog
        open={deleteUserTarget !== null}
        onOpenChange={(open) => !open && setDeleteUserTarget(null)}
        title="Delete user?"
        description={
          deleteUserTarget
            ? `${deleteUserTarget.name} (${deleteUserTarget.email}) will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete user"
        destructive
        pending={busy}
        onConfirm={() => void deleteUser()}
      />

      <ConfirmDialog
        open={roleChange !== null}
        onOpenChange={(open) => !open && setRoleChange(null)}
        title="Change user role?"
        description={
          roleChange
            ? `Change ${roleChange.user.name}'s role from ${roleChange.user.role} to ${roleChange.role}?`
            : ""
        }
        confirmLabel="Change role"
        pending={busy}
        onConfirm={() => void submitRoleChange()}
      />
    </div>
  );
}

function ModerationCard({
  item,
  onDecide,
  onDelete,
}: {
  item: MenuItemDto;
  onDecide: (item: MenuItemDto, action: MenuDecision["action"]) => void;
  onDelete: (item: MenuItemDto) => void;
}) {
  const isHidden = !item.isActive || item.approvalStatus === "rejected";
  return (
    <Card className="overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.image} alt={item.name} className="aspect-video w-full object-cover" />
      <CardContent className="space-y-3 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold">{item.name}</p>
            <p className="text-xs text-muted-foreground">
              {item.category} · ${item.price.toFixed(2)}
            </p>
            {item.restaurant?.name ? (
              <p className="truncate text-xs text-muted-foreground">{item.restaurant.name}</p>
            ) : null}
          </div>
          <ApprovalBadge status={item.approvalStatus} />
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={isHidden ? "default" : "outline"}
            onClick={() => onDecide(item, isHidden ? "restore" : "hide")}
          >
            {isHidden ? "Restore" : "Hide"}
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(item)}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
