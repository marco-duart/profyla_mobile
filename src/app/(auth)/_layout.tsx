import { Stack } from "expo-router";
import { SignUpProvider } from "@/features/auth/SignUpContext";
import { colors } from "@/ui/tokens";

export default function AuthLayout() {
  return (
    <SignUpProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }} />
    </SignUpProvider>
  );
}
