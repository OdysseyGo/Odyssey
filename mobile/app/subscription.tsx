import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { useColorTheme } from '@/utils/useColorTheme';
import {
  getSubscriptionPlans,
  getSubscription,
  getManageSubscriptionUrl,
  type PlanInfo,
  type Subscription,
  type SubscriptionPlan,
} from '@/api/payments';
import { useIap } from '@/hooks/useIap';

export default function SubscriptionScreen() {
  const colorTheme = useColorTheme() ?? 'light';
  const colors = Colors[colorTheme];

  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('MONTHLY');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [plansData, subData] = await Promise.all([getSubscriptionPlans(), getSubscription()]);
      setPlans(plansData);
      if ('id' in subData) {
        setSubscription(subData as Subscription);
      } else {
        setSubscription(null);
      }
    } catch {
      // User may not be logged in
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const subscriptionSkus = useMemo(() => plans.map((p) => p.apple_product_id), [plans]);

  const { processing, subscribe, restore } = useIap({
    productSkus: [],
    subscriptionSkus,
    onVerified: (result) => {
      if (result.kind === 'subscription') {
        setSubscription(result.subscription);
      }
      fetchData();
    },
    onError: (message) => Alert.alert('Purchase Error', message),
  });

  const handleSubscribe = async () => {
    const plan = plans.find((p) => p.plan === selectedPlan);
    if (!plan) return;
    await subscribe(plan.apple_product_id);
  };

  const handleManage = async () => {
    try {
      const { manage_url } = await getManageSubscriptionUrl();
      await Linking.openURL(manage_url);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to open subscription settings.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isSubscribed =
    subscription && (subscription.status === 'ACTIVE' || subscription.status === 'CANCELED');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Odyssey Premium</Text>
        <Text style={[styles.subtitle, { color: colors.subText }]}>
          Unlock the full adventure experience
        </Text>
      </View>

      {isSubscribed ? (
        <View style={[styles.card, { backgroundColor: colors.foreground }]}>
          <View style={[styles.statusBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.statusText, { color: colors.white }]}>
              {subscription.status === 'CANCELED' ? 'Canceling' : 'Active'}
            </Text>
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Premium {subscription.plan === 'MONTHLY' ? 'Monthly' : 'Yearly'}
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.subText }]}>
            {subscription.cancel_at_period_end
              ? `Access until ${new Date(subscription.current_period_end).toLocaleDateString()}`
              : `Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`}
          </Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleManage}
          >
            <Text style={[styles.buttonText, { color: colors.white }]}>Manage Subscription</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={[styles.planToggle, { backgroundColor: colors.foreground }]}>
            {(['MONTHLY', 'YEARLY'] as SubscriptionPlan[]).map((plan) => (
              <TouchableOpacity
                key={plan}
                style={[
                  styles.planToggleButton,
                  selectedPlan === plan && {
                    backgroundColor: colors.primary,
                  },
                ]}
                onPress={() => setSelectedPlan(plan)}
              >
                <Text
                  style={[
                    styles.planToggleText,
                    {
                      color: selectedPlan === plan ? colors.white : colors.text,
                    },
                  ]}
                >
                  {plan === 'MONTHLY' ? 'Monthly' : 'Yearly'}
                </Text>
                {plan === 'YEARLY' && (
                  <Text
                    style={[
                      styles.saveBadge,
                      {
                        color: selectedPlan === plan ? colors.white : colors.primary,
                      },
                    ]}
                  >
                    Save 33%
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {plans
            .filter((p) => p.plan === selectedPlan)
            .map((plan) => (
              <View key={plan.plan} style={styles.priceSection}>
                <Text style={[styles.price, { color: colors.text }]}>{plan.price_display}</Text>
              </View>
            ))}

          <View style={[styles.featuresCard, { backgroundColor: colors.foreground }]}>
            <Text style={[styles.featuresTitle, { color: colors.text }]}>What&apos;s included</Text>
            {(plans.find((p) => p.plan === selectedPlan)?.features ?? []).map((feature, i) => (
              <View key={i} style={styles.featureRow}>
                <Text style={[styles.featureCheck, { color: colors.primary }]}>{'\u2713'}</Text>
                <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.subscribeButton, { backgroundColor: colors.primary }]}
            onPress={handleSubscribe}
            disabled={processing}
          >
            <Text style={[styles.subscribeButtonText, { color: colors.white }]}>
              {processing ? 'Processing...' : 'Subscribe Now'}
            </Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={styles.linkButton} onPress={restore} disabled={processing}>
        <Text style={[styles.linkText, { color: colors.primary }]}>Restore Purchases</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/credit-store')}>
        <Text style={[styles.linkText, { color: colors.primary }]}>
          Or purchase credits individually
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl * 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: Spacing.xl, backgroundColor: 'transparent' },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 16, marginTop: Spacing.xs },
  card: {
    borderRadius: Spacing.borderRadius,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  cardTitle: { fontSize: 20, fontWeight: '700', marginBottom: Spacing.xs },
  cardSubtitle: { fontSize: 14, marginBottom: Spacing.lg },
  button: {
    paddingVertical: Spacing.md,
    borderRadius: Spacing.sm,
    alignItems: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
  planToggle: {
    flexDirection: 'row',
    borderRadius: Spacing.borderRadius,
    padding: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  planToggleButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.md,
    alignItems: 'center',
  },
  planToggleText: { fontSize: 16, fontWeight: '600' },
  saveBadge: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  priceSection: { alignItems: 'center', marginBottom: Spacing.lg, backgroundColor: 'transparent' },
  price: { fontSize: 36, fontWeight: '800' },
  featuresCard: {
    borderRadius: Spacing.borderRadius,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  featuresTitle: { fontSize: 18, fontWeight: '700', marginBottom: Spacing.lg },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  featureCheck: { fontSize: 18, fontWeight: '700', marginRight: Spacing.md },
  featureText: { fontSize: 15, flex: 1 },
  subscribeButton: {
    paddingVertical: Spacing.lg,
    borderRadius: Spacing.borderRadius,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  subscribeButtonText: { fontSize: 18, fontWeight: '700' },
  linkButton: { alignItems: 'center', paddingVertical: Spacing.md },
  linkText: { fontSize: 14, fontWeight: '600' },
});
