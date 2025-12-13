import AuthLayout from '@/components/LoginComponents/AuthLayout';
import React, { use, useState } from 'react';
import { View, Text, Modal } from 'react-native';
import AuthTextInput from '@/components/LoginComponents/AuthTextInput';
import AuthButton from '@/components/LoginComponents/AuthButton';
import AuthSubButton from '@/components/LoginComponents/AuthSubButton';
import { authLayoutStyles } from '@/components/LoginComponents/AuthLayout.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import { resetPasswordHeaderConfig } from '@/components/LoginComponents/AuthLayout.config';
import { router } from 'expo-router';

import { getByUsername, resetPassword } from '@/api/users';

export default function ForgotPasswordScreen() {
  const theme = useColorTheme();
  const layoutStyles = authLayoutStyles(theme);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false); // popup
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [modalError, setModalError] = useState('');

  const [userId, setUserId] = useState<number | null>(null);

  const validate = () => {
    const newErrors: any = {};

    if (!username) newErrors.username = 'Username is required';
    if (!email) newErrors.email = 'Email is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgot = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const resp = await getByUsername(username);

      if (!resp) {
        setErrors({ general: 'User not found' });
        return;
      }

      if (resp.email.toLowerCase() !== email.toLowerCase()) {
        setErrors({ general: 'Username and email do not match' });
        return;
      }

      // Store for patch request
      setUserId(resp.id);

      // Open modal
      setShowResetModal(true);
    } catch (e) {
      console.error(e);
      setErrors({ general: 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  const submitNewPassword = async () => {
    if (!newPass || !confirmNewPass) {
      setModalError('Both fields are required');
      return;
    }
    if (newPass !== confirmNewPass) {
      setModalError('Passwords do not match');
      return;
    }

    try {
      await resetPassword({ username: username, email: email, new_password: newPass });

      setShowResetModal(false);
      router.replace('/login');
    } catch (e) {
      console.error(e);
      setModalError('Could not update password');
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
          placeholder="Your email"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />

        <AuthButton title="Verify" onPress={handleForgot} loading={loading} />
        <AuthSubButton title="Ooh, I remembered!" onPress={() => router.back()} />
      </View>

      {/* RESET PASSWORD MODAL */}
      <Modal visible={showResetModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0,7)',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: 'rgba(14, 120, 101, 1)',
              padding: 20,
              borderRadius: 12,
            }}
          >
            <Text style={{ fontSize: 20, marginBottom: 10 }}>Reset Password</Text>

            {modalError ? <Text style={{ color: 'red' }}>{modalError}</Text> : null}

            <AuthTextInput
              label="New Password"
              value={newPass}
              onChangeText={setNewPass}
              secureTextEntry
              placeholder="New password"
            />

            <AuthTextInput
              label="Confirm Password"
              value={confirmNewPass}
              onChangeText={setConfirmNewPass}
              secureTextEntry
              placeholder="Confirm password"
            />

            <AuthButton title="Update Password" onPress={submitNewPassword} />
            <AuthSubButton title="Cancel" onPress={() => setShowResetModal(false)} />
          </View>
        </View>
      </Modal>
    </AuthLayout>
  );
}
