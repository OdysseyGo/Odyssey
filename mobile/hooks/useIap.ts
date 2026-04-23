import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  endConnection,
  finishTransaction,
  getAvailablePurchases,
  getProducts,
  getSubscriptions,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type Product,
  type ProductPurchase,
  type Subscription as IapSubscription,
  type SubscriptionPurchase,
} from 'expo-iap';

import { verifyIapTransaction, type IapVerifyResult } from '@/api/payments';

type Purchase = ProductPurchase | SubscriptionPurchase;

export type UseIapOptions = {
  productSkus: string[];
  subscriptionSkus: string[];
  onVerified?: (result: IapVerifyResult, purchase: Purchase) => void;
  onError?: (message: string) => void;
};

function extractJws(purchase: Purchase): string | null {
  const anyPurchase = purchase as unknown as {
    jwsRepresentationIos?: string;
    transactionReceipt?: string;
  };
  return anyPurchase.jwsRepresentationIos ?? anyPurchase.transactionReceipt ?? null;
}

export function useIap(options: UseIapOptions) {
  const { productSkus, subscriptionSkus, onVerified, onError } = options;
  const [connected, setConnected] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [subscriptions, setSubscriptions] = useState<IapSubscription[]>([]);
  const [processing, setProcessing] = useState(false);
  const onVerifiedRef = useRef(onVerified);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onVerifiedRef.current = onVerified;
    onErrorRef.current = onError;
  }, [onVerified, onError]);

  useEffect(() => {
    let mounted = true;
    let updateSub: { remove: () => void } | null = null;
    let errorSub: { remove: () => void } | null = null;

    (async () => {
      try {
        await initConnection();
        if (!mounted) return;
        setConnected(true);

        if (productSkus.length > 0) {
          const fetched = await getProducts(productSkus);
          if (mounted) setProducts(fetched);
        }
        if (subscriptionSkus.length > 0) {
          const fetchedSubs = await getSubscriptions(subscriptionSkus);
          if (mounted) setSubscriptions(fetchedSubs);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to connect to the store.';
        onErrorRef.current?.(message);
      }

      updateSub = purchaseUpdatedListener(async (purchase: Purchase) => {
        const jws = extractJws(purchase);
        if (!jws) {
          onErrorRef.current?.('Missing transaction receipt.');
          return;
        }
        try {
          const result = await verifyIapTransaction(jws);
          await finishTransaction({ purchase, isConsumable: 'quantity' in purchase });
          onVerifiedRef.current?.(result, purchase);
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Failed to verify purchase.';
          onErrorRef.current?.(message);
        } finally {
          setProcessing(false);
        }
      });

      errorSub = purchaseErrorListener((error: { code?: string; message?: string }) => {
        setProcessing(false);
        if (error.code !== 'E_USER_CANCELLED') {
          onErrorRef.current?.(error.message ?? 'Purchase failed.');
        }
      });
    })();

    return () => {
      mounted = false;
      updateSub?.remove();
      errorSub?.remove();
      endConnection().catch(() => {});
    };
  }, [productSkus, subscriptionSkus]);

  const buy = useCallback(async (sku: string) => {
    if (Platform.OS !== 'ios') {
      onErrorRef.current?.('In-app purchases are only supported on iOS.');
      return;
    }
    try {
      setProcessing(true);
      await requestPurchase({ request: { ios: { sku } }, type: 'inapp' });
    } catch (e) {
      setProcessing(false);
      const message = e instanceof Error ? e.message : 'Failed to start purchase.';
      onErrorRef.current?.(message);
    }
  }, []);

  const subscribe = useCallback(async (sku: string) => {
    if (Platform.OS !== 'ios') {
      onErrorRef.current?.('Subscriptions are only supported on iOS.');
      return;
    }
    try {
      setProcessing(true);
      await requestPurchase({ request: { ios: { sku } }, type: 'subs' });
    } catch (e) {
      setProcessing(false);
      const message = e instanceof Error ? e.message : 'Failed to start subscription.';
      onErrorRef.current?.(message);
    }
  }, []);

  const restore = useCallback(async () => {
    try {
      setProcessing(true);
      const purchases = await getAvailablePurchases();
      for (const purchase of purchases) {
        const jws = extractJws(purchase as Purchase);
        if (!jws) continue;
        try {
          const result = await verifyIapTransaction(jws);
          onVerifiedRef.current?.(result, purchase as Purchase);
        } catch {
          // skip individual failures; continue restoring
        }
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to restore purchases.';
      onErrorRef.current?.(message);
    } finally {
      setProcessing(false);
    }
  }, []);

  return {
    connected,
    products,
    subscriptions,
    processing,
    buy,
    subscribe,
    restore,
  };
}
