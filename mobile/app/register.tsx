import AuthLayout from '@/components/LoginComponents/AuthLayout';
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import AuthTextInput from '@/components/LoginComponents/AuthTextInput';
import AuthButton from '@/components/LoginComponents/AuthButton';
import AuthSubButton from '@/components/LoginComponents/AuthSubButton';
import { authLayoutStyles } from '@/components/LoginComponents/AuthLayout.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import { createUser, CreateUserPayload } from '@/api/users';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

type RegisterScreenProps = {
  navigation?: any;
};

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const theme = useColorTheme();
  const layoutStyles = authLayoutStyles(theme);
  const { t } = useTranslation();

  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const [loading, setLoading] = useState<boolean>(false);

  const validate = () => {
    const newErrors: typeof errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
    if (!firstName) newErrors.firstName = t('auth.errors.firstNameRequired');
    if (!lastName) newErrors.lastName = t('auth.errors.lastNameRequired');
    if (!username) newErrors.username = t('auth.errors.usernameRequired');
    if (!email) newErrors.email = t('auth.errors.emailRequired');
    if (!emailRegex.test(email)) newErrors.email = t('auth.errors.emailFormat');
    if (!password) newErrors.password = t('auth.errors.passwordRequired');
    if (!confirmPassword) newErrors.confirmPassword = t('auth.errors.confirmPasswordRequired');
    if (password && confirmPassword && password !== confirmPassword) {
      newErrors.confirmPassword = t('auth.errors.passwordsMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const user: CreateUserPayload = {
        username: username,
        email: email,
        password: password,
        first_name: firstName,
        last_name: lastName,
      };
      await createUser(user);
      router.back();
      alert(t('auth.userCreated'));
    } catch (e) {
      console.error(e);
      setErrors({ general: t('auth.errors.registrationFailed') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <View style={layoutStyles.headerContainer}>
        <Text style={layoutStyles.headerTitle}>{t('auth.registerTitle')}</Text>
        <Text style={layoutStyles.headerSubtitle}>{t('auth.registerSubtitle')}</Text>
      </View>

      {errors.general && <Text style={layoutStyles.errorText}>{errors.general}</Text>}

      <View style={layoutStyles.inputContainer}>
        <AuthTextInput
          label={t('auth.firstName')}
          value={firstName}
          onChangeText={setFirstName}
          placeholder={t('auth.firstNamePlaceholder')}
          autoCapitalize="words"
          error={errors.firstName}
        />
        <AuthTextInput
          label={t('auth.lastName')}
          value={lastName}
          onChangeText={setLastName}
          placeholder={t('auth.lastNamePlaceholder')}
          autoCapitalize="words"
          error={errors.lastName}
        />
        <AuthTextInput
          label={t('auth.username')}
          value={username}
          onChangeText={setUsername}
          placeholder={t('auth.usernamePlaceholder')}
          autoCapitalize="none"
          error={errors.username}
        />

        <AuthTextInput
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          placeholder={t('auth.emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
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

        <AuthTextInput
          label={t('auth.confirmPassword')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder={t('auth.confirmPasswordPlaceholder')}
          secureTextEntry
          autoCapitalize="none"
          error={errors.confirmPassword}
        />

        <AuthButton title={t('auth.createAccount')} onPress={handleRegister} loading={loading} />

        <AuthSubButton
          title={t('auth.alreadyHaveAccount')}
          onPress={() => router.back()}
          loading={loading}
        />
      </View>
    </AuthLayout>
  );
}
