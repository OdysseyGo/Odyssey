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
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import AuthTextInput from '@/components/LoginComponents/AuthTextInput';
import AuthButton from '@/components/LoginComponents/AuthButton';
import AuthLanguageSelector from '@/components/LoginComponents/AuthLanguageSelector';
import AuthLogo from '@/components/LoginComponents/AuthLogo';
import BackButton from '@/components/common/BackButton';
import { requestPasswordReset, resetPassword } from '@/api/users';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT < 700 ? SCREEN_HEIGHT * 0.3 : SCREEN_HEIGHT * 0.36;

export default function ForgotPasswordScreen() {
  const colorScheme = useColorTheme();
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);
  const [code, setCode] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [modalError, setModalError] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

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
    if (!email.trim()) newErrors.email = t('auth.errors.emailRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendCode = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setCodeSent(true);
      setErrors({});
    } catch {
      setErrors({ general: t('auth.errors.somethingWentWrong') });
    } finally {
      setLoading(false);
    }
  };

  const submitNewPassword = async () => {
    if (!code.trim()) {
      setModalError(t('auth.errors.codeRequired'));
      return;
    }
    if (!newPass || !confirmNewPass) {
      setModalError(t('auth.errors.bothFieldsRequired'));
      return;
    }
    if (newPass !== confirmNewPass) {
      setModalError(t('auth.errors.passwordsMismatch'));
      return;
    }
    try {
      await resetPassword({ email: email.trim(), code: code.trim(), new_password: newPass });
      setShowResetModal(false);
      router.replace('/login');
    } catch {
      setModalError(t('auth.errors.invalidCode'));
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
          <BackButton
            color="rgba(255,255,255,0.9)"
            style={[styles.backButton, { top: insets.top + 12 }]}
          />
          <AuthLanguageSelector style={{ top: insets.top + 12 }} />
          <View style={styles.logoArea}>
            <AuthLogo variant="compact" />
            <Text style={styles.appName}>ODYSSEY</Text>
            <Text style={styles.tagline}>{t('auth.resetTagline')}</Text>
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
            <Text style={[styles.cardTitle, { color: theme.text }]}>{t('auth.resetTitle')}</Text>
            <Text style={[styles.cardSubtitle, { color: theme.subText }]}>
              {codeSent ? t('auth.codeSentSubtitle', { email }) : t('auth.resetSubtitle')}
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

            {/* Code-sent success banner */}
            {codeSent && (
              <View
                style={[
                  styles.successBanner,
                  { backgroundColor: `${theme.primary}12`, borderColor: `${theme.primary}35` },
                ]}
              >
                <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                <Text style={[styles.successBannerText, { color: theme.primary }]}>
                  {t('auth.codeSentBanner')}
                </Text>
              </View>
            )}

            <View style={styles.inputs}>
              <AuthTextInput
                label={t('auth.email')}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrors((e) => ({ ...e, email: undefined }));
                }}
                placeholder={t('auth.emailPlaceholder')}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={codeSent ? () => setShowResetModal(true) : handleSendCode}
                error={errors.email}
                editable={!codeSent}
              />
            </View>

            {!codeSent ? (
              <AuthButton title={t('auth.sendCode')} onPress={handleSendCode} loading={loading} />
            ) : (
              <AuthButton
                title={t('auth.enterCode')}
                onPress={() => setShowResetModal(true)}
                loading={false}
              />
            )}

            <View style={styles.footerRow}>
              <Text style={[styles.footerLabel, { color: theme.subText }]}>
                {t('auth.remembered')}
              </Text>
              <TouchableOpacity onPress={() => router.back()} disabled={loading}>
                <Text style={[styles.footerLink, { color: theme.primary }]}>
                  {` ${t('auth.signIn')}`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* ── Reset password modal ── */}
      <Modal visible={showResetModal} transparent animationType="fade">
        <KeyboardAvoidingView
          style={modalStyles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={modalStyles.overlay}>
            <View style={[modalStyles.card, { backgroundColor: theme.cardSurface }]}>
              {/* Header icon */}
              <View style={modalStyles.headerRow}>
                <View style={[modalStyles.iconWrap, { backgroundColor: `${theme.primary}15` }]}>
                  <Ionicons name="lock-closed" size={28} color={theme.primary} />
                </View>
                <TouchableOpacity
                  style={[modalStyles.closeBtn, { backgroundColor: theme.foreground }]}
                  onPress={() => {
                    setShowResetModal(false);
                    setModalError('');
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={18} color={theme.subText} />
                </TouchableOpacity>
              </View>

              <Text style={[modalStyles.title, { color: theme.text }]}>
                {t('auth.resetPassword')}
              </Text>
              <Text style={[modalStyles.subtitle, { color: theme.subText }]}>
                {t('auth.codeSentSubtitle', { email })}
              </Text>

              {/* Error banner */}
              {modalError ? (
                <View
                  style={[
                    modalStyles.errorBanner,
                    { backgroundColor: `${theme.error}12`, borderColor: `${theme.error}30` },
                  ]}
                >
                  <Ionicons name="alert-circle" size={15} color={theme.error} />
                  <Text style={[modalStyles.errorText, { color: theme.error }]}>{modalError}</Text>
                </View>
              ) : null}

              {/* OTP code box */}
              <View
                style={[
                  modalStyles.codeSection,
                  { backgroundColor: theme.primaryMuted, borderColor: `${theme.primary}25` },
                ]}
              >
                <Text style={[modalStyles.codeLabel, { color: theme.primary }]}>
                  {t('auth.otpCode').toUpperCase()}
                </Text>
                <AuthTextInput
                  value={code}
                  onChangeText={(text) => {
                    setCode(text);
                    setModalError('');
                  }}
                  placeholder={t('auth.otpCodePlaceholder')}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  maxLength={6}
                />
              </View>

              {/* Divider */}
              <View style={[modalStyles.dividerRow, { borderColor: theme.borderLight }]}>
                <View style={[modalStyles.dividerLine, { backgroundColor: theme.borderLight }]} />
                <Text style={[modalStyles.dividerText, { color: theme.subText }]}>
                  {t('auth.newPassword').toUpperCase()}
                </Text>
                <View style={[modalStyles.dividerLine, { backgroundColor: theme.borderLight }]} />
              </View>

              <AuthTextInput
                label={t('auth.newPassword')}
                value={newPass}
                onChangeText={setNewPass}
                secureTextEntry
                showPasswordToggle
                placeholder={t('auth.newPasswordPlaceholder')}
              />
              <AuthTextInput
                label={t('auth.confirmPassword')}
                value={confirmNewPass}
                onChangeText={setConfirmNewPass}
                secureTextEntry
                placeholder={t('auth.confirmNewPasswordPlaceholder')}
              />

              <AuthButton title={t('auth.updatePassword')} onPress={submitNewPassword} />
              <TouchableOpacity
                style={[modalStyles.cancelButton, { borderColor: `${theme.subText}30` }]}
                onPress={() => {
                  setShowResetModal(false);
                  setModalError('');
                }}
              >
                <Text style={[modalStyles.cancelText, { color: theme.subText }]}>
                  {t('auth.cancel')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

  // ── Success banner
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Spacing.borderRadius,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  successBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },

  // ── Inputs
  inputs: {
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },

  // ── Footer link
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  footerLabel: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});

const modalStyles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    borderRadius: 28,
    padding: Spacing.xl,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: Spacing.borderRadiusFull,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: -Spacing.xs,
  },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Spacing.borderRadius,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },

  // OTP section
  codeSection: {
    borderRadius: Spacing.borderRadius,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Buttons
  cancelButton: {
    borderWidth: 1,
    borderRadius: Spacing.borderRadius,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
