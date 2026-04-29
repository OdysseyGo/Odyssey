import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/Spacing';

export const authLanguageSelectorStyles = StyleSheet.create({
  selectorButton: {
    position: 'absolute',
    right: Spacing.lg,
    minWidth: 82,
    height: Spacing.iconButtonSmall,
    borderRadius: Spacing.borderRadiusFull,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  selectorText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  languageOption: {
    minHeight: 52,
    borderRadius: Spacing.borderRadius,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
});
