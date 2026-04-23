import React, { useState } from 'react';
import { ScrollView, StyleSheet, Modal, View as RNView, Pressable } from 'react-native';
import { User, Bell, Shield, Globe, Palette, HelpCircle, Check } from 'lucide-react-native';
import { Text, View } from '@/components/Themed';
import { SettingsRowItem } from '@/components/SettingComponents/SettingsRowItem';
import { SettingsRowGroup } from '@/components/SettingComponents/SettingsRowGroup';
import type { SettingsItemConfig } from '@/components/SettingComponents/SettingsRowItem.config';
import { Spacing } from '@/constants/Spacing';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';

const SUPPORTED_LANGUAGES = [
  { code: 'en', labelKey: 'settings.languages.en' },
  { code: 'tr', labelKey: 'settings.languages.tr' },
  { code: 'es', labelKey: 'settings.languages.es' },
];

type SettingsGroup = {
  title: string;
  items: SettingsItemConfig[];
};

export default function TabTwoScreen() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const colorTheme = useColorTheme();
  const colors = Colors[colorTheme];
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const settingsGroups: SettingsGroup[] = [
    {
      title: '',
      items: [
        {
          key: 'profile',
          label: 'Tour Explorer',
          description: 'explorer@example.com',
          imageUri: 'https://ui-avatars.com/api/?name=Tour+Explorer',
        },
      ],
    },
    {
      title: t('settings.account.title'),
      items: [
        {
          key: 'edit_profile',
          icon: User,
          label: t('settings.account.editProfile.label'),
          description: t('settings.account.editProfile.description'),
        },
        {
          key: 'notifications',
          icon: Bell,
          label: t('settings.account.notifications.label'),
          description: t('settings.account.notifications.description'),
        },
        {
          key: 'privacy',
          icon: Shield,
          label: t('settings.account.privacy.label'),
          description: t('settings.account.privacy.description'),
        },
      ],
    },
    {
      title: t('settings.preferences.title'),
      items: [
        {
          key: 'language',
          icon: Globe,
          label: t('settings.language'),
          description: t(`settings.languages.${language}`),
        },
        {
          key: 'appearance',
          icon: Palette,
          label: t('settings.preferences.appearance.label'),
          description: t('settings.preferences.appearance.description'),
        },
      ],
    },
    {
      title: t('settings.support.title'),
      items: [
        {
          key: 'help_support',
          icon: HelpCircle,
          label: t('settings.support.help.label'),
          description: t('settings.support.help.description'),
        },
      ],
    },
  ];

  const handleItemPress = (groupTitle: string, item: SettingsItemConfig) => {
    if (item.key === 'language') {
      setShowLanguageModal(true);
    }
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {settingsGroups.map((group) => (
          <View key={group.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{group.title}</Text>

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
      </ScrollView>

      <Modal visible={showLanguageModal} transparent animationType="fade">
        <RNView style={styles.modalOverlay}>
          <RNView style={[styles.modalCard, { backgroundColor: colors.foreground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('settings.selectLanguage')}
            </Text>

            {SUPPORTED_LANGUAGES.map((lang) => (
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
                {language === lang.code && <Check size={18} color={colors.primary} />}
              </Pressable>
            ))}
          </RNView>
        </RNView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: Spacing.xs,
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
