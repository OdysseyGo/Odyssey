import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Linking, Image } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { rememberDisclaimerAccepted } from '@/lib/disclaimer';
import { getCurrentUser } from '@/api/auth';

export default function DisclaimerScreen() {
  const colorScheme = useColorTheme();
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  async function handleAccept() {
    await rememberDisclaimerAccepted();
    const user = await getCurrentUser();
    router.replace(user?.terms_update_required ? '/terms-update' : '/(tabs)/map');
  }

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: theme.foreground, opacity: fadeAnim }]}
    >
      {/* Top spacer */}
      <View style={{ height: insets.top + Spacing.lg }} />

      {/* All content centered */}
      <View style={[styles.center, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Text style={[styles.title, { color: theme.text }]}>{t('disclaimer.title')}</Text>

        {/* PLACEHOLDER IMAGE — replace View + Ionicons with:
            <Image source={require('@/assets/images/disclaimer.png')} style={styles.image} resizeMode="contain" /> */}
        <View style={styles.imagePlaceholder}>
          <Image
            source={require('@/assets/images/mascotte3.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        <Text style={[styles.mascot, { color: theme.text }]}>{t('disclaimer.mascot')}</Text>

        <Text style={[styles.body, { color: theme.text }]}>{t('disclaimer.body')}</Text>

        <Text style={[styles.legal, { color: theme.text }]}>
          {t('disclaimer.legalPrefix')}{' '}
          <Text
            style={[styles.link, { color: theme.primary }]}
            onPress={() => Linking.openURL('https://odysseygo.github.io/Odyssey/legal')}
          >
            {t('disclaimer.terms')}
          </Text>{' '}
          {t('disclaimer.legalAnd')}{' '}
          <Text
            style={[styles.link, { color: theme.primary }]}
            onPress={() => Linking.openURL('https://odysseygo.github.io/Odyssey/legal')}
          >
            {t('disclaimer.privacy')}
          </Text>
          {t('disclaimer.legalSuffix')}
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleAccept}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>{t('disclaimer.cta')}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  mascot: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  imagePlaceholder: {
    width: 240,
    height: 240,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 240,
    height: 240,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  legal: {
    fontSize: 14,
    lineHeight: 21,
  },
  link: {
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  button: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
