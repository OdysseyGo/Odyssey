import AuthLayout from '@/components/LoginComponents/AuthLayout';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import AuthTextInput from '@/components/LoginComponents/AuthTextInput';
import AuthButton from '@/components/LoginComponents/AuthButton';
import { authLayoutStyles } from '@/components/LoginComponents/AuthLayout.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import { login, UserCredentials } from '@/api/users';
import * as SecureStore from 'expo-secure-store';
import AuthSubButton from '@/components/LoginComponents/AuthSubButton';
import { router } from 'expo-router';
import { logout } from '@/api/auth';
import { useTranslation } from 'react-i18next';

type LoginScreenProps = {
  navigation?: any;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const theme = useColorTheme();
  const layoutStyles = authLayoutStyles(theme);
  const { t } = useTranslation();

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errors, setErrors] = useState<{ username?: string; password?: string; general?: string }>(
    {}
  );
  const [loading, setLoading] = useState<boolean>(false);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!username) newErrors.username = t('auth.errors.usernameRequired');
    if (!password) newErrors.password = t('auth.errors.passwordRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const credentials: UserCredentials = {
        username: username,
        password: password,
      };

      const response = await login(credentials);

      const { access, refresh } = response;

      await SecureStore.setItem('userToken', access);
      await SecureStore.setItem('refreshToken', refresh);
      router.push('/(tabs)/profile');
    } catch (e) {
      console.error(e);
      await logout();
      setErrors({ general: t('auth.errors.loginFailed') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <View style={layoutStyles.headerContainer}>
        <Text style={layoutStyles.headerTitle}>{t('auth.welcomeTitle')}</Text>
        <Text style={layoutStyles.headerSubtitle}>{t('auth.welcomeSubtitle')}</Text>
      </View>

      {errors.general && <Text style={layoutStyles.errorText}>{errors.general}</Text>}
      <View style={layoutStyles.inputContainer}>
        <AuthTextInput
          label={t('auth.username')}
          value={username}
          onChangeText={setUsername}
          placeholder={t('auth.usernamePlaceholder')}
          keyboardType="twitter"
          autoCapitalize="none"
          error={errors.username}
        />

        <AuthTextInput
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          placeholder={t('auth.passwordPlaceholder')}
          secureTextEntry
          autoCapitalize="none"
          error={errors.password}
        />

        <AuthButton title={t('auth.login')} onPress={handleLogin} loading={loading} />
        <AuthSubButton
          title={t('auth.noAccount')}
          onPress={() => router.push('/register')}
          loading={loading}
        />
        <AuthSubButton
          title={t('auth.forgotPassword')}
          onPress={() => router.push('/forgot-password')}
          loading={loading}
        />
      </View>
    </AuthLayout>
  );
}
