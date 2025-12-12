import AuthLayout from '@/components/LoginComponents/AuthLayout';
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import AuthTextInput from '@/components/LoginComponents/AuthTextInput';
import AuthButton from '@/components/LoginComponents/AuthButton';
import { authLayoutStyles } from '@/components/LoginComponents/AuthLayout.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import { loginHeaderConfig } from '@/components/LoginComponents/AuthLayout.config';
import AuthSubButton from '@/components/LoginComponents/AuthSubButton';
import { router } from 'expo-router';

type LoginScreenProps = {
  navigation?: any;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const theme = useColorTheme();
  const layoutStyles = authLayoutStyles(theme);

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState<boolean>(false);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      // TODO
    } catch (e) {
      console.error(e);
      setErrors({ general: 'Login failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <View style={layoutStyles.headerContainer}>
        <Text style={layoutStyles.headerTitle}>{loginHeaderConfig.title}</Text>
        <Text style={layoutStyles.headerSubtitle}>{loginHeaderConfig.subtitle}</Text>
      </View>

      {errors.general && <Text style={layoutStyles.errorText}>{errors.general}</Text>}
      <View style={layoutStyles.inputContainer}>
        <AuthTextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />

        <AuthTextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          secureTextEntry
          autoCapitalize="none"
          error={errors.password}
        />

        <AuthButton title="Log In" onPress={handleLogin} loading={loading} />
        <AuthSubButton
          title="No Account? Create One"
          onPress={() => router.push('/register')}
          loading={loading}
        />
        <AuthSubButton
          title="Forgot Password?"
          onPress={() => router.push('/forgot-password')}
          loading={loading}
        />
      </View>
    </AuthLayout>
  );
}
