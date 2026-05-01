// components/settings/SettingsItemRow.tsx
import React, { useMemo } from 'react';
import { Pressable, View, Text, Image } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { rowItemStyle } from './SettingsRowItem.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import type { SettingsItemConfig } from './SettingsRowItem.config';
import { useTranslation } from 'react-i18next';

interface SettingsRowItemProps {
  item: SettingsItemConfig;
  showDivider?: boolean;
  onPress?: (item: SettingsItemConfig) => void;
}

export const SettingsRowItem: React.FC<SettingsRowItemProps> = ({
  item,
  showDivider = false,
  onPress,
}) => {
  const theme = useColorTheme();
  const { t } = useTranslation();

  const styles = useMemo(() => rowItemStyle(theme), [theme]);
  const label = item.labelKey ? t(item.labelKey) : item.label;
  const description = item.descriptionKey ? t(item.descriptionKey) : item.description;
  const iconColor = item.destructive
    ? (styles.iconDestructive.color as string)
    : (styles.icon.color as string);
  const chevronColor = item.destructive
    ? (styles.chevronDestructive.color as string)
    : (styles.chevron.color as string);

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.rowPressed,
        showDivider && styles.rowBorder,
      ]}
    >
      <View style={styles.iconContainer}>
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={styles.profileImage} />
        ) : item.icon ? (
          <item.icon size={20} color={iconColor} />
        ) : null}
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.label, item.destructive && styles.labelDestructive]}>{label}</Text>
        {description ? (
          <Text style={[styles.description, item.destructive && styles.descriptionDestructive]}>
            {description}
          </Text>
        ) : null}
      </View>

      {item.rightContent ? <View style={styles.rightContent}>{item.rightContent}</View> : null}
      {item.showChevron === false ? null : <ChevronRight size={20} color={chevronColor} />}
    </Pressable>
  );
};
