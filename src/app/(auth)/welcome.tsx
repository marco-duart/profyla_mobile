import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { t } from "@/i18n/pt-BR";
import { Button } from "@/ui/Button";
import { Screen } from "@/ui/Screen";
import { Text } from "@/ui/Text";
import { space } from "@/ui/tokens";

export default function Welcome() {
  const router = useRouter();
  return (
    <Screen
      scroll={false}
      footer={
        <>
          <Button label={t.auth.create} onPress={() => router.push("/sign-up/name")} fullWidth />
          <Button label={t.auth.haveAccount} variant="secondary" onPress={() => router.push("/sign-in")} fullWidth />
        </>
      }
    >
      <View style={styles.hero}>
        <Image source={require("../../../assets/images/splash-icon.png")} style={styles.logo} contentFit="contain" accessibilityLabel="Profyla" />
        <Text variant="title" center>{t.auth.tagline}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, alignItems: "center", justifyContent: "center", gap: space[6] },
  logo: { width: 220, height: 220 },
});
