const primaryLight = '#50AA82';
const primaryDark = '#FF9EC7';

const secondaryLight = '#03dac6';
const secondaryDark = '#A3C7FF';

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
    textBackground: white,
    placeholderTextColor: '#a9a9a9',
    tabIconDefault: '#f60101ff',
    tabIconSelected: primaryLight,
    border: black,
    textShadowColor: 'rgba(0,0,0,0.4)',
    error: '#ff4d4f',
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
    textBackground: white,
    primary: primaryDark,
    secondary: secondaryDark,
    placeholderTextColor: '#6e6e6eff',
    tabIconDefault: '#f70000ff',
    tabIconSelected: primaryLight,
    border: white,
    textShadowColor: 'rgba(255, 255, 255, 0.4)',
    error: '#ff4d4f',
    star: yellow,
    easy: '#4CAF50',
    medium: '#FF9800',
    hard: '#F44336',
  },
};
export default Colors;
export type ThemeName = keyof typeof Colors;
