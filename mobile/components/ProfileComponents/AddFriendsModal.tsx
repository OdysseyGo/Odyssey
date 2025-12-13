import React, { useRef } from 'react';
import { Modal, Animated, View } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { addFriendsModalStyles } from './AddFriendsModal.styles';
import { AddFriendsModalProps } from './AddFriendsModal.config';
import AddFriendsModalHeader from './AddFriendsModalHeader';
import AddFriendsSearchBar from './AddFriendsSearchBar';
import AddFriendsModalProTip from './AddFriendsModalProTip';
import AddFriendsModalActions from './AddFriendsModalActions';

export default function AddFriendsModal({
  visible,
  onClose,
  searchText,
  onSearchChange,
  searchFocused,
  onSearchFocus,
}: AddFriendsModalProps) {
  const theme = useColorTheme();
  const styles = addFriendsModalStyles(theme);
  const modalScaleAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      modalScaleAnim.setValue(0);
      Animated.spring(modalScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                {
                  scale: modalScaleAnim,
                },
              ],
            },
          ]}
        >
          {/* Header */}
          <AddFriendsModalHeader />

          {/* Content */}
          <View style={styles.contentWrapper}>
            <AddFriendsSearchBar
              searchText={searchText}
              onSearchChange={onSearchChange}
              searchFocused={searchFocused}
              onSearchFocus={onSearchFocus}
            />
            <AddFriendsModalProTip />
            <AddFriendsModalActions onCancel={onClose} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
