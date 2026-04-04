import AuthLayout from '@/components/LoginComponents/AuthLayout';
import React, { use, useState } from 'react';
import { View, Text, Modal } from 'react-native';
import AuthTextInput from '@/components/LoginComponents/AuthTextInput';
import AuthButton from '@/components/LoginComponents/AuthButton';
import AuthSubButton from '@/components/LoginComponents/AuthSubButton';
import { authLayoutStyles } from '@/components/LoginComponents/AuthLayout.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { getByUsername, resetPassword } from '@/api/users';

export default function ForgotPasswordScreen() {
  const theme = useColorTheme();
  const layoutStyles = authLayoutStyles(theme);
  const { t } = useTranslation();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [modalError, setModalError] = useState('');

  const [userId, setUserId] = useState<number | null>(null);

  const validate = () => {
    const newErrors: any = {};

    if (!username) newErrors.username = t('auth.errors.usernameRequired');
    if (!email) newErrors.email = t('auth.errors.emailRequired');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgot = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const resp = await getByUsername(username);

      if (!resp) {
        setErrors({ general: t('auth.errors.userNotFound') });
        return;
      }

      if (resp.email.toLowerCase() !== email.toLowerCase()) {
        setErrors({ general: t('auth.errors.usernameEmailMismatch') });
        return;
      }

      setUserId(resp.id);
      setShowResetModal(true);
    } catch (e) {
      console.error(e);
      setErrors({ general: t('auth.errors.somethingWentWrong') });
    } finally {
      setLoading(false);
    }
  };

  const submitNewPassword = async () => {
    if (!newPass || !confirmNewPass) {
      setModalError(t('auth.errors.bothFieldsRequired'));
      return;
    }
    if (newPass !== confirmNewPass) {
      setModalError(t('auth.errors.passwordsMismatch'));
      return;
    }

    try {
      await resetPassword({ username: username, email: email, new_password: newPass });

      setShowResetModal(false);
      router.replace('/login');
    } catch (e) {
      console.error(e);
      setModalError(t('auth.errors.couldNotUpdate'));
    }
  };

  return (
    <AuthLayout>
      <View style={layoutStyles.headerContainer}>
        <Text style={layoutStyles.headerTitle}>{t('auth.resetTitle')}</Text>
        <Text style={layoutStyles.headerSubtitle}>{t('auth.resetSubtitle')}</Text>
      </View>

      {errors.general && <Text style={layoutStyles.errorText}>{errors.general}</Text>}

      <View style={layoutStyles.inputContainer}>
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

        <AuthButton title={t('auth.verify')} onPress={handleForgot} loading={loading} />
        <AuthSubButton title={t('auth.remembered')} onPress={() => router.back()} />
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
            <Text style={{ fontSize: 20, marginBottom: 10 }}>{t('auth.resetPassword')}</Text>

            {modalError ? <Text style={{ color: 'red' }}>{modalError}</Text> : null}

            <AuthTextInput
              label={t('auth.newPassword')}
              value={newPass}
              onChangeText={setNewPass}
              secureTextEntry
              placeholder={t('auth.newPasswordPlaceholder')}
            />

            <AuthTextInput
              label={t('auth.confirmPassword')}
              value={confirmNewPass}
              onChangeText={setConfirmNewPass}
              secureTextEntry
              placeholder={t('auth.confirmNewPasswordPlaceholder')}
            />

            <AuthButton title={t('auth.updatePassword')} onPress={submitNewPassword} />
            <AuthSubButton title={t('auth.cancel')} onPress={() => setShowResetModal(false)} />
          </View>
        </View>
      </Modal>
    </AuthLayout>
  );
}
