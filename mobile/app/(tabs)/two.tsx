import { ScrollView, StyleSheet } from 'react-native';
import { User, Bell, Shield, Globe, Palette, HelpCircle, CreditCard, Wallet } from 'lucide-react-native';
import { Text, View } from '@/components/Themed';
import { SettingsRowItem } from '@/components/SettingComponents/SettingsRowItem';
import { SettingsRowGroup } from '@/components/SettingComponents/SettingsRowGroup';
import type { SettingsItemConfig } from '@/components/SettingComponents/SettingsRowItem.config';
import { Spacing } from '@/constants/Spacing';
import { router } from 'expo-router';

type SettingsGroup = {
  title: string;
  items: SettingsItemConfig[];
};

export default function TabTwoScreen() {
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
      title: 'Account',
      items: [
        {
          key: 'edit_profile',
          icon: User,
          label: 'Edit Profile',
          description: 'Update your personal information',
        },
        {
          key: 'notifications',
          icon: Bell,
          label: 'Notifications',
          description: 'Manage notification preferences',
        },
        {
          key: 'privacy',
          icon: Shield,
          label: 'Privacy',
          description: 'Control your privacy settings',
        },
        {
          key: 'subscription',
          icon: CreditCard,
          label: 'Subscription & Billing',
          description: 'Manage your plan',
        },
        {
          key: 'credits',
          icon: Wallet,
          label: 'Credit Balance',
          description: 'Buy and manage credits',
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          key: 'language',
          icon: Globe,
          label: 'Language',
          description: 'English',
        },
        {
          key: 'appearance',
          icon: Palette,
          label: 'Appearance',
          description: 'Light mode',
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          key: 'help_support',
          icon: HelpCircle,
          label: 'Help & Support',
          description: 'Get help with the app',
        },
      ],
    },
  ];

  const handleItemPress = (groupTitle: string, item: SettingsItemConfig) => {
    if (item.key === 'subscription') router.push('/subscription');
    if (item.key === 'credits') router.push('/credit-store');
  };

  return (
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
});
