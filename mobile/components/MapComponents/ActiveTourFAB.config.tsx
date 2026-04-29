export interface ActiveTourFABProps {
  tourTitle: string;
  currentStep: number;
  totalSteps: number;
  onPress: () => void;
}
