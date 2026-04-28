import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Modal,
  View as RNView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { User, Bell, Globe, Palette, Check, LogOut } from 'lucide-react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import BackButton from '@/components/common/BackButton';
import { SettingsRowItem } from '@/components/SettingComponents/SettingsRowItem';
import { SettingsRowGroup } from '@/components/SettingComponents/SettingsRowGroup';
import type { SettingsItemConfig } from '@/components/SettingComponents/SettingsRowItem.config';
import { getMe, partialUpdateUser } from '@/api/users';
import { setProfileNeedsRefresh } from '@/lib/profileRefresh';
import { Spacing } from '@/constants/Spacing';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { SUPPORTED_LANGUAGE_OPTIONS } from '@/i18n/languageConfig';

type SettingsGroup = {
  title: string;
  items: SettingsItemConfig[];
};

type EditProfileForm = {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
};

type PopupView = 'settings' | 'edit-profile';

export default function SettingsScreen({
  onClose,
  onLogout,
}: {
  onClose?: () => void;
  onLogout?: () => void;
}) {
  const { t } = useTranslation();
  const { language, languagePreference, setLanguage } = useLanguage();
  const { themePreference, setThemePreference } = useTheme();
  const colorTheme = useColorTheme();
  const colors = Colors[colorTheme];
  const editProfileSurfaceColor = colors.background;
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);
  const [popupView, setPopupView] = useState<PopupView>('settings');
  const [editProfileForm, setEditProfileForm] = useState<EditProfileForm>({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
  });
  const [editProfileErrors, setEditProfileErrors] = useState<Partial<EditProfileForm>>({});
  const [editProfileGeneralError, setEditProfileGeneralError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isLoadingProfileData, setIsLoadingProfileData] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const isEditProfileView = popupView === 'edit-profile';

  const settingsGroups: SettingsGroup[] = [
    {
      title: t('settings.sections.account'),
      items: [
        {
          key: 'edit_profile',
          icon: User,
          label: t('settings.items.editProfile.label'),
          labelKey: 'settings.items.editProfile.label',
          description: t('settings.items.editProfile.description'),
          descriptionKey: 'settings.items.editProfile.description',
        },
        {
          key: 'notifications',
          icon: Bell,
          label: t('settings.items.notifications.label'),
          labelKey: 'settings.items.notifications.label',
          description: t('settings.items.notifications.description'),
          descriptionKey: 'settings.items.notifications.description',
        },
        {
          key: 'logout',
          icon: LogOut,
          label: t('settings.items.logout.label', { defaultValue: 'Logout' }),
          labelKey: 'settings.items.logout.label',
          description: t('settings.items.logout.description', {
            defaultValue: 'Sign out of your account',
          }),
          descriptionKey: 'settings.items.logout.description',
          showChevron: false,
          destructive: true,
        },
      ],
    },
    {
      title: t('settings.sections.preferences'),
      items: [
        {
          key: 'language',
          icon: Globe,
          label: t('settings.language'),
          labelKey: 'settings.language',
          description:
            languagePreference === 'system'
              ? `${t('settings.languages.system')} (${t(`settings.languages.${language}`)})`
              : t(`settings.languages.${language}`),
          descriptionKey:
            languagePreference === 'system'
              ? 'settings.languages.system'
              : `settings.languages.${language}`,
        },
        {
          key: 'appearance',
          icon: Palette,
          label: t('settings.appearance.label'),
          labelKey: 'settings.appearance.label',
          description:
            themePreference === 'system'
              ? t('settings.appearance.mode.system')
              : themePreference === 'dark'
                ? t('settings.appearance.mode.dark')
                : t('settings.appearance.mode.light'),
          descriptionKey:
            themePreference === 'system'
              ? 'settings.appearance.mode.system'
              : themePreference === 'dark'
                ? 'settings.appearance.mode.dark'
                : 'settings.appearance.mode.light',
        },
      ],
    },
  ];

  const validateEditProfileForm = () => {
    const nextErrors: Partial<EditProfileForm> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

    if (!editProfileForm.username.trim()) {
      nextErrors.username = t('auth.errors.usernameRequired', {
        defaultValue: 'Username is required',
      });
    }

    if (!editProfileForm.email.trim()) {
      nextErrors.email = t('auth.errors.emailRequired', { defaultValue: 'Email is required' });
    } else if (!emailRegex.test(editProfileForm.email.trim())) {
      nextErrors.email = t('auth.errors.emailFormat', {
        defaultValue: 'Please enter a valid email',
      });
    }

    setEditProfileErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const openEditProfileView = async () => {
    setPopupView('edit-profile');
    setEditProfileGeneralError(null);
    setEditProfileErrors({});
    setIsLoadingProfileData(true);

    try {
      const me = await getMe();
      setCurrentUserId(me.id);
      setEditProfileForm({
        username: me.username ?? '',
        first_name: me.first_name ?? '',
        last_name: me.last_name ?? '',
        email: me.email ?? '',
      });
    } catch {
      setEditProfileGeneralError(
        t('settings.editProfile.loadError', {
          defaultValue: 'Could not load your profile details.',
        })
      );
    } finally {
      setIsLoadingProfileData(false);
    }
  };

  const backToSettingsView = () => {
    setPopupView('settings');
    setEditProfileGeneralError(null);
    setEditProfileErrors({});
  };

  const submitEditProfile = async () => {
    if (!validateEditProfileForm()) return;
    if (!currentUserId) {
      setEditProfileGeneralError(
        t('settings.editProfile.loadError', {
          defaultValue: 'Could not load your profile details.',
        })
      );
      return;
    }

    setIsSavingProfile(true);
    setEditProfileGeneralError(null);

    try {
      const payload = {
        username: editProfileForm.username.trim(),
        first_name: editProfileForm.first_name.trim(),
        last_name: editProfileForm.last_name.trim(),
        email: editProfileForm.email.trim(),
      };

      const updated = await partialUpdateUser(String(currentUserId), payload);
      setEditProfileForm({
        username: updated.username ?? payload.username,
        first_name: updated.first_name ?? payload.first_name,
        last_name: updated.last_name ?? payload.last_name,
        email: updated.email ?? payload.email,
      });
      setProfileNeedsRefresh();
      setPopupView('settings');
    } catch (error: any) {
      const serverError =
        error?.originalError?.response?.data?.detail ||
        error?.originalError?.response?.data?.username?.[0] ||
        error?.originalError?.response?.data?.email?.[0] ||
        error?.message ||
        t('settings.editProfile.saveError', { defaultValue: 'Could not update profile.' });

      setEditProfileGeneralError(String(serverError));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleItemPress = (_groupTitle: string, item: SettingsItemConfig) => {
    if (item.key === 'edit_profile') {
      void openEditProfileView();
      return;
    }

    if (item.key === 'language') {
      setShowLanguageModal(true);
      return;
    }

    if (item.key === 'appearance') {
      setShowAppearanceModal(true);
      return;
    }

    if (item.key === 'logout') {
      onClose?.();
      setTimeout(() => onLogout?.(), 0);
    }
  };

  return (
    <>
      <View style={styles.popupOverlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => (onClose ? onClose() : router.back())}
        />

        <View style={[styles.popupCard, { backgroundColor: colors.background }]}>
          <View style={styles.popupHeader}>
            {isEditProfileView ? (
              <BackButton
                onPress={backToSettingsView}
                color={colors.text}
                style={[styles.headerBackButton, { backgroundColor: colors.foregroundSecondary }]}
                size={20}
              />
            ) : (
              <View style={styles.headerBackButtonPlaceholder} />
            )}

            <Text style={[styles.popupTitle, { color: colors.text }]}>
              {isEditProfileView
                ? t('settings.items.editProfile.label', { defaultValue: 'Edit Profile' })
                : t('tabs.settings')}
            </Text>

            <Pressable
              onPress={() => (onClose ? onClose() : router.back())}
              accessibilityRole="button"
              accessibilityLabel={t('common.close', { defaultValue: 'Close' })}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          {isEditProfileView ? (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.container}
            >
              {isLoadingProfileData ? (
                <View style={styles.loaderWrap}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : (
                <ScrollView
                  style={styles.container}
                  contentContainerStyle={[styles.content, { paddingHorizontal: Spacing.lg }]}
                  keyboardShouldPersistTaps="handled"
                >
                  {editProfileGeneralError ? (
                    <View
                      style={[
                        styles.errorBanner,
                        { backgroundColor: `${colors.error}12`, borderColor: `${colors.error}35` },
                      ]}
                    >
                      <Ionicons name="alert-circle" size={16} color={colors.error} />
                      <Text style={[styles.errorBannerText, { color: colors.error }]}>
                        {editProfileGeneralError}
                      </Text>
                    </View>
                  ) : null}

                  <RNView style={[styles.formFields, { backgroundColor: editProfileSurfaceColor }]}>
                    <Text style={[styles.inputLabel, { color: colors.subText }]}>Username</Text>
                    <TextInput
                      value={editProfileForm.username}
                      onChangeText={(text) => {
                        setEditProfileForm((prev) => ({ ...prev, username: text }));
                        setEditProfileErrors((prev) => ({ ...prev, username: undefined }));
                      }}
                      autoCapitalize="none"
                      style={[
                        styles.textInput,
                        {
                          borderColor: colors.border,
                          color: colors.text,
                          backgroundColor: editProfileSurfaceColor,
                        },
                      ]}
                      placeholder="username"
                      placeholderTextColor={colors.subText}
                    />
                    {editProfileErrors.username ? (
                      <Text style={[styles.fieldError, { color: colors.error }]}>
                        {editProfileErrors.username}
                      </Text>
                    ) : null}

                    <Text style={[styles.inputLabel, { color: colors.subText }]}>First name</Text>
                    <TextInput
                      value={editProfileForm.first_name}
                      onChangeText={(text) =>
                        setEditProfileForm((prev) => ({ ...prev, first_name: text }))
                      }
                      autoCapitalize="words"
                      style={[
                        styles.textInput,
                        {
                          borderColor: colors.border,
                          color: colors.text,
                          backgroundColor: editProfileSurfaceColor,
                        },
                      ]}
                      placeholder="First name"
                      placeholderTextColor={colors.subText}
                    />

                    <Text style={[styles.inputLabel, { color: colors.subText }]}>Last name</Text>
                    <TextInput
                      value={editProfileForm.last_name}
                      onChangeText={(text) =>
                        setEditProfileForm((prev) => ({ ...prev, last_name: text }))
                      }
                      autoCapitalize="words"
                      style={[
                        styles.textInput,
                        {
                          borderColor: colors.border,
                          color: colors.text,
                          backgroundColor: editProfileSurfaceColor,
                        },
                      ]}
                      placeholder="Last name"
                      placeholderTextColor={colors.subText}
                    />

                    <Text style={[styles.inputLabel, { color: colors.subText }]}>Email</Text>
                    <TextInput
                      value={editProfileForm.email}
                      onChangeText={(text) => {
                        setEditProfileForm((prev) => ({ ...prev, email: text }));
                        setEditProfileErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoCorrect={false}
                      style={[
                        styles.textInput,
                        {
                          borderColor: colors.border,
                          color: colors.text,
                          backgroundColor: editProfileSurfaceColor,
                        },
                      ]}
                      placeholder="name@example.com"
                      placeholderTextColor={colors.subText}
                    />
                    {editProfileErrors.email ? (
                      <Text style={[styles.fieldError, { color: colors.error }]}>
                        {editProfileErrors.email}
                      </Text>
                    ) : null}
                  </RNView>

                  <RNView
                    style={[styles.editActionsRow, { backgroundColor: editProfileSurfaceColor }]}
                  >
                    <Pressable
                      onPress={backToSettingsView}
                      style={[styles.secondaryAction, { borderColor: colors.border }]}
                    >
                      <Text style={[styles.secondaryActionText, { color: colors.text }]}>
                        {t('common.cancel', { defaultValue: 'Cancel' })}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={submitEditProfile}
                      disabled={isSavingProfile}
                      style={({ pressed }) => [
                        styles.primaryAction,
                        { backgroundColor: colors.primary },
                        (pressed || isSavingProfile) && { opacity: 0.8 },
                      ]}
                    >
                      {isSavingProfile ? (
                        <ActivityIndicator color={colors.white} />
                      ) : (
                        <Text style={[styles.primaryActionText, { color: colors.white }]}>
                          {t('common.save', { defaultValue: 'Save' })}
                        </Text>
                      )}
                    </Pressable>
                  </RNView>
                </ScrollView>
              )}
            </KeyboardAvoidingView>
          ) : (
            <View style={[styles.container, styles.content]}>
              {settingsGroups.map((group) => (
                <View key={group.title} style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.subText }]}>
                    {group.title}
                  </Text>
                  <SettingsRowGroup>
                    {group.items.map((item) => (
                      <SettingsRowItem
                        key={item.key ?? item.label}
                        item={item}
                        onPress={() => handleItemPress(group.title, item)}
                      />
                    ))}
                  </SettingsRowGroup>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      <Modal visible={showLanguageModal} transparent animationType="fade">
        <RNView style={styles.modalOverlay}>
          <RNView style={[styles.modalCard, { backgroundColor: colors.foreground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('settings.selectLanguage')}
            </Text>

            {SUPPORTED_LANGUAGE_OPTIONS.map((lang) => (
              <Pressable
                key={lang.code}
                style={({ pressed }) => [
                  styles.languageOption,
                  { borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={async () => {
                  await setLanguage(lang.code);
                  setShowLanguageModal(false);
                }}
              >
                <Text style={[styles.languageLabel, { color: colors.text }]}>
                  {t(lang.labelKey)}
                </Text>
                {languagePreference === lang.code && <Check size={18} color={colors.primary} />}
              </Pressable>
            ))}
          </RNView>
        </RNView>
      </Modal>

      <Modal visible={showAppearanceModal} transparent animationType="fade">
        <RNView style={styles.modalOverlay}>
          <RNView style={[styles.modalCard, { backgroundColor: colors.foreground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('settings.appearance.label')}
            </Text>

            {(['system', 'light', 'dark'] as const).map((mode) => (
              <Pressable
                key={mode}
                style={({ pressed }) => [
                  styles.languageOption,
                  { borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => {
                  void setThemePreference(mode);
                  setShowAppearanceModal(false);
                }}
              >
                <Text style={[styles.languageLabel, { color: colors.text }]}>
                  {t(`settings.appearance.mode.${mode}`)}
                </Text>
                {themePreference === mode && <Check size={18} color={colors.primary} />}
              </Pressable>
            ))}
          </RNView>
        </RNView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  popupCard: {
    borderRadius: 20,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerBackButton: {
    width: Spacing.iconButtonSmall,
    height: Spacing.iconButtonSmall,
    borderRadius: Spacing.iconButtonSmall / 2,
  },
  headerBackButtonPlaceholder: {
    width: Spacing.iconButtonSmall,
    height: Spacing.iconButtonSmall,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: '100%',
  },
  content: {
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  section: {
    backgroundColor: 'transparent',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.xs,
    paddingLeft: Spacing.xl,
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  modalCard: {
    borderRadius: 16,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  loaderWrap: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Spacing.borderRadius,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  formFields: {
    gap: Spacing.xs,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: 15,
  },
  fieldError: {
    fontSize: 12,
    marginTop: 2,
  },
  editActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  secondaryAction: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryAction: {
    borderRadius: 10,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    minWidth: 88,
    alignItems: 'center',
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  languageLabel: {
    fontSize: 16,
  },
});
