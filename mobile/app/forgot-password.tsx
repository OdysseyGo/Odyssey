import AuthLayout from '@/components/LoginComponents/AuthLayout';
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import AuthTextInput from '@/components/LoginComponents/AuthTextInput';
import AuthButton from '@/components/LoginComponents/AuthButton';
import AuthSubButton from '@/components/LoginComponents/AuthSubButton';
import { authLayoutStyles } from '@/components/LoginComponents/AuthLayout.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import { resetPasswordHeaderConfig } from '@/components/LoginComponents/AuthLayout.config';
import { router } from 'expo-router';

export default function forgotPassword() {
  const theme = useColorTheme();
  const layoutStyles = authLayoutStyles(theme);

  const [email, setEmail] = useState<string>('');
  const [confirmEmail, setConfirmEmail] = useState<string>('');
  const [errors, setErrors] = useState<{
    email?: string;
    confirmEmail?: string;
    general?: string;
  }>({});

  const [loading, setLoading] = useState<boolean>(false);

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!email) newErrors.email = 'Email is required';
    if (!confirmEmail) newErrors.confirmEmail = 'Confirm Email is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      // TODO
    } catch (e) {
      console.error(e);
      setErrors({ general: 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <View style={layoutStyles.headerContainer}>
        <Text style={layoutStyles.headerTitle}>{resetPasswordHeaderConfig.title}</Text>
        <Text style={layoutStyles.headerSubtitle}>{resetPasswordHeaderConfig.subtitle}</Text>
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
          label="Confirm Email"
          value={confirmEmail}
          onChangeText={setConfirmEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.confirmEmail}
        />

        <AuthButton title="Reset Password" onPress={handleRegister} loading={loading} />
        <AuthSubButton title="Ooh I remembered!" onPress={() => router.back()} />
      </View>
    </AuthLayout>
  );
}
