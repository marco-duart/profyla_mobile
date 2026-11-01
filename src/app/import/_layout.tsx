import { Stack } from "expo-router";
import { colors } from "@/ui/tokens";

export default function ImportLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }} />;
}
