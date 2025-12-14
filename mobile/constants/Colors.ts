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
    tabIconDefault: '#f60101ff',
    tabIconSelected: primaryLight,
    border: black,
    success: successGreen,
    error: errorRed,
    icon: gray666,
    iconDisabled: gray999,
    iconActive: gray333,
    placeholder: gray888,
  },
  dark: {
    text: white,
    subText: textGrayDark,
    background: black,
    foreground: grayDark,
    foregroundSecondary: foregroundSecondaryDark,
    press: pressDark,
    primary: primaryDark,
    secondary: secondaryDark,
    tabIconDefault: '#f70000ff',
    tabIconSelected: primaryLight,
    border: black,
    success: successGreen,
    error: errorRed,
    icon: gray666,
    iconDisabled: gray999,
    iconActive: gray333,
    placeholder: gray888,
  },
};

export const markerColors = ['#FF6B6B', '#4ECDC4', '#FFB347', '#95E1D3', '#F38181', '#AA96DA'];

export default Colors;
export type ThemeName = keyof typeof Colors;
