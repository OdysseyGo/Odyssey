const primaryLight = '#50AA82';
const primaryDark = '#ff6a00ff';

const secondaryLight = '#03dac6';
const secondaryDark = '#452d2dff';

const black = '#000000';
const white = '#ffffff';

const foregroundSecondaryLight = '#e0e0e0';
const foregroundSecondaryDark = '#222222';

const grayLight = '#f6f6f6';
const grayDark = '#121212';

const blackPale = 'rgba(0, 0, 0, 0.6)';

const textGrayLight = '#2c2c2cff';
const textGrayDark = '#d3d3d3ff';

const pressLight = '#c7c7c7ff';
const pressDark = '#343333ff';

const successGreen = '#4CAF50';
const errorRed = '#F44336';

const gray666 = '#666666';
const gray888 = '#888888';
const gray999 = '#999999';
const gray333 = '#333333';

const yellow = '#FFD700';

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
    tabIconDefault: '#f60101ff',
    tabIconSelected: primaryLight,
    textBackground: white,
    placeholderTextColor: '#a9a9a9',
    border: black,
    success: successGreen,
    error: errorRed,
    icon: gray666,
    iconDisabled: gray999,
    iconActive: gray333,
    placeholder: gray888,
    textShadowColor: 'rgba(0,0,0,0.4)',
    star: yellow,
    easy: '#4CAF50',
    medium: '#FF9800',
    hard: '#F44336',
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
    placeholderTextColor: '#6e6e6eff',
    tabIconDefault: '#f70000ff',
    tabIconSelected: primaryLight,
    border: black,
    success: successGreen,
    error: errorRed,
    icon: gray666,
    iconDisabled: gray999,
    iconActive: gray333,
    placeholder: gray888,
    textShadowColor: 'rgba(255, 255, 255, 0.4)',
    star: yellow,
    easy: '#4CAF50',
    medium: '#FF9800',
    hard: '#F44336',
  },
};

export const markerColors = ['#FF6B6B', '#4ECDC4', '#FFB347', '#95E1D3', '#F38181', '#AA96DA'];

export default Colors;
export type ThemeName = keyof typeof Colors;
