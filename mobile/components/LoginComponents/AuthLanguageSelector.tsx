import React, { useState } from 'react';
import { Modal, Pressable, StyleProp, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Check, ChevronDown, Globe2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/contexts/LanguageContext';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { AUTH_LANGUAGE_OPTIONS } from './AuthLanguageSelector.config';
import { authLanguageSelectorStyles as styles } from './AuthLanguageSelector.styles';

type AuthLanguageSelectorProps = {
  style?: StyleProp<ViewStyle>;
};

export default function AuthLanguageSelector({ style }: AuthLanguageSelectorProps) {
  const colorScheme = useColorTheme();
  const colors = Colors[colorScheme];
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);

  const currentLanguage =
    AUTH_LANGUAGE_OPTIONS.find((supportedLanguage) => supportedLanguage.code === language) ??
    AUTH_LANGUAGE_OPTIONS[0];

  return (
    <>
      <TouchableOpacity
        style={[styles.selectorButton, style]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel={t('settings.selectLanguage')}
      >
        <Globe2 size={16} color="#FFFFFF" />
        <Text style={styles.selectorText}>{currentLanguage.code.toUpperCase()}</Text>
        <ChevronDown size={14} color="rgba(255,255,255,0.9)" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.foreground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('settings.selectLanguage')}
            </Text>

            {AUTH_LANGUAGE_OPTIONS.map((supportedLanguage) => {
              const isSelected = language === supportedLanguage.code;
              return (
                <Pressable
                  key={supportedLanguage.code}
                  style={({ pressed }) => [
                    styles.languageOption,
                    { borderColor: colors.borderLight },
                    isSelected && {
                      borderColor: colors.primary,
                      backgroundColor: colors.primaryMuted,
                    },
                    pressed && { opacity: 0.72 },
                  ]}
                  onPress={async () => {
                    await setLanguage(supportedLanguage.code);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[styles.languageLabel, { color: colors.text }]}>
                    {t(supportedLanguage.labelKey)}
                  </Text>
                  {isSelected && <Check size={18} color={colors.primary} />}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
