import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  KeyboardAvoidingView,
  Keyboard,
  ScrollView,
  Platform,
  Dimensions,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { useTranslation } from 'react-i18next';
import * as Notifications from 'expo-notifications';

import AuthTextInput from '@/components/LoginComponents/AuthTextInput';
import AuthButton from '@/components/LoginComponents/AuthButton';
import AuthLanguageSelector from '@/components/LoginComponents/AuthLanguageSelector';
import AuthLogo from '@/components/LoginComponents/AuthLogo';
import BackButton from '@/components/common/BackButton';
import { login, UserCredentials, registerDeviceToken } from '@/api/users';
import { setProfileNeedsRefresh } from '@/lib/profileRefresh';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { isUsernameValid, sanitizeUsernameInput } from '@/utils/inputSanitizers';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT < 700 ? SCREEN_HEIGHT * 0.3 : SCREEN_HEIGHT * 0.36;
const AUTH_INPUT_MAX_LENGTH = 50;

export default function LoginScreen() {
  const colorScheme = useColorTheme();
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ username?: string; password?: string; general?: string }>(
    {}
  );
  const [loading, setLoading] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const passwordRef = useRef<TextInput>(null);

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

  const resetScrollPosition = useCallback(() => {
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      resetScrollPosition();
      const keyboardHideSubscription = Keyboard.addListener('keyboardDidHide', resetScrollPosition);

      return () => keyboardHideSubscription.remove();
    }, [resetScrollPosition])
  );

  const validate = () => {
    const newErrors: typeof errors = {};
    const normalizedUsername = username.trim();
    if (!normalizedUsername) newErrors.username = t('auth.errors.usernameRequired');
    else if (!isUsernameValid(normalizedUsername))
      newErrors.username = t('auth.errors.usernameInvalidCharacters');
    if (!password.trim()) newErrors.password = t('auth.errors.passwordRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const credentials: UserCredentials = { username: username.trim(), password };
      const response = await login(credentials);
      SecureStore.setItem('userToken', response.access);
      SecureStore.setItem('refreshToken', response.refresh);

      setProfileNeedsRefresh();
      if (response.terms_update_required) {
        router.dismissTo('/terms-update');
      } else {
        router.dismissTo('/(tabs)/profile');
      }
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus === 'granted') {
          const tokenData = await Notifications.getDevicePushTokenAsync();
          const token = tokenData.data;
          await registerDeviceToken({
            device_token: token,
            platform: Platform.OS === 'ios' ? 'ios' : 'android',
          });
          await SecureStore.setItemAsync('devicePushToken', token);
        }
      } catch (pushError) {
        console.warn('Push token registration failed:', pushError);
      }
      router.replace('/(tabs)/profile');
    } catch (e) {
      console.error(e);
      setErrors({ general: t('auth.errors.loginFailed') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        style={{ backgroundColor: theme.headerGradientTop }}
        automaticallyAdjustContentInsets={false}
        automaticallyAdjustKeyboardInsets={false}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
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
          {/* Back button */}
          <BackButton
            color="rgba(255,255,255,0.9)"
            style={[styles.backButton, { top: insets.top + 12 }]}
          />
          <AuthLanguageSelector style={{ top: insets.top + 12 }} />

          {/* Branding */}
          <View style={styles.logoArea}>
            <AuthLogo variant="compact" />
            <Text style={styles.appName}>ODYSSEY</Text>
            <Text style={styles.tagline}>{t('auth.tagline')}</Text>
          </View>
        </Animated.View>

        {/* ── Form card ────────────────────────────────── */}
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
            <Text style={[styles.cardTitle, { color: theme.text }]}>{t('auth.welcomeBack')}</Text>
            <Text style={[styles.cardSubtitle, { color: theme.subText }]}>
              {t('auth.welcomeSubtitle')}
            </Text>

            {/* Error banner */}
            {errors.general && (
              <View
                style={[
                  styles.errorBanner,
                  { backgroundColor: `${theme.error}12`, borderColor: `${theme.error}35` },
                ]}
              >
                <Ionicons name="alert-circle" size={16} color={theme.error} />
                <Text style={[styles.errorBannerText, { color: theme.error }]}>
                  {errors.general}
                </Text>
                <TouchableOpacity
                  onPress={() => setErrors((e) => ({ ...e, general: undefined }))}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={16} color={theme.error} />
                </TouchableOpacity>
              </View>
            )}

            {/* Fields */}
            <View style={styles.inputs}>
              <AuthTextInput
                label={t('auth.username')}
                value={username}
                onChangeText={(text) => {
                  setUsername(sanitizeUsernameInput(text));
                  setErrors((e) => ({ ...e, username: undefined, general: undefined }));
                }}
                placeholder={t('auth.usernamePlaceholder')}
                autoCapitalize="none"
                maxLength={AUTH_INPUT_MAX_LENGTH}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                error={errors.username}
              />
              <AuthTextInput
                ref={passwordRef}
                label={t('auth.password')}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrors((e) => ({ ...e, password: undefined }));
                }}
                placeholder={t('auth.passwordPlaceholder')}
                secureTextEntry
                showPasswordToggle
                autoCapitalize="none"
                maxLength={AUTH_INPUT_MAX_LENGTH}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                error={errors.password}
              />
            </View>

            {/* Forgot password — right-aligned link */}
            <TouchableOpacity
              style={styles.forgotRow}
              onPress={() => router.push('/forgot-password')}
              disabled={loading}
            >
              <Text style={[styles.forgotText, { color: theme.primary }]}>
                {t('auth.forgotPassword')}
              </Text>
            </TouchableOpacity>

            <AuthButton title={t('auth.login')} onPress={handleLogin} loading={loading} />

            {/* Register inline link */}
            <View style={styles.registerRow}>
              <Text style={[styles.registerLabel, { color: theme.subText }]}>
                {t('auth.noAccountLabel')}
              </Text>
              <TouchableOpacity onPress={() => router.push('/register')} disabled={loading}>
                <Text style={[styles.registerLink, { color: theme.primary }]}>
                  {` ${t('auth.signUp')}`}
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

  // ── Hero
  hero: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: Spacing.xxl + 4,
  },
  backButton: {
    position: 'absolute',
    left: Spacing.lg,
  },
  logoArea: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 5,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.70)',
    letterSpacing: 0.3,
    marginTop: 2,
  },

  // ── Card
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

  // ── Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Spacing.borderRadius,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },

  // ── Inputs
  inputs: {
    gap: Spacing.xs,
  },

  // ── Forgot password
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Register link
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  registerLabel: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
