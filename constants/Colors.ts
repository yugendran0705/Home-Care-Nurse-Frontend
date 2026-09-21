/**
 * App palette: light surfaces with a deep teal primary.
 *
 * Screens read these through `Colors[useColorScheme()]`. Both schemes resolve
 * to the same values for now, so the app looks the same whatever the device
 * is set to; give `dark` its own values when a real dark theme is wanted.
 */

const palette = {
  // Brand
  teal900: "#064E4D",
  teal700: "#095E5D",
  teal600: "#0E7C7B",
  teal100: "#D7EBEA",
  teal50: "#EEF6F6",

  // Accent, used sparingly: ratings, badges, "primary" address
  amber500: "#F2A541",
  amber100: "#FDF0DC",

  // Neutrals
  slate900: "#0F172A",
  slate600: "#64748B",
  slate400: "#94A3B8",
  slate200: "#E2E8F0",
  slate100: "#F1F5F9",
  slate50: "#F6F8FA",
  white: "#FFFFFF",
};

const theme = {
  // Primary & accent
  primary: palette.teal600,
  primaryDark: palette.teal700,
  primaryDeep: palette.teal900,
  primarySoft: palette.teal100,
  primaryTint: palette.teal50,
  accent: palette.amber500,
  accentSoft: palette.amber100,
  tint: palette.teal600,

  // Backgrounds
  background: palette.slate50,
  // Cards and other raised surfaces
  secondaryBackground: palette.white,
  // Filled buttons and other primary actions
  secondaryBackgroundGradient: palette.teal600,

  // Inputs and quiet fills
  inputBackground: palette.slate100,
  surface: palette.white,
  surfaceMuted: palette.slate100,

  // Lines
  border: palette.slate200,
  borderStrong: palette.slate400,

  // Semantics
  error: "#DC2626",
  errorSoft: "#FEF2F2",
  success: "#0F9D58",
  successSoft: "#E7F5EE",
  warning: "#B45309",
  warningSoft: palette.amber100,

  // Text
  text: palette.slate900,
  textSecondary: palette.slate600,
  textMuted: palette.slate400,
  // On top of primary fills
  textInverted: palette.white,
  textMutedInverted: "rgba(255, 255, 255, 0.78)",

  // Icons
  icon: palette.slate600,
  iconMuted: palette.slate400,
  tabIconSelected: palette.teal600,
  tabIconDefault: palette.slate400,

  cursorColor: palette.teal600,

  // Elevation, spread onto style objects: shadow{Color,Offset,Opacity,Radius}
  shadowColor: "#0F172A",

  // Decorative gradients (headers, splash)
  gradientStart: palette.teal600,
  gradientEnd: palette.teal900,
};

export const Colors = {
  light: theme,
  dark: theme,
};
