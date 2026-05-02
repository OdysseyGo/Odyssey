import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Dimensions,
  BackHandler,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AuthButton from '@/components/LoginComponents/AuthButton';
import AuthLanguageSelector from '@/components/LoginComponents/AuthLanguageSelector';
import AuthLogo from '@/components/LoginComponents/AuthLogo';
import { acceptTermsUpdate } from '@/api/users';
import { logout } from '@/api/auth';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT < 700 ? SCREEN_HEIGHT * 0.28 : SCREEN_HEIGHT * 0.32;

export default function TermsUpdateScreen() {
  const colorScheme = useColorTheme();
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [agreed, setAgreed] = useState(false);
  const [agreedError, setAgreedError] = useState(false);
  const [loading, setLoading] = useState(false);
  const isNavigatingAway = useRef(false);

  // Entrance animations
  const heroY = useRef(new Animated.Value(-24)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(48)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroY, { toValue: 0, duration: 560, useNativeDriver: true }),
      Animated.timing(heroOpacity, { toValue: 1, duration: 560, useNativeDriver: true }),
      Animated.timing(cardY, { toValue: 0, duration: 620, delay: 160, useNativeDriver: true }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 620,
        delay: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Block back navigation — user must accept or log out
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (isNavigatingAway.current) return;
      e.preventDefault();
    });
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => {
      unsubscribe();
      backHandler.remove();
    };
  }, [navigation]);

  const handleAccept = async () => {
    if (!agreed) {
      setAgreedError(true);
      return;
    }
    setLoading(true);
    try {
      await acceptTermsUpdate();
      isNavigatingAway.current = true;
      router.dismissTo('/(tabs)/profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    isNavigatingAway.current = true;
    await logout();
    router.replace('/(tabs)/map');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={{ backgroundColor: theme.headerGradientTop }}
        automaticallyAdjustContentInsets={false}
        automaticallyAdjustKeyboardInsets={false}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        {/* ── Hero ─────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.hero,
            {
              height: HERO_HEIGHT + insets.top,
              paddingTop: insets.top + Spacing.lg,
              backgroundColor: theme.headerGradientTop,
            },
            { opacity: heroOpacity, transform: [{ translateY: heroY }] },
          ]}
        >
          <AuthLanguageSelector style={{ top: insets.top + 12 }} />
          <View style={styles.logoArea}>
            <AuthLogo variant="compact" />
            <Text style={styles.appName}>ODYSSEY</Text>
          </View>
        </Animated.View>

        {/* ── Card ─────────────────────────────────────── */}
        <Animated.View
          style={[styles.flex, { opacity: cardOpacity, transform: [{ translateY: cardY }] }]}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.background,
                paddingBottom: insets.bottom + Spacing.xxl,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              {t('auth.termsUpdateTitle')}
            </Text>
            <Text style={[styles.cardSubtitle, { color: theme.subText }]}>
              {t('auth.termsUpdateSubtitle')}
            </Text>

            {/* Checkbox */}
            <View style={styles.checkboxRow}>
              <TouchableOpacity
                onPress={() => {
                  setAgreed((v) => !v);
                  setAgreedError(false);
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={agreed ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={agreedError ? theme.error : agreed ? theme.primary : theme.subText}
                />
              </TouchableOpacity>
              <Text style={[styles.checkboxLabel, { color: theme.subText }]}>
                {t('auth.termsUpdatePrefix')}{' '}
                <Text
                  style={[styles.checkboxLink, { color: theme.primary }]}
                  onPress={() => Linking.openURL('https://odysseygo.github.io/Odyssey/legal')}
                >
                  {t('auth.terms')}
                </Text>{' '}
                {t('auth.termsUpdateAnd')}{' '}
                <Text
                  style={[styles.checkboxLink, { color: theme.primary }]}
                  onPress={() => Linking.openURL('https://odysseygo.github.io/Odyssey/legal')}
                >
                  {t('auth.privacy')}
                </Text>
              </Text>
            </View>
            {agreedError && (
              <Text style={[styles.checkboxError, { color: theme.error }]}>
                {t('auth.errors.termsRequired')}
              </Text>
            )}

            <View style={styles.actions}>
              <AuthButton
                title={t('auth.termsUpdateAccept')}
                onPress={handleAccept}
                loading={loading}
              />
              <TouchableOpacity style={styles.logoutRow} onPress={handleLogout} disabled={loading}>
                <Text style={[styles.logoutText, { color: theme.subText }]}>
                  {t('auth.termsUpdateLogout')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  hero: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: Spacing.xl,
  },
  logoArea: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 5,
  },

  card: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    flexGrow: 1,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  checkboxLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  checkboxError: {
    fontSize: 12,
    marginBottom: Spacing.sm,
    marginLeft: 30,
  },

  actions: {
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  logoutRow: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
