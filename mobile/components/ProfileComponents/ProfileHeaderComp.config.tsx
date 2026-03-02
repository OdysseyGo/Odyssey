export type ProfileHeaderProps = {
  title?: string;
  subtitle?: string;
  avatarUrl?: string;
  onAvatarPress?: () => void;
};

export const exampleProfileHeader: ProfileHeaderProps = {
  title: 'John Doe',
  subtitle: 'Travel Enthusiast',
};
