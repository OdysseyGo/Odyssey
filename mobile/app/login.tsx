import AuthLayout from '@/components/LoginComponents/AuthLayout';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import AuthTextInput from '@/components/LoginComponents/AuthTextInput';
import AuthButton from '@/components/LoginComponents/AuthButton';
import { authLayoutStyles } from '@/components/LoginComponents/AuthLayout.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import { loginHeaderConfig } from '@/components/LoginComponents/AuthLayout.config';
import { login, UserCredentials } from '@/api/users';
import * as SecureStore from 'expo-secure-store';
import AuthSubButton from '@/components/LoginComponents/AuthSubButton';
import { router } from 'expo-router';

type LoginScreenProps = {
  navigation?: any;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const theme = useColorTheme();
  const layoutStyles = authLayoutStyles(theme);

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errors, setErrors] = useState<{ username?: string; password?: string; general?: string }>(
    {}
  );
  const [loading, setLoading] = useState<boolean>(false);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!username) newErrors.username = 'username is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const credentials: UserCredentials = {
        username: username, // username as username bcs backend uses username/password
        password: password,
      };

      //alert(`user creds is ${credentials.username}, ${credentials.password}`)

      const response = await login(credentials);
      //alert(response)

      // response contains: { access: string, refresh: string }
      const { access, refresh } = response;

      await SecureStore.setItem('userToken', access);
      await SecureStore.setItem('refreshToken', refresh);
      // Do not push but clear the route and then push
      router.push('/(tabs)/profile');
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
          label="Username"
          value={username}
          onChangeText={setUsername}
          placeholder="Your username"
          keyboardType="twitter"
          autoCapitalize="none"
          error={errors.username}
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
