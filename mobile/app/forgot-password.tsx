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
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AuthTextInput from '@/components/LoginComponents/AuthTextInput';
import AuthButton from '@/components/LoginComponents/AuthButton';
import AuthLanguageSelector from '@/components/LoginComponents/AuthLanguageSelector';
import BackButton from '@/components/common/BackButton';
import { getByUsername, resetPassword } from '@/api/users';
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

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ username?: string; email?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [modalError, setModalError] = useState('');

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

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!username.trim()) newErrors.username = t('auth.errors.usernameRequired');
    if (!email.trim()) newErrors.email = t('auth.errors.emailRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgot = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const resp = await getByUsername(username);
      if (!resp) {
        setErrors({ general: t('auth.errors.userNotFound') });
        return;
      }
      if (resp.email.toLowerCase() !== email.toLowerCase()) {
        setErrors({ general: t('auth.errors.usernameEmailMismatch') });
        return;
      }
      setShowResetModal(true);
    } catch (e) {
      console.error(e);
      setErrors({ general: t('auth.errors.somethingWentWrong') });
    } finally {
      setLoading(false);
    }
  };

  const submitNewPassword = async () => {
    if (!newPass || !confirmNewPass) {
      setModalError(t('auth.errors.bothFieldsRequired'));
      return;
    }
    if (newPass !== confirmNewPass) {
      setModalError(t('auth.errors.passwordsMismatch'));
      return;
    }
    try {
      await resetPassword({ username, email, new_password: newPass });
      setShowResetModal(false);
      router.replace('/login');
    } catch (e) {
      console.error(e);
      setModalError(t('auth.errors.couldNotUpdate'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={{ backgroundColor: theme.headerGradientTop }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        bounces={false}
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
          <AuthLanguageSelector style={{ top: insets.top + 12 }} />
          <View style={styles.logoArea}>
            <View style={styles.iconRing}>
              <Ionicons name="compass" size={46} color="#FFFFFF" />
            </View>
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
              {t('auth.resetSubtitle')}
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

            <View style={styles.inputs}>
              <AuthTextInput
                label={t('auth.username')}
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  setErrors((e) => ({ ...e, username: undefined }));
                }}
                placeholder={t('auth.usernamePlaceholder')}
                autoCapitalize="none"
                returnKeyType="next"
                error={errors.username}
              />
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
                onSubmitEditing={handleForgot}
                error={errors.email}
              />
            </View>

            <AuthButton title={t('auth.verify')} onPress={handleForgot} loading={loading} />

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
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.card, { backgroundColor: theme.cardSurface }]}>
            <Text style={[modalStyles.title, { color: theme.text }]}>
              {t('auth.resetPassword')}
            </Text>

            {modalError ? (
              <Text style={[modalStyles.error, { color: theme.error }]}>{modalError}</Text>
            ) : null}

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
              style={[modalStyles.cancelButton, { borderColor: `${theme.subText}40` }]}
              onPress={() => setShowResetModal(false)}
            >
              <Text style={[modalStyles.cancelText, { color: theme.subText }]}>
                {t('auth.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  logoArea: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    padding: 24,
    borderRadius: 24,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  error: {
    fontSize: 13,
    fontWeight: '500',
  },
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
