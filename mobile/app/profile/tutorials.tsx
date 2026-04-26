import React from 'react';
import { StyleSheet, Pressable, View as RNView } from 'react-native';
import { User, Compass, PlayCircle } from 'lucide-react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SettingsRowItem } from '@/components/SettingComponents/SettingsRowItem';
import { SettingsRowGroup } from '@/components/SettingComponents/SettingsRowGroup';
import type { SettingsItemConfig } from '@/components/SettingComponents/SettingsRowItem.config';
import { Spacing } from '@/constants/Spacing';
import { useTranslation } from 'react-i18next';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { TutorialType, useTutorial } from '@/contexts/TutorialContext';

type TutorialItemConfig = SettingsItemConfig & {
  tutorialKey: TutorialType;
  route: string;
};

export default function TutorialsModal({ onClose }: { onClose?: () => void }) {
  const { t } = useTranslation();
  const colorTheme = useColorTheme();
  const colors = Colors[colorTheme];
  const { startTutorial } = useTutorial();

  const tutorialItems: TutorialItemConfig[] = [
    {
      key: 'profile_tutorial',
      icon: User,
      label: t('tutorial.profile.label', { defaultValue: 'Profile Guide' }),
      labelKey: 'tutorial.profile.label',
      description: t('tutorial.profile.desc', {
        defaultValue: 'Learn how to manage your stats, friends, and avatar.',
      }),
      descriptionKey: 'tutorial.profile.desc',
      tutorialKey: 'PROFILE_TUTORIAL',
      route: '/profile',
    },
    {
      key: 'tours_tutorial',
      icon: Compass,
      label: t('tutorial.tours.label', { defaultValue: 'Tours Walkthrough' }),
      labelKey: 'tutorial.tours.label',
      description: t('tutorial.tours.desc', {
        defaultValue: 'Learn how to navigate and interact with tours.',
      }),
      descriptionKey: 'tutorial.tours.desc',
      tutorialKey: 'TOURS_TUTORIAL',
      route: '/tourDisplay',
    },
  ];

  const handleTutorialPress = (item: TutorialItemConfig) => {
    // 1. Instantly trigger the modal close animation
    if (onClose) onClose();

    // 2. Wait 400ms for the modal to completely vanish from the screen
    setTimeout(() => {
      // 3. Navigate to the new screen
      router.navigate(item.route as any);

      // 4. Wait just a tiny bit for the navigation transition to finish
      //    before arming the global context!
      setTimeout(() => {
        startTutorial(item.tutorialKey);
      }, 100);
    }, 400);
  };

  return (
    <View style={styles.popupOverlay}>
      {/* Background tap to close */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => (onClose ? onClose() : router.back())}
      />

      <View style={[styles.popupCard, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.popupHeader}>
          {/* Invisible placeholder to keep title perfectly centered */}
          <View style={styles.headerBackButtonPlaceholder} />

          <Text style={[styles.popupTitle, { color: colors.text }]}>
            {t('tutorial.title', { defaultValue: 'Help & Tutorials' })}
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

        {/* Content List */}
        <RNView style={[styles.container, styles.content]}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.subText }]}>
              {t('tutorial.section', { defaultValue: 'Available Tutorials' })}
            </Text>

            <SettingsRowGroup>
              {tutorialItems.map((item) => (
                <SettingsRowItem
                  key={item.key ?? item.label}
                  item={item}
                  onPress={() => handleTutorialPress(item)}
                  // Optionally swap out the default chevron for a play button icon if your SettingsRowItem supports custom right-side elements!
                />
              ))}
            </SettingsRowGroup>
          </View>
        </RNView>
      </View>
    </View>
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
  headerBackButtonPlaceholder: {
    width: 32,
    height: 32,
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
});
