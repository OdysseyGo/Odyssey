import { apiRequest } from './APIClient';

// Types

export type SubscriptionPlan = 'MONTHLY' | 'YEARLY';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'PAST_DUE' | 'NONE';

export type PlanInfo = {
  plan: SubscriptionPlan;
  name: string;
  price_display: string;
  interval: string;
  features: string[];
};

export type Subscription = {
  id: number;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
};

export type CreditPack = {
  id: number;
  name: string;
  credits: number;
  price_cents: number;
  currency: string;
  price_display: string;
};

export type Transaction = {
  id: number;
  transaction_type: string;
  amount: number;
  balance_after: number;
  description: string;
  tour_title: string | null;
  created_at: string;
};

export type CreditBalance = {
  balance: number;
  recent_transactions: Transaction[];
};

export type TourAccess = {
  has_access: boolean;
  is_premium: boolean;
  credit_price: number;
  user_is_subscriber: boolean;
  already_purchased: boolean;
};

export type AIGenerationAllowance = {
  used: number;
  limit: number;
  unlimited: boolean;
};

export type CreatorEarnings = {
  total_earnings: number;
  total_tour_sales: number;
  recent_earnings: Transaction[];
};

// Subscription

export async function getSubscriptionPlans(): Promise<PlanInfo[]> {
  return apiRequest<PlanInfo[]>({
    method: 'GET',
    url: '/api/payments/plans/',
    auth: false,
  });
}

export async function createSubscriptionCheckout(
  plan: SubscriptionPlan,
  redirectUrl?: string
): Promise<{ checkout_url: string }> {
  return apiRequest<{ checkout_url: string }>({
    method: 'POST',
    url: '/api/payments/subscribe/',
    data: { plan, success_url: redirectUrl, cancel_url: redirectUrl },
    auth: true,
  });
}

export async function getSubscription(): Promise<Subscription | { status: 'NONE' }> {
  return apiRequest({
    method: 'GET',
    url: '/api/payments/subscription/',
    auth: true,
  });
}

export async function cancelSubscription(): Promise<Subscription> {
  return apiRequest<Subscription>({
    method: 'POST',
    url: '/api/payments/subscription/cancel/',
    auth: true,
  });
}

export async function reactivateSubscription(): Promise<Subscription> {
  return apiRequest<Subscription>({
    method: 'POST',
    url: '/api/payments/subscription/reactivate/',
    auth: true,
  });
}

// Credits

export async function getCreditPacks(): Promise<CreditPack[]> {
  return apiRequest<CreditPack[]>({
    method: 'GET',
    url: '/api/payments/credit-packs/',
    auth: false,
  });
}

export async function purchaseCredits(
  packId: number,
  redirectUrl?: string
): Promise<{ checkout_url: string }> {
  return apiRequest<{ checkout_url: string }>({
    method: 'POST',
    url: '/api/payments/credits/purchase/',
    data: { pack_id: packId, success_url: redirectUrl, cancel_url: redirectUrl },
    auth: true,
  });
}

export async function getCreditBalance(): Promise<CreditBalance> {
  return apiRequest<CreditBalance>({
    method: 'GET',
    url: '/api/payments/credits/balance/',
    auth: true,
  });
}

// Tour Access

export async function unlockTour(tourId: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>({
    method: 'POST',
    url: `/api/payments/tours/${tourId}/unlock/`,
    auth: true,
  });
}

export async function checkTourAccess(tourId: number): Promise<TourAccess> {
  return apiRequest<TourAccess>({
    method: 'GET',
    url: `/api/payments/tours/${tourId}/access/`,
    auth: true,
  });
}

// AI Generation

export async function getAIGenerationAllowance(): Promise<AIGenerationAllowance> {
  return apiRequest<AIGenerationAllowance>({
    method: 'GET',
    url: '/api/payments/ai-allowance/',
    auth: true,
  });
}

// Creator

export async function getCreatorEarnings(): Promise<CreatorEarnings> {
  return apiRequest<CreatorEarnings>({
    method: 'GET',
    url: '/api/payments/creator/earnings/',
    auth: true,
  });
}
