import { type ReactNode } from "react";
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from "react-native";
import { type ColorName, colors, fontSizes, fonts, MAX_FONT_SCALE } from "./tokens";

type Variant = "display" | "title" | "heading" | "body" | "bodyStrong" | "label" | "caption";

const variants: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.display, fontSize: fontSizes.xxl, lineHeight: 44, letterSpacing: -0.5 },
  title: { fontFamily: fonts.display, fontSize: fontSizes.xl, lineHeight: 32, letterSpacing: -0.2 },
  heading: { fontFamily: fonts.displaySemi, fontSize: fontSizes.lg, lineHeight: 26 },
  body: { fontFamily: fonts.body, fontSize: fontSizes.md, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.bodySemi, fontSize: fontSizes.md, lineHeight: 24 },
  label: { fontFamily: fonts.bodySemi, fontSize: fontSizes.sm, lineHeight: 20, letterSpacing: 0.4, textTransform: "uppercase" },
  caption: { fontFamily: fonts.body, fontSize: fontSizes.sm, lineHeight: 20 },
};

export type TextProps = RNTextProps & {
  variant?: Variant;
  tone?: ColorName;
  center?: boolean;
  children?: ReactNode;
};

export function Text({ variant = "body", tone = "text", center, style, ...rest }: TextProps) {
  return (
    <RNText
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      {...rest}
      style={[variants[variant], { color: colors[tone] }, center ? { textAlign: "center" } : null, style]}
    />
  );
}
