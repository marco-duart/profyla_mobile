// Mesmos nomes e valores do tema web (profyla_front/src/theme/stitches.ts). Cantos retos, glass, violeta + coral.
export const colors = {
  canvas: "#0a0c12",
  canvasAlt: "#12141d",
  surface: "rgba(255, 255, 255, 0.045)",
  surfaceStrong: "rgba(255, 255, 255, 0.08)",
  text: "#f4f6fb",
  textMuted: "#9aa6b8",
  textFaint: "#7c8799",
  brand: "#6a47f5",
  brandStrong: "#5636d8",
  brandSoft: "rgba(106, 71, 245, 0.16)",
  accent: "#ff6a4d",
  accentSoft: "rgba(255, 106, 77, 0.14)",
  border: "rgba(255, 255, 255, 0.12)",
  borderStrong: "rgba(255, 255, 255, 0.22)",
  success: "#2fd480",
  successSubtle: "rgba(47, 212, 128, 0.14)",
  error: "#ff4d6a",
  errorSubtle: "rgba(255, 77, 106, 0.14)",
  warning: "#ffb020",
  warningSubtle: "rgba(255, 176, 32, 0.14)",
  tint: "#ede9ff",
  overlay: "rgba(3, 4, 8, 0.72)",
} as const;

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 } as const;

export const radii = { none: 0, sm: 2, md: 4, lg: 6 } as const;

export const fontSizes = { xs: 12, sm: 14, md: 16, lg: 18, xl: 24, xxl: 36 } as const;

export const fonts = {
  display: "Sora_700Bold",
  displaySemi: "Sora_600SemiBold",
  body: "Manrope_400Regular",
  bodyMedium: "Manrope_500Medium",
  bodySemi: "Manrope_600SemiBold",
  bodyBold: "Manrope_700Bold",
} as const;

/** Toda a UI respeita a fonte do sistema até este limite (1,3×): os layouts precisam aguentar isso. */
export const MAX_FONT_SCALE = 1.3;

/** Área mínima de toque (dp). */
export const MIN_TOUCH = 48;

export type ColorName = keyof typeof colors;
