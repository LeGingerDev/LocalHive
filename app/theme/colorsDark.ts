const palette = {
  neutral900: "#FFFFFF",
  neutral800: "#F0F2FA",
  neutral700: "#D0D5E0",
  neutral600: "#A0A8C0",
  neutral500: "#717790",
  neutral400: "#4A4E66",
  neutral300: "#2D2E40",
  neutral200: "#1A1B2E",
  neutral100: "#0D0E1C",

  primary600: "#E6ECFF",
  primary500: "#C4D1FF",
  primary400: "#9AADFF",
  primary300: "#7727c3",
  primary200: "#5F2F9F",
  primary100: "#003161",

  secondary500: "#E6F0FF",
  secondary400: "#CCE0FF",
  secondary300: "#99C0FF",
  secondary200: "#6699FF",
  secondary100: "#3366FF",

  accent500: "#FFF8E6",
  accent400: "#FFEDB8",
  accent300: "#FFE08A",
  accent200: "#FFD45C",
  accent100: "#F0C83E",

  angry100: "#3F0000",
  angry500: "#FF6B6B",

  overlay20: "rgba(13, 14, 28, 0.2)",
  overlay50: "rgba(13, 14, 28, 0.5)",
} as const

export const colors = {
  palette,
  transparent: "rgba(0, 0, 0, 0)",
  text: palette.neutral800,
  textDim: palette.neutral600,
  background: palette.neutral200,
  border: palette.neutral400,
  tint: palette.primary500,
  tintInactive: palette.neutral500,
  separator: palette.neutral400,
  error: palette.angry500,
  errorBackground: palette.angry100,
  success: "#39E54E",
  link: palette.secondary300,
  cta: palette.accent300,
  cardColor: palette.neutral100,
  sectionBorderColor: palette.neutral400,
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
} as const
