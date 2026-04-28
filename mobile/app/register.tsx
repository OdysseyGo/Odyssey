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
  BackHandler,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import AuthTextInput from '@/components/LoginComponents/AuthTextInput';
import AuthButton from '@/components/LoginComponents/AuthButton';
import AuthLogo from '@/components/LoginComponents/AuthLogo';
import BackButton from '@/components/common/BackButton';
import { createUser, CreateUserPayload } from '@/api/users';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT < 700 ? SCREEN_HEIGHT * 0.28 : SCREEN_HEIGHT * 0.32;
const AUTH_INPUT_MAX_LENGTH = 50;

export default function RegisterScreen() {
  const colorScheme = useColorTheme();
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [step, setStep] = useState<1 | 2>(1);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const isNavigatingAway = useRef(false);
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

  // Intercept back navigation when on step 2
  useEffect(() => {
    if (step !== 2) return;
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (isNavigatingAway.current) return;
      e.preventDefault();
      setStep(1);
    });
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      setStep(1);
      return true;
    });
    return () => {
      unsubscribe();
      backHandler.remove();
    };
  }, [step, navigation]);

  // Field refs
  const lastNameRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const validateStep1 = () => {
    const newErrors: typeof errors = {};
    if (!firstName.trim()) newErrors.firstName = t('auth.errors.firstNameRequired');
    if (!lastName.trim()) newErrors.lastName = t('auth.errors.lastNameRequired');
    if (!username.trim()) newErrors.username = t('auth.errors.usernameRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: typeof errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
    if (!email.trim()) newErrors.email = t('auth.errors.emailRequired');
    else if (!emailRegex.test(email)) newErrors.email = t('auth.errors.emailFormat');
    if (!password) newErrors.password = t('auth.errors.passwordRequired');
    if (!confirmPassword) newErrors.confirmPassword = t('auth.errors.confirmPasswordRequired');
    if (password && confirmPassword && password !== confirmPassword)
      newErrors.confirmPassword = t('auth.errors.passwordsMismatch');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const submitRegistration = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      const user: CreateUserPayload = {
        username,
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      };
      await createUser(user);
      isNavigatingAway.current = true;
      setShowSuccessModal(true);
    } catch (e) {
      console.error(e);
      setErrors({ general: t('auth.errors.registrationFailed') });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateStep2()) return;

    setShowConfirmModal(true);
  };

  return (
    <>
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
                height: HERO_HEIGHT,
                paddingTop: insets.top,
                backgroundColor: theme.headerGradientTop,
              },
              { opacity: heroOpacity, transform: [{ translateY: heroY }] },
            ]}
          >
            <BackButton
              color="rgba(255,255,255,0.9)"
              style={[styles.backButton, { top: insets.top + 12 }]}
            />
            <View style={styles.logoArea}>
              <AuthLogo variant="compact" />
              <Text style={styles.appName}>ODYSSEY</Text>
              <Text style={styles.tagline}>{t('auth.registerTagline')}</Text>
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
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {t('auth.registerTitle')}
              </Text>
              <Text style={[styles.cardSubtitle, { color: theme.subText }]}>
                {t('auth.registerSubtitle')}
              </Text>

              {/* Step indicator */}
              <View style={styles.stepRow}>
                <View style={[styles.stepDot, { backgroundColor: theme.primary }]} />
                <View
                  style={[
                    styles.stepLine,
                    { backgroundColor: step === 2 ? theme.primary : theme.foregroundSecondary },
                  ]}
                />
                <View
                  style={[
                    styles.stepDot,
                    { backgroundColor: step === 2 ? theme.primary : theme.foregroundSecondary },
                  ]}
                />
              </View>

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

              <View style={styles.inputs}>
                {step === 1 ? (
                  <>
                    <AuthTextInput
                      label={t('auth.firstName')}
                      value={firstName}
                      onChangeText={(text) => {
                        setFirstName(text);
                        setErrors((e) => ({ ...e, firstName: undefined }));
                      }}
                      placeholder={t('auth.firstNamePlaceholder')}
                      autoCapitalize="words"
                      maxLength={AUTH_INPUT_MAX_LENGTH}
                      returnKeyType="next"
                      onSubmitEditing={() => lastNameRef.current?.focus()}
                      error={errors.firstName}
                    />
                    <AuthTextInput
                      ref={lastNameRef}
                      label={t('auth.lastName')}
                      value={lastName}
                      onChangeText={(text) => {
                        setLastName(text);
                        setErrors((e) => ({ ...e, lastName: undefined }));
                      }}
                      placeholder={t('auth.lastNamePlaceholder')}
                      autoCapitalize="words"
                      maxLength={AUTH_INPUT_MAX_LENGTH}
                      returnKeyType="next"
                      onSubmitEditing={() => usernameRef.current?.focus()}
                      error={errors.lastName}
                    />
                    <AuthTextInput
                      ref={usernameRef}
                      label={t('auth.username')}
                      value={username}
                      onChangeText={(text) => {
                        setUsername(text);
                        setErrors((e) => ({ ...e, username: undefined }));
                      }}
                      placeholder={t('auth.usernamePlaceholder')}
                      autoCapitalize="none"
                      maxLength={AUTH_INPUT_MAX_LENGTH}
                      returnKeyType="done"
                      onSubmitEditing={handleNext}
                      error={errors.username}
                    />
                    <AuthButton title={t('auth.continue')} onPress={handleNext} />
                    <View style={styles.footerRow}>
                      <Text style={[styles.footerLabel, { color: theme.subText }]}>
                        {t('auth.alreadyHaveAccount')}
                      </Text>
                      <TouchableOpacity onPress={() => router.back()} disabled={loading}>
                        <Text style={[styles.footerLink, { color: theme.primary }]}>
                          {` ${t('auth.signIn')}`}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <AuthTextInput
                      ref={emailRef}
                      label={t('auth.email')}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        setErrors((e) => ({ ...e, email: undefined }));
                      }}
                      placeholder={t('auth.emailPlaceholder')}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      maxLength={AUTH_INPUT_MAX_LENGTH}
                      returnKeyType="next"
                      onSubmitEditing={() => passwordRef.current?.focus()}
                      error={errors.email}
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
                      returnKeyType="next"
                      onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                      error={errors.password}
                    />
                    <AuthTextInput
                      ref={confirmPasswordRef}
                      label={t('auth.confirmPassword')}
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        setErrors((e) => ({ ...e, confirmPassword: undefined }));
                      }}
                      placeholder={t('auth.confirmPasswordPlaceholder')}
                      secureTextEntry
                      autoCapitalize="none"
                      maxLength={AUTH_INPUT_MAX_LENGTH}
                      returnKeyType="done"
                      onSubmitEditing={handleRegister}
                      error={errors.confirmPassword}
                    />
                    <AuthButton
                      title={t('auth.createAccount')}
                      onPress={handleRegister}
                      loading={loading}
                    />
                    <View style={styles.footerRow}>
                      <TouchableOpacity onPress={() => setStep(1)} disabled={loading}>
                        <Text style={[styles.footerLink, { color: theme.primary }]}>
                          {`← ${t('auth.back')}`}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.background }]}>
            <View style={[styles.modalIcon, { backgroundColor: `${theme.primary}18` }]}>
              <Ionicons name="person-add-outline" size={24} color={theme.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {t('auth.confirmRegistrationTitle')}
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.subText }]}>
              {t('auth.confirmRegistrationSubtitle')}
            </Text>

            <View style={[styles.accountPreview, { backgroundColor: theme.foreground }]}>
              <View style={styles.accountPreviewRow}>
                <Text style={[styles.accountPreviewLabel, { color: theme.subText }]}>
                  {t('auth.username')}
                </Text>
                <Text style={[styles.accountPreviewValue, { color: theme.text }]} numberOfLines={1}>
                  {username}
                </Text>
              </View>
              <View style={styles.accountPreviewRow}>
                <Text style={[styles.accountPreviewLabel, { color: theme.subText }]}>
                  {t('auth.email')}
                </Text>
                <Text style={[styles.accountPreviewValue, { color: theme.text }]} numberOfLines={1}>
                  {email}
                </Text>
              </View>
              <View style={styles.accountPreviewRow}>
                <Text style={[styles.accountPreviewLabel, { color: theme.subText }]}>
                  {t('auth.name')}
                </Text>
                <Text style={[styles.accountPreviewValue, { color: theme.text }]} numberOfLines={1}>
                  {`${firstName} ${lastName}`.trim()}
                </Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowConfirmModal(false)}
                disabled={loading}
              >
                <Text style={[styles.modalButtonSecondaryText, { color: theme.subText }]}>
                  {t('auth.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={submitRegistration}
                disabled={loading}
              >
                <Text style={[styles.modalButtonPrimaryText, { color: theme.white }]}>
                  {t('auth.createAccount')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => router.dismissTo('/login')}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.background }]}>
            <View
              style={[styles.modalIcon, { backgroundColor: `${theme.correctOptionBackground}18` }]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={26}
                color={theme.correctOptionBackground}
              />
            </View>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {t('auth.accountCreatedTitle')}
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.subText }]}>
              {t('auth.accountCreatedSubtitle', { username })}
            </Text>
            <TouchableOpacity
              style={[styles.successButton, { backgroundColor: theme.primary }]}
              onPress={() => router.dismissTo('/login')}
            >
              <Text style={[styles.modalButtonPrimaryText, { color: theme.white }]}>
                {t('auth.login')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
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
    paddingBottom: Spacing.xl,
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
    fontSize: 28,
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
    marginBottom: Spacing.md,
  },

  // ── Step indicator
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepLine: {
    width: 48,
    height: 2,
    marginHorizontal: 6,
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
    paddingBottom: Spacing.md,
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
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: Spacing.borderRadius,
    padding: Spacing.xl,
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 26,
  },
  modalSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
  accountPreview: {
    borderRadius: Spacing.borderRadius,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  accountPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  accountPreviewLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  accountPreviewValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  modalButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: Spacing.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  modalButtonSecondary: {
    backgroundColor: 'rgba(148, 163, 184, 0.14)',
  },
  modalButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalButtonPrimaryText: {
    fontSize: 14,
    fontWeight: '800',
  },
  successButton: {
    minHeight: 46,
    borderRadius: Spacing.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xl,
  },
});
