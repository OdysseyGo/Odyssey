import { StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

const { white } = Colors.light;

export const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: white,
    letterSpacing: -0.3,
  },
  backButton: {
    width: 40,
    alignItems: 'flex-start',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
  },
});

export const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 17,
    fontWeight: '700',
    color: white,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
  },
  fullName: {
    fontSize: 13,
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Spacing.borderRadius,
    borderWidth: 1.5,
    minWidth: 80,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
