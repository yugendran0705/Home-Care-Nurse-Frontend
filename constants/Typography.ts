/**
 * App typeface: Inter, a UI face designed for screens — open apertures, tall
 * x-height, and numerals that stay legible at small sizes (licence numbers,
 * phone numbers, prices).
 *
 * Use the weight that matches the role rather than reaching for bold
 * everywhere: `regular` for body copy, `medium` for dense rows and field
 * values, `semibold` for section titles and buttons, `bold` for screen titles.
 */
export const Fonts = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
} as const;

export type FontWeightName = keyof typeof Fonts;
