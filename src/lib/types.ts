export type UserRole = "customer" | "vendor" | "admin";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type SubscriptionPlan = "free" | "premium";
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "canceled"
  | "paused"
  | "none";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "rejected";

export interface UserDto {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole;
  isBlocked: boolean;
  businessName: string | null;
  phone: string | null;
  address: string | null;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  billingPlanId?: BillingPlan | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeCheckoutSessionId?: string | null;
  stripePriceId?: string | null;
  subscriptionExpiresAt: string | null;
  cancelAtPeriodEnd: boolean;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BillingPlan = "monthly" | "yearly";

export interface SubscriptionStatusDto {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  isPremium: boolean;
  activeItemLimit: number | null;
  activeRestaurantLimit: number | null;
  billingPlanId: BillingPlan | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeCheckoutSessionId: string | null;
  stripePriceId: string | null;
  subscriptionExpiresAt: string | null;
  cancelAtPeriodEnd: boolean;
  hasBillingAccount: boolean;
}

export interface PlanPrice {
  id: "free" | BillingPlan;
  name: string;
  interval: "month" | "year" | null;
  amount: number | null;
  currency: string;
}

export interface PlansResponse {
  success: boolean;
  configured: boolean;
  issue: string | null;
  plans: PlanPrice[];
}

export interface SubscriptionEventDto {
  id: string;
  vendorId: string;
  stripeEventId: string;
  type: string;
  plan: SubscriptionPlan | null;
  status: SubscriptionStatus | null;
  description: string | null;
  createdAt: string;
}

export interface RestaurantSummaryDto {
  id: string;
  name: string;
  address: string;
  image: string | null;
  openingHours: string | null;
}

export interface MenuItemDto {
  id: string;
  vendorId: string;
  restaurantId: string | null;
  restaurant: RestaurantSummaryDto | null;
  vendorName: string | null;
  name: string;
  description: string;
  category: string;
  price: number;
  ingredients: string[];
  location: string;
  image: string;
  /** Cover photo first, then any extra photos. */
  images: string[];
  isActive: boolean;
  approvalStatus: ApprovalStatus;
  isFeatured: boolean;
  vendorPremium: boolean;
  rejectionReason: string | null;
  ratingAvg: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantDto {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  image: string;
  address: string;
  phone: string;
  openingHours: string | null;
  ratingAvg: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEntry {
  status: OrderStatus;
  note?: string;
  at: string;
  by: "customer" | "vendor" | "system";
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  customerId: string;
  vendorId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  deliveryAddress: string;
  deliveryDate: string;
  message: string | null;
  status: OrderStatus;
  timeline: TimelineEntry[];
  customerSnapshot: { name: string; email: string; image?: string | null };
  menuItemSnapshot: {
    name: string;
    image: string;
    price: number;
    restaurantName?: string | null;
  };
  restaurantName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewDto {
  id: string;
  customerId: string;
  menuItemId: string | null;
  restaurantId: string | null;
  orderId: string;
  rating: number;
  comment: string;
  authorName?: string;
  authorImage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ListResponse<T> {
  success: boolean;
  items: T[];
  pagination: Pagination;
}

export interface AdminStats {
  totalUsers: number;
  totalCustomers: number;
  totalVendors: number;
  totalMenuItems: number;
  pendingMenuItems: number;
  hiddenMenuItems: number;
  approvedMenuItems: number;
  totalOrders: number;
  totalTransactions: number;
}

export interface TransactionDto {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  plan: SubscriptionPlan;
  amount: number;
  currency: string;
  status: SubscriptionStatus;
  stripeEventId: string;
  stripeSubscriptionId: string | null;
  description: string | null;
  createdAt: string;
}

export interface AdminDashboardResponse {
  success: boolean;
  stats: AdminStats;
  recentUsers: UserDto[];
  recentOrders: OrderDto[];
  recentMenuItems: MenuItemDto[];
}
