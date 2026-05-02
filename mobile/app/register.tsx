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
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import AuthTextInput from '@/components/LoginComponents/AuthTextInput';
import AuthButton from '@/components/LoginComponents/AuthButton';
import AuthLanguageSelector from '@/components/LoginComponents/AuthLanguageSelector';
import AuthLogo from '@/components/LoginComponents/AuthLogo';
import BackButton from '@/components/common/BackButton';
import { ApiError } from '@/api/APIClient';
import { createUser, CreateUserPayload } from '@/api/users';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT < 700 ? SCREEN_HEIGHT * 0.28 : SCREEN_HEIGHT * 0.32;
const AUTH_INPUT_MAX_LENGTH = 50;
const USERNAME_ALLOWED_CHAR_REGEX = /^[\p{L}\p{N}_.@+-]+$/u;
const NAME_ALLOWED_CHAR_REGEX = /^[\p{L}\p{M}][\p{L}\p{M}' -]*$/u;

const isUsernameInvalidCharacterError = (message: string) =>
  /enter a valid username|may contain only letters, numbers|invalid username/i.test(message);

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

  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
    general?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const isNavigatingAway = useRef(false);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
    };
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

  const normalizeNameInput = (value: string) => value.replace(/[\r\n\t]/g, '');
  const normalizeUsernameInput = (value: string) => value.replace(/[\r\n\t\s]/g, '');
  const normalizeEmailInput = (value: string) => value.replace(/[\r\n\t\s]/g, '').toLowerCase();

  const validateStep1 = () => {
    const newErrors: typeof errors = {};
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedUsername = username.trim();

    if (!normalizedFirstName) newErrors.firstName = t('auth.errors.firstNameRequired');
    else if (!NAME_ALLOWED_CHAR_REGEX.test(normalizedFirstName))
      newErrors.firstName = t('auth.errors.firstNameInvalidCharacters');

    if (!normalizedLastName) newErrors.lastName = t('auth.errors.lastNameRequired');
    else if (!NAME_ALLOWED_CHAR_REGEX.test(normalizedLastName))
      newErrors.lastName = t('auth.errors.lastNameInvalidCharacters');

    if (!normalizedUsername) newErrors.username = t('auth.errors.usernameRequired');
    else if (!USERNAME_ALLOWED_CHAR_REGEX.test(normalizedUsername))
      newErrors.username = t('auth.errors.usernameInvalidCharacters');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: typeof errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) newErrors.email = t('auth.errors.emailRequired');
    else if (!emailRegex.test(normalizedEmail)) newErrors.email = t('auth.errors.emailFormat');
    if (!password) newErrors.password = t('auth.errors.passwordRequired');
    if (!confirmPassword) newErrors.confirmPassword = t('auth.errors.confirmPasswordRequired');
    if (password && confirmPassword && password !== confirmPassword)
      newErrors.confirmPassword = t('auth.errors.passwordsMismatch');
    if (!agreedToTerms) newErrors.terms = t('auth.errors.termsRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep1()) return;

    setFirstName((prev) => prev.trim());
    setLastName((prev) => prev.trim());
    setUsername((prev) => prev.trim());
    setStep(2);
  };

  const submitRegistration = async () => {
    setLoading(true);
    try {
      const normalizedFirstName = firstName.trim();
      const normalizedLastName = lastName.trim();
      const normalizedUsername = username.trim();
      const normalizedEmail = email.trim().toLowerCase();

      const user: CreateUserPayload = {
        username: normalizedUsername,
        email: normalizedEmail,
        password,
        first_name: normalizedFirstName,
        last_name: normalizedLastName,
        terms_accepted: true,
      };
      await createUser(user);
      isNavigatingAway.current = true;
      setShowSuccessBanner(true);
      redirectTimeoutRef.current = setTimeout(() => {
        router.dismissTo('/login');
      }, 1400);
    } catch (e) {
      console.error(e);
      if (e instanceof ApiError && isUsernameInvalidCharacterError(e.message)) {
        setErrors({ general: t('auth.errors.usernameInvalidCharacters') });
      } else {
        setErrors({ general: t('auth.errors.registrationFailed') });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateStep2()) return;

    setEmail((prev) => prev.trim().toLowerCase());
    await submitRegistration();
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
                        setFirstName(normalizeNameInput(text));
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
                        setLastName(normalizeNameInput(text));
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
                        setUsername(normalizeUsernameInput(text));
                        setErrors((e) => ({ ...e, username: undefined, general: undefined }));
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
                        setEmail(normalizeEmailInput(text));
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
                    {/* Terms & Privacy checkbox */}
                    <View style={styles.checkboxRow}>
                      <TouchableOpacity
                        onPress={() => {
                          setAgreedToTerms((v) => !v);
                          setErrors((e) => ({ ...e, terms: undefined }));
                        }}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name={agreedToTerms ? 'checkbox' : 'square-outline'}
                          size={22}
                          color={
                            errors.terms
                              ? theme.error
                              : agreedToTerms
                                ? theme.primary
                                : theme.subText
                          }
                        />
                      </TouchableOpacity>
                      <Text style={[styles.checkboxLabel, { color: theme.subText }]}>
                        {t('auth.termsPrefix')}{' '}
                        <Text
                          style={[styles.checkboxLink, { color: theme.primary }]}
                          onPress={() =>
                            Linking.openURL('https://odysseygo.github.io/Odyssey/legal')
                          }
                        >
                          {t('auth.terms')}
                        </Text>{' '}
                        {t('auth.termsAnd')}{' '}
                        <Text
                          style={[styles.checkboxLink, { color: theme.primary }]}
                          onPress={() =>
                            Linking.openURL('https://odysseygo.github.io/Odyssey/legal')
                          }
                        >
                          {t('auth.privacy')}
                        </Text>
                      </Text>
                    </View>
                    {errors.terms && (
                      <Text style={[styles.checkboxError, { color: theme.error }]}>
                        {errors.terms}
                      </Text>
                    )}

                    {showSuccessBanner ? (
                      <View
                        style={[
                          styles.successBanner,
                          { backgroundColor: `${theme.correctOptionBackground}14` },
                        ]}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={theme.correctOptionBackground}
                        />
                        <Text
                          style={[
                            styles.successBannerText,
                            { color: theme.correctOptionBackground },
                          ]}
                        >
                          {t('auth.accountCreatedSubtitle', { username })}
                        </Text>
                      </View>
                    ) : null}
                    <AuthButton
                      title={t('auth.createAccount')}
                      onPress={handleRegister}
                      loading={loading || showSuccessBanner}
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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Spacing.borderRadius,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  successBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },

  // ── Inputs
  inputs: {
    gap: Spacing.xs,
    paddingBottom: Spacing.md,
  },

  // ── Terms checkbox
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
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
    marginTop: 2,
    marginLeft: 30,
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
