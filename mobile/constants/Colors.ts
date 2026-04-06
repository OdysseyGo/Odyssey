// Odyssey Palette — Explorer's Sky + Warm Amber
// Rich sky-blue primary, golden-amber secondary, clean neutrals.
// Evokes open skies, ocean, adventure maps, and golden-hour travel.

const primaryLight = '#0284C7';   // Rich sky blue — clear expedition skies
const primaryDark  = '#38BDF8';   // Bright sky blue for dark backgrounds

const secondaryLight = '#D97706'; // Warm amber — sunsets, culture, warmth
const secondaryDark  = '#FBBF24'; // Golden amber for dark mode

const black = '#1E293B';          // Deep slate — grounded, map-ink feel
const white = '#F8FAFC';          // Clean near-white — crisp like a fresh page

const foregroundSecondaryLight = '#E2E8F0'; // Soft blue-gray card surface
const foregroundSecondaryDark  = '#1E2D3D'; // Deep ocean-night card surface

const grayLight = '#F1F5F9'; // Light slate — open, airy
const grayDark  = '#0F172A'; // Night sky navy — deep and immersive

const blackPale       = 'rgba(30, 41, 59, 0.65)';
const overlayDark     = 'rgba(0, 0, 0, 0.55)';
const overlayLightColor = 'rgba(248, 250, 252, 0.5)';

const textGrayLight = '#64748B'; // Slate gray — readable, calm
const textGrayDark  = '#94A3B8'; // Soft cool gray

const pressLight = '#E0F2FE'; // Subtle sky-blue tint on press
const pressDark  = '#1E293B'; // Pressed state dark

const errorRed = '#DC2626'; // Clear red — easy to spot on maps/ui

const gray666 = '#64748B';
const gray888 = '#94A3B8';
const gray999 = '#CBD5E1';
const gray333 = '#334155';

const yellow = '#F59E0B'; // Amber gold — star ratings, highlights

const easy   = '#16A34A'; // Forest green — easy trails
const medium = '#D97706'; // Amber — moderate challenge
const hard   = '#DC2626'; // Clear red — difficult

const correctOptionBackground = '#16A34A';

const Colors = {
  light: {
    white: white,
    text: black,
    subText: textGrayLight,
    background: white,
    backgroundBlack: blackPale,
    foreground: grayLight,
    foregroundSecondary: foregroundSecondaryLight,
    press: pressLight,
    primary: primaryLight,
    secondary: secondaryLight,
    tabIconDefault: '#94A3B8',
    tabIconSelected: primaryLight,
    textBackground: white,
    placeholderTextColor: gray888,
    border: black,
    borderLight: 'rgba(30, 41, 59, 0.1)',
    error: errorRed,
    icon: gray666,
    iconDisabled: gray999,
    iconActive: gray333,
    placeholder: gray888,
    textShadowColor: 'rgba(0,0,0,0.4)',
    star: yellow,
    easy: easy,
    medium: medium,
    hard: hard,
    correctOptionBackground: correctOptionBackground,
    overlay: overlayDark,
    overlayLight: overlayLightColor,
    cardSurface: '#FFFFFF',
    primaryMuted: 'rgba(2, 132, 199, 0.07)',
    headerGradientTop: '#0369A1',
    headerGradientBottom: '#0284C7',
  },
  dark: {
    white: white,
    text: '#E2E8F0',
    subText: textGrayDark,
    background: '#0C1A2E',
    backgroundBlack: blackPale,
    foreground: grayDark,
    foregroundSecondary: foregroundSecondaryDark,
    press: pressDark,
    primary: primaryDark,
    secondary: secondaryDark,
    textBackground: white,
    placeholderTextColor: gray666,
    tabIconDefault: gray666,
    tabIconSelected: primaryDark,
    borderLight: 'rgba(226, 232, 240, 0.1)',
    border: '#E2E8F0',
    error: errorRed,
    icon: gray666,
    iconDisabled: gray999,
    iconActive: gray333,
    placeholder: gray888,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    star: yellow,
    easy: easy,
    medium: medium,
    hard: hard,
    correctOptionBackground: correctOptionBackground,
    overlay: overlayDark,
    overlayLight: overlayLightColor,
    cardSurface: grayDark,
    primaryMuted: 'rgba(56, 189, 248, 0.12)',
    headerGradientTop: '#0C1A2E',
    headerGradientBottom: '#1E2D3D',
  },
};

// Adventure marker palette — sky blue, amber, forest, coral, teal, red
export const markerColors = ['#0284C7', '#D97706', '#16A34A', '#38BDF8', '#FBBF24', '#DC2626'];

export default Colors;
export type ThemeName = keyof typeof Colors;
