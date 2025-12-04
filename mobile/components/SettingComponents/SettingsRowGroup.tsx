import React from 'react';
import { View, ViewStyle } from 'react-native';
import { settingsRowGroupStyle } from './SettingsRowGroup.styles';
import { useColorTheme } from '@/utils/useColorTheme';

interface SettingsRowGroupProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const SettingsRowGroup: React.FC<SettingsRowGroupProps> = ({ children, style }) => {
  const theme = useColorTheme();

  const styles = settingsRowGroupStyle(theme);
  const childArray = React.Children.toArray(children);

  return (
    <View style={[styles.container, style]}>
      {childArray.map((child, index) => {
        const isLast = index === childArray.length - 1;

        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<{ showDivider?: boolean }>, {
            showDivider: !isLast,
          });
        }

        return child;
      })}
    </View>
  );
};
