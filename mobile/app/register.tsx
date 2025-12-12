import AuthLayout from '@/components/LoginComponents/AuthLayout';
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import AuthTextInput from '@/components/LoginComponents/AuthTextInput';
import AuthButton from '@/components/LoginComponents/AuthButton';
import AuthSubButton from '@/components/LoginComponents/AuthSubButton';
import { authLayoutStyles } from '@/components/LoginComponents/AuthLayout.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import { registerHeaderConfig } from '@/components/LoginComponents/AuthLayout.config';
import {createUser, CreateUserPayload} from '@/api/users'
import { router } from 'expo-router';

type RegisterScreenProps = {
  navigation?: any;
};

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const theme = useColorTheme();
  const layoutStyles = authLayoutStyles(theme);

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
    if (!firstName) newErrors.firstName = 'First name is required';
    if (!lastName) newErrors.lastName = 'Last name is required';
    if (!username) newErrors.username = 'Username is required';
    if (!email) newErrors.email = 'Email is required';
    if (!emailRegex.test(email)) newErrors.email = 'Email format is wrong. TLD should be at least 2 chars long (.com, .tr etc)';
    if (!password) newErrors.password = 'Password is required';
    if (!confirmPassword) newErrors.confirmPassword = 'Confirm password is required';
    if (password && confirmPassword && password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const user : CreateUserPayload = {
        username: username,
        email:email,
        password:password,
        first_name:firstName,
        last_name:lastName
      }
      const response = await createUser(user)
      router.back()
      alert("User has been created!")
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
        <Text style={layoutStyles.headerTitle}>{registerHeaderConfig.title}</Text>
        <Text style={layoutStyles.headerSubtitle}>{registerHeaderConfig.subtitle}</Text>
      </View>

      {errors.general && <Text style={layoutStyles.errorText}>{errors.general}</Text>}

      <View style={layoutStyles.inputContainer}>
        <AuthTextInput
          label="First Name"
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Your first name"
          autoCapitalize="words"
          error={errors.firstName}
        />
        <AuthTextInput
          label="Last Name"
          value={lastName}
          onChangeText={setLastName}
          placeholder="Your last name"
          autoCapitalize="words"
          error={errors.lastName}
        />
        <AuthTextInput
          label="Username"
          value={username}
          onChangeText={setUsername}
          placeholder="Your username"
          autoCapitalize="none"
          error={errors.username}
        />

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

        <AuthTextInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm your password"
          secureTextEntry
          autoCapitalize="none"
          error={errors.confirmPassword}
        />

        <AuthButton title="Create Account" onPress={handleRegister} loading={loading} />

        <AuthSubButton
          title="Already have an account? Log In"
          onPress={() => router.back()}
          loading={loading}
        />
      </View>
    </AuthLayout>
  );
}
