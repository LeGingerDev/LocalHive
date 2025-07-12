const palette = {
  neutral100: "#FFFFFF",
  neutral200: "#F8F9FC",
  neutral300: "#E6E8F0",
  neutral400: "#D0D5E0",
  neutral500: "#A0A8C0",
  neutral600: "#717790",
  neutral700: "#4A4E66",
  neutral800: "#2D2E40",
  neutral900: "#1A1B2E",

  primary100: "#E6ECFF",
  primary200: "#C4D1FF",
  primary300: "#9AADFF",
  primary400: "#7727c3",
  primary500: "#5F2F9F",
  primary600: "#003161",

  secondary100: "#E6F0FF",
  secondary200: "#CCE0FF",
  secondary300: "#99C0FF",
  secondary400: "#6699FF",
  secondary500: "#3366FF",
  secondary600: "#2952CC",

  accent100: "#FFF8E6",
  accent200: "#FFEDB8",
  accent300: "#FFE08A",
  accent400: "#FFD45C",
  accent500: "#F0C83E",
  accent600: "#D9B52A",

  orange100: "#FFF4E6",
  orange200: "#FFE4B3",
  orange300: "#FFD180",
  orange400: "#FFB84D",
  orange500: "#FF9F1A",
  orange600: "#E68500",

  angry100: "#FFF0F0",
  angry500: "#FF4D4D",

  overlay20: "rgba(29, 30, 46, 0.2)",
  overlay50: "rgba(29, 30, 46, 0.5)",
} as const

export const colors = {
  /**
   * The palette is available to use, but prefer using the name.
   * This is only included for rare, one-off cases. Try to use
   * semantic names as much as possible.
   */
  palette,
  /**
   * A helper for making something see-thru.
   */
  transparent: "rgba(0, 0, 0, 0)",
  /**
   * The default text color in many components.
   */
  text: palette.neutral800,
  /**
   * Secondary text information.
   */
  textDim: palette.neutral600,
  /**
   * The default color of the screen background.
   */
  background: palette.neutral100,
  /**
   * The default border color.
   */
  border: palette.neutral300,
  /**
   * The main tinting color.
   */
  tint: palette.primary500,
  /**
   * The inactive tinting color.
   */
  tintInactive: palette.neutral300,
  /**
   * A subtle color used for lines.
   */
  separator: palette.neutral300,
  /**
   * Error messages.
   */
  error: palette.angry500,
  /**
   * Error Background.
   */
  errorBackground: palette.angry100,
  /**
   * Success messages and icons.
   */
  success: "#28CD41",
  /**
   * Links and actions.
   */
  link: palette.secondary500,
  /**
   * Call to action buttons and highlights.
   */
  cta: palette.accent500,
  /**
   * Gradient colors for primary theme
   */
  gradientPrimary: ["#7727c3", "#003161"],
  /**
   * Gradient colors for secondary theme
   */
  gradientSecondary: ["#6699FF", "#2952CC"],
  /**
   * Gradient colors for accent theme
   */
  gradientAccent: ["#FFD45C", "#D9B52A"],
  /**
   * Gradient colors for orange theme
   */
  gradientOrange: ["#FF9F1A", "#E68500"],
  cardColor: palette.primary100,
  sectionBorderColor: palette.neutral300,
  headerBackground: palette.neutral300,
} as const
