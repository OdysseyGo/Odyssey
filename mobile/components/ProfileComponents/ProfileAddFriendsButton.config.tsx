export type ProfileAddFriendsButtonProps = {
  onPress?: () => void;
  isFriend?: boolean;
  isLoading?: boolean;
};

export const exampleProfileAddFriendsButton: ProfileAddFriendsButtonProps = {
  onPress: () => console.log('Add friend clicked'),
  isFriend: false,
  isLoading: false,
};
