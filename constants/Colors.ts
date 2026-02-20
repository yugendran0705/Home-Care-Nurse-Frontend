/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const primaryColorLight = '#007AFF';
const primaryColorDark = '#0A84FF';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: primaryColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: primaryColorLight,
    primary: primaryColorLight,
    authBackground: '#F0F4F8',
    inputBackground: '#FFFFFF',
    inputBorder: '#3a3a3c',
    textSecondary: '#666666',
    buttonDisabled: '#AAB8C2',
    error: '#F87171',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: primaryColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: primaryColorDark,
    primary: primaryColorDark,
    authBackground: '#000000',
    inputBackground: '#1C1C1E',
    inputBorder: '#a0aec0',
    textSecondary: '#A0A0A0',
    buttonDisabled: '#555555',
    error: '#F87171',
  },
};
