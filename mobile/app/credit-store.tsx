import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { useColorTheme } from '@/utils/useColorTheme';
import {
  getCreditPacks,
  getCreditBalance,
  purchaseCredits,
  type CreditPack,
  type Transaction,
} from '@/api/payments';

export default function CreditStoreScreen() {
  const colorTheme = useColorTheme() ?? 'light';
  const colors = Colors[colorTheme];

  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [packsData, balanceData] = await Promise.all([getCreditPacks(), getCreditBalance()]);
      setPacks(packsData);
      setBalance(balanceData.balance);
      setTransactions(balanceData.recent_transactions);
    } catch {
      // User may not be logged in
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePurchase = async (pack: CreditPack) => {
    try {
      setPurchaseLoading(pack.id);
      const redirectUrl = Linking.createURL('credit-store');
      const { checkout_url } = await purchaseCredits(pack.id, redirectUrl);
      await WebBrowser.openAuthSessionAsync(checkout_url, redirectUrl);
      await fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start purchase.');
    } finally {
      setPurchaseLoading(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Balance Card */}
      <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
        <Text style={[styles.balanceLabel, { color: colors.white }]}>Your Credits</Text>
        <Text style={[styles.balanceAmount, { color: colors.white }]}>{balance}</Text>
      </View>

      {/* Credit Packs */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Buy Credits</Text>

      {packs.map((pack) => (
        <TouchableOpacity
          key={pack.id}
          style={[styles.packCard, { backgroundColor: colors.foreground }]}
          onPress={() => handlePurchase(pack)}
          disabled={purchaseLoading !== null}
        >
          <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <Text style={[styles.packName, { color: colors.text }]}>{pack.name}</Text>
            <Text style={[styles.packCredits, { color: colors.subText }]}>
              {pack.credits} credits
            </Text>
          </View>
          <View style={[styles.priceTag, { backgroundColor: colors.primary }]}>
            {purchaseLoading === pack.id ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={[styles.priceText, { color: colors.white }]}>{pack.price_display}</Text>
            )}
          </View>
        </TouchableOpacity>
      ))}

      {/* Transaction History */}
      {transactions.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.xl }]}>
            Recent Transactions
          </Text>
          {transactions.map((tx) => (
            <View
              key={tx.id}
              style={[styles.transactionRow, { borderBottomColor: colors.foreground }]}
            >
              <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                <Text style={[styles.txDescription, { color: colors.text }]}>{tx.description}</Text>
                <Text style={[styles.txDate, { color: colors.subText }]}>
                  {new Date(tx.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text
                style={[styles.txAmount, { color: tx.amount >= 0 ? '#2ECC71' : colors.primary }]}
              >
                {tx.amount >= 0 ? '+' : ''}
                {tx.amount}
              </Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl * 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  balanceCard: {
    borderRadius: Spacing.borderRadius,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  balanceLabel: { fontSize: 14, fontWeight: '600', marginBottom: Spacing.xs },
  balanceAmount: { fontSize: 48, fontWeight: '800' },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: Spacing.md },
  packCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.borderRadius,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  packName: { fontSize: 16, fontWeight: '700' },
  packCredits: { fontSize: 13, marginTop: 2 },
  priceTag: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.sm,
    minWidth: 70,
    alignItems: 'center',
  },
  priceText: { fontSize: 16, fontWeight: '700' },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
  },
  txDescription: { fontSize: 14, fontWeight: '500' },
  txDate: { fontSize: 12, marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: '700' },
});
