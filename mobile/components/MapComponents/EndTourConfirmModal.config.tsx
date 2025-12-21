export interface EndTourConfirmModalProps {
  visible: boolean;
  earnedXP: number;
  completedSteps: number;
  totalSteps: number;
  onConfirm: () => void;
  onCancel: () => void;
}
