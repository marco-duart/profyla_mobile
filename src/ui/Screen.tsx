import { type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type RefreshControlProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, space } from "./tokens";

type Props = {
  children: ReactNode;
  /** Rola o conteúdo (padrão). Desligue para telas com lista própria (FlashList). */
  scroll?: boolean;
  /** Botão principal fixo no rodapé (zona do polegar). */
  footer?: ReactNode;
  padded?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  /** Telas dentro das abas já têm a barra de navegação embaixo: não somar a margem de baixo. */
  insideTabs?: boolean;
  /** Telas de pilha têm cabeçalho: não somar a margem de cima. */
  hasHeader?: boolean;
};

/** Fundo escuro, áreas seguras, teclado e rodapé fixo: base de toda tela do app. */
export function Screen({ children, scroll = true, footer, padded = true, refreshControl, insideTabs, hasHeader }: Props) {
  const insets = useSafeAreaInsets();
  const content = padded ? styles.padded : undefined;
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.root, { paddingTop: hasHeader ? 0 : insets.top }]}>
        {scroll ? (
          <ScrollView
            style={styles.root}
            contentContainerStyle={[content, styles.grow]}
            keyboardShouldPersistTaps="handled"
            refreshControl={refreshControl}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.root, content]}>{children}</View>
        )}
        {footer ? (
          <View style={[styles.footer, { paddingBottom: space[4] + (insideTabs ? 0 : insets.bottom) }]}>{footer}</View>
        ) : insideTabs ? null : (
          <View style={{ height: insets.bottom }} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  padded: { paddingHorizontal: space[5], paddingTop: space[4], paddingBottom: space[6], gap: space[4] },
  grow: { flexGrow: 1 },
  footer: { paddingHorizontal: space[5], paddingTop: space[3], gap: space[3], borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.canvasAlt },
});
