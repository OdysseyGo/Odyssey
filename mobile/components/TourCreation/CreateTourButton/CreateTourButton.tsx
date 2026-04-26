import React from 'react';
import { TouchableOpacity, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorTheme } from '@/utils/useColorTheme';
import { createTourButtonStyles } from './CreateTourButton.styles';
import Colors from '@/constants/Colors';
import { isLoggedIn } from '@/api/auth';
import { useTranslation } from 'react-i18next';
import { CopilotProvider, CopilotStep, walkthroughable } from 'react-native-copilot';

const WalkthroughableView = walkthroughable(View);
import { Spacing } from '@/constants/Spacing';
import { ODYSSEY_TAB_BAR_FLOATING_HEIGHT } from '@/components/Navigation/OdysseyTabBar';

export default function CreateTourButton() {
  const theme = useColorTheme();
  const styles = createTourButtonStyles(theme);
  const color = Colors[theme];
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const handlePress = async () => {
    const loggedIn = await isLoggedIn();
    if (!loggedIn) {
      Alert.alert(t('creation.loginRequired'), t('creation.loginRequiredMessage'), [
        { text: t('creation.cancel'), style: 'cancel' },
        { text: t('creation.loginButton'), onPress: () => router.push('/login') },
      ]);
      return;
    }
    router.push('/create-tour');
  };

  return (
    <CopilotStep text={t('tutorial.tours.step4text')} order={4} name="createTourStep">
      <WalkthroughableView
        style={{
        position: 'absolute',
        bottom: Math.max(insets.bottom, Spacing.sm) + ODYSSEY_TAB_BAR_FLOATING_HEIGHT + 16,
        right: 24,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      >
        <TouchableOpacity style={styles.floatingButton} onPress={handlePress} activeOpacity={0.8}>
          <Ionicons name="add" size={30} color={color.white} />
        </TouchableOpacity>
      </WalkthroughableView>
    </CopilotStep>
  );
}
