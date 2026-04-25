import { apiRequest } from './APIClient';

export type SubscriptionPlan = 'MONTHLY' | 'YEARLY';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'PAST_DUE' | 'NONE';

export type PlanInfo = {
  plan: SubscriptionPlan;
  name: string;
  price_display: string;
  interval: string;
  features: string[];
  apple_product_id: string;
};

export type Subscription = {
  id: number;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  apple_product_id: string;
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
  apple_product_id: string;
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

export type IapVerifyResult =
  | { kind: 'subscription'; subscription: Subscription }
  | { kind: 'consumable'; balance: number };

export async function getSubscriptionPlans(): Promise<PlanInfo[]> {
  return apiRequest<PlanInfo[]>({
    method: 'GET',
    url: '/api/payments/plans/',
    auth: false,
  });
}

export async function getSubscription(): Promise<Subscription | { status: 'NONE' }> {
  return apiRequest({
    method: 'GET',
    url: '/api/payments/subscription/',
    auth: true,
  });
}

export async function getManageSubscriptionUrl(): Promise<{ manage_url: string }> {
  return apiRequest<{ manage_url: string }>({
    method: 'GET',
    url: '/api/payments/subscription/manage/',
    auth: true,
  });
}

export async function verifyIapTransaction(jwsSignedTransaction: string): Promise<IapVerifyResult> {
  return apiRequest<IapVerifyResult>({
    method: 'POST',
    url: '/api/payments/iap/verify/',
    data: { jws_signed_transaction: jwsSignedTransaction },
    auth: true,
  });
}

export async function getCreditPacks(): Promise<CreditPack[]> {
  return apiRequest<CreditPack[]>({
    method: 'GET',
    url: '/api/payments/credit-packs/',
    auth: false,
  });
}

export async function getCreditBalance(): Promise<CreditBalance> {
  return apiRequest<CreditBalance>({
    method: 'GET',
    url: '/api/payments/credits/balance/',
    auth: true,
  });
}

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

export async function getAIGenerationAllowance(): Promise<AIGenerationAllowance> {
  return apiRequest<AIGenerationAllowance>({
    method: 'GET',
    url: '/api/payments/ai-allowance/',
    auth: true,
  });
}

export async function getCreatorEarnings(): Promise<CreatorEarnings> {
  return apiRequest<CreatorEarnings>({
    method: 'GET',
    url: '/api/payments/creator/earnings/',
    auth: true,
  });
}
