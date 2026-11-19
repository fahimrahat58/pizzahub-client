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
  billingInterval?: BillingInterval | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeCheckoutSessionId?: string | null;
  stripePriceId?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  subscriptionExpiresAt: string | null;
  cancelAt?: string | null;
  cancelAtPeriodEnd: boolean;
  endedAt?: string | null;
  canceledAt?: string | null;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BillingPlan = "monthly" | "yearly";
export type BillingInterval = "month" | "year";

export interface SubscriptionStatusDto {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  isPremium: boolean;
  activeItemLimit: number | null;
  activeRestaurantLimit: number | null;
  billingPlanId: BillingPlan | null;
  /** Purchased cycle, preferring Stripe's live Price interval. */
  billingInterval: BillingInterval | null;
  /** Raw recurring.interval from the authenticated vendor's Stripe Price. */
  stripeRecurringInterval: BillingInterval | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeCheckoutSessionId: string | null;
  stripePriceId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  subscriptionExpiresAt: string | null;
  cancelAt: string | null;
  cancelAtPeriodEnd: boolean;
  endedAt: string | null;
  canceledAt: string | null;
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
  billingInterval?: BillingInterval | null;
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
  isAvailable: boolean;
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
  /** Server-computed 5/4/3/2/1-star totals, never supplied by the client. */
  ratingDistribution: RatingDistribution;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantDto {
  id: string;
  vendorId: string;
  /** Derived from the vendor's verified subscription state, never client input. */
  vendorPremium: boolean;
  name: string;
  description: string;
  image: string;
  address: string;
  phone: string;
  openingHours: string | null;
  isAvailable: boolean;
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

export type RatingDistribution = Record<"1" | "2" | "3" | "4" | "5", number>;

export interface ReviewDto {
  id: string;
  /** Only present in authenticated/private admin and owner views. */
  customerId?: string;
  /** Snapshot taken from the authenticated user when the review was created. */
  customerName?: string | null;
  menuItemId: string | null;
  restaurantId: string | null;
  orderId: string;
  rating: number;
  comment: string;
  authorName?: string | null;
  authorImage?: string | null;
  /** Only present in admin/vendor moderation views. */
  isHidden?: boolean;
  customerEmail?: string | null;
  productName?: string | null;
  restaurantName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummary {
  ratingAvg: number;
  reviewCount: number;
  ratingDistribution: RatingDistribution;
}

export interface ReviewListResponse {
  success: boolean;
  reviews: ReviewDto[];
  summary?: ReviewSummary;
  pagination: Pagination;
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

export interface DashboardMetricPoint {
  label: string;
  value: number;
}

/** Role-scoped aggregates computed by the server from authenticated data. */
export interface DashboardSummary {
  role: UserRole;
  stats: {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    favorites?: number;
    totalRestaurants?: number;
    activeMenuItems?: number;
    pendingMenuItems?: number;
    plan?: SubscriptionPlan;
    isPremium?: boolean;
    totalUsers?: number;
    totalVendors?: number;
    totalCustomers?: number;
    totalMenuItems?: number;
    totalTransactions?: number;
  };
  charts: {
    orderTrend: DashboardMetricPoint[];
    orderStatus: DashboardMetricPoint[];
    orderValueTrend?: DashboardMetricPoint[];
    userGrowth?: DashboardMetricPoint[];
  };
}

export interface DashboardSummaryResponse {
  success: boolean;
  summary: DashboardSummary;
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
  billingInterval?: BillingInterval | null;
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

export interface TasteScoreEntry {
  name: string;
  score: number;
  signals: number;
}

export interface TasteBudgetRange {
  min: number | null;
  max: number | null;
  label: string;
  sampleSize: number;
}

export interface TasteProfileDto {
  topCategories: TasteScoreEntry[];
  favoriteIngredients: TasteScoreEntry[];
  budgetRange: TasteBudgetRange;
  totalSignals: number;
  summary: string;
  status: "empty" | "developing" | "ready";
}

export interface TasteRecommendationDto {
  item: MenuItemDto;
  matchScore: number;
  reasons: string[];
}

export interface TasteDnaResponse {
  success: boolean;
  profile: TasteProfileDto;
  recommendations: TasteRecommendationDto[];
}
