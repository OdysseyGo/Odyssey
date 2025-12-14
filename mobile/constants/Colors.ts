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

const textGrayLight = '#2c2c2cff';
const textGrayDark = '#d3d3d3ff';

const pressLight = '#c7c7c7ff';
const pressDark = '#343333ff';

const Colors = {
  light: {
    text: black,
    subText: textGrayLight,
    background: white,
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
    borderLight: '#0000001a',
    textShadowColor: 'rgba(0,0,0,0.4)',
    error: '#ff4d4f',
  },
  dark: {
    text: white,
    subText: textGrayDark,
    background: black,
    foreground: grayDark,
    foregroundSecondary: foregroundSecondaryDark,
    press: pressDark,
    textBackground: white,
    primary: primaryDark,
    secondary: secondaryDark,
    placeholderTextColor: '#6e6e6eff',
    tabIconDefault: '#452d2dff',
    tabIconSelected: primaryLight,
    borderLight: '#ffffff1a',
    border: white,
    textShadowColor: 'rgba(255, 255, 255, 0.4)',
    error: '#ff4d4f',
  },
};
export default Colors;
export type ThemeName = keyof typeof Colors;
