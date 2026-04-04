// 🌅 Sunset Adventure Palette - Premium, Exciting, Wanderlust
// Inspired by award-winning travel apps (Airbnb, Hopper, Wanderlog)

const primaryLight = '#FF6B6B'; // Living Coral - Pantone Color of the Year inspired
const primaryDark = '#FF8E72'; // Soft coral for dark mode visibility

const secondaryLight = '#4ECDC4'; // Tropical Teal - adventure & exploration
const secondaryDark = '#72F2EB'; // Bright teal for dark mode

const black = '#1A1A2E'; // Rich navy-black (depth & sophistication)
const white = '#FEFEFE'; // Pure white with warmth

const foregroundSecondaryLight = '#ecececff'; // Soft gray
const foregroundSecondaryDark = '#252542'; // Deep purple-navy

const grayLight = '#FAFAFA'; // Clean light background
const grayDark = '#16162A'; // Deep space navy

const blackPale = 'rgba(26, 26, 46, 0.65)';
const overlayDark = 'rgba(0, 0, 0, 0.55)';
const overlayLightColor = 'rgba(255, 255, 255, 0.5)';

const textGrayLight = '#4A4A68'; // Muted purple-gray for readability
const textGrayDark = '#B8B8D1'; // Light purple-gray

const pressLight = '#FFE5E5'; // Coral tint on press
const pressDark = '#2D2D4A'; // Pressed state dark

const errorRed = '#FF4757'; // Vibrant but not harsh

const gray666 = '#6C6C8A'; // Muted purple-gray
const gray888 = '#9090A7'; // Medium gray
const gray999 = '#B8B8CA'; // Light gray
const gray333 = '#3D3D5C'; // Dark gray

const yellow = '#FFD93D'; // Warm golden yellow - sunshine vibes

const easy = '#2ECC71'; // Fresh mint green
const medium = '#F39C12'; // Warm amber
const hard = '#E74C3C'; // Bold red

const correctOptionBackground = '#2ECC71';

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
    tabIconDefault: '#B8B8CA',
    tabIconSelected: primaryLight,
    textBackground: white,
    placeholderTextColor: '#9090A7',
    border: black,
    borderLight: '#0000001a',
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
  },
  dark: {
    white: white,
    text: white,
    subText: textGrayDark,
    background: black,
    backgroundBlack: blackPale,
    foreground: grayDark,
    foregroundSecondary: foregroundSecondaryDark,
    press: pressDark,
    primary: primaryDark,
    secondary: secondaryDark,
    textBackground: white,
    placeholderTextColor: '#6C6C8A',
    tabIconDefault: '#6C6C8A',
    tabIconSelected: primaryDark,
    borderLight: '#ffffff1a',
    border: white,
    error: errorRed,
    icon: gray666,
    iconDisabled: gray999,
    iconActive: gray333,
    placeholder: gray888,
    textShadowColor: 'rgba(255, 255, 255, 0.4)',
    star: yellow,
    easy: easy,
    medium: medium,
    hard: hard,
    correctOptionBackground: correctOptionBackground,
    overlay: overlayDark,
    overlayLight: overlayLightColor,
  },
};

// Adventure marker palette - Vibrant & Memorable
export const markerColors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#A29BFE', '#6C5CE7', '#00CEC9'];

export default Colors;
export type ThemeName = keyof typeof Colors;
