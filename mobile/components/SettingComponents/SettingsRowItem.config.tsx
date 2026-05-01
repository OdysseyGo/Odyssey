import { ComponentType } from 'react';
import { ReactNode } from 'react';
import type { LucideProps } from 'lucide-react-native';

export type IconType = ComponentType<LucideProps>;

export interface SettingsItemConfig {
  key: string;
  label: string;
  labelKey?: string;
  description?: string;
  descriptionKey?: string;
  icon?: IconType;
  onPressKey?: string;
  imageUri?: string;
  showChevron?: boolean;
  destructive?: boolean;
  rightContent?: ReactNode;
}
