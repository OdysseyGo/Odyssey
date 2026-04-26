import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Animated, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorTheme } from '@/utils/useColorTheme';
import { createTourButtonStyles } from './CreateTourButton.styles';
import Colors from '@/constants/Colors';
import { isLoggedIn } from '@/api/auth';
import { useTranslation } from 'react-i18next';
import { CopilotProvider, CopilotStep, walkthroughable } from 'react-native-copilot';

const WalkthroughableView = walkthroughable(View);

export default function CreateTourButton() {
  const theme = useColorTheme();
  const styles = createTourButtonStyles(theme);
  const color = Colors[theme];
  const { t } = useTranslation();

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
            <WalkthroughableView   style={{
        position: 'absolute',
        bottom: 24,
        right: 24,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <TouchableOpacity style={styles.floatingButton} onPress={handlePress} activeOpacity={0.8}>
        <Ionicons name="add" size={30} color={color.white} />
      </TouchableOpacity>
    </WalkthroughableView>
    </CopilotStep>
  );
}
