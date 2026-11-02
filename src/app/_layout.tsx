import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold } from "@expo-google-fonts/manrope";
import { Sora_600SemiBold, Sora_700Bold } from "@expo-google-fonts/sora";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useOnline } from "@/hooks/useOnline";
import { ErrorState, OfflineBanner } from "@/ui/States";
import { Screen } from "@/ui/Screen";
import { AppProviders } from "@/features/session/AppProviders";
import { useSession } from "@/features/session/SessionProvider";
import { GateActionsContext, useGate } from "@/features/session/useGate";
import { colors } from "@/ui/tokens";

void SplashScreen.preventAutoHideAsync();

function Navigation() {
  const { status } = useSession();
  const { gate, retry, finishOnboarding, startOnboardingFlag } = useGate();
  const online = useOnline();

  useEffect(() => {
    if (gate !== "loading" && status !== "loading") void SplashScreen.hideAsync();
  }, [gate, status]);

  if (gate === "loading") return null;
  if (gate === "error") {
    return (
      <Screen>
        <ErrorState message="Não foi possível carregar a sua conta. Confira a conexão." onRetry={retry} />
      </Screen>
    );
  }

  return (
    <GateActionsContext.Provider value={{ finishOnboarding, startOnboardingFlag }}>
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas }, animation: "slide_from_right" }}>
      <Stack.Protected guard={gate === "signedOut"}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={gate === "consent"}>
        <Stack.Screen name="(consent)" />
      </Stack.Protected>
      <Stack.Protected guard={gate === "onboarding"}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={gate === "ready"}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="novidades" />
        <Stack.Screen name="import" />
      </Stack.Protected>
      {/* Textos legais abrem em qualquer estado (cadastro, aceite, conta). */}
      <Stack.Screen name="legal/[kind]" options={{ presentation: "modal" }} />
    </Stack>
    {online ? null : <OfflineBanner />}
    </GateActionsContext.Provider>
  );
}

export default function RootLayout() {
  const [loaded, fontError] = useFonts({ Sora_600SemiBold, Sora_700Bold, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold });
  // Sem as fontes a interface continua utilizável (fonte do sistema): não trava o app por isso.
  if (!loaded && !fontError) return null;
  return (
    <AppProviders>
      <StatusBar style="light" />
      <Navigation />
    </AppProviders>
  );
}
