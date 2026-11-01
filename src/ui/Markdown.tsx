import { StyleSheet, View } from "react-native";
import { parseMarkdown } from "@/lib/markdown";
import { Text } from "./Text";
import { colors, space } from "./tokens";

/** Termos, política e aviso dos testes (Markdown simples escrito pelo próprio Profyla). */
export function Markdown({ source }: { source: string }) {
  return (
    <View style={styles.wrap}>
      {parseMarkdown(source).map((block, index) => {
        if (block.type === "heading") {
          return <Text key={index} variant={block.level === 1 ? "title" : "heading"} accessibilityRole="header">{block.text}</Text>;
        }
        if (block.type === "quote") {
          return (
            <View key={index} style={styles.quote}>
              <Text tone="warning">{block.text}</Text>
            </View>
          );
        }
        if (block.type === "list") {
          return (
            <View key={index} style={styles.list}>
              {block.items.map((item) => (
                <Text key={item} tone="textMuted">• {item}</Text>
              ))}
            </View>
          );
        }
        return <Text key={index} tone="textMuted">{block.text}</Text>;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[3] },
  quote: { borderLeftWidth: 3, borderLeftColor: colors.warning, paddingLeft: space[3] },
  list: { gap: space[1], paddingLeft: space[2] },
});
