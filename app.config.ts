import type { ExpoConfig } from "expo/config";

const BACKGROUND = "#0a0c12";

const config: ExpoConfig = {
  name: "Profyla",
  slug: "profyla-mobile",
  scheme: "profyla",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "dark",
  backgroundColor: BACKGROUND,
  ios: {
    bundleIdentifier: "com.profyla.app",
    supportsTablet: false,
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  android: {
    package: "com.profyla.app",
    adaptiveIcon: {
      backgroundColor: BACKGROUND,
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: { output: "single", favicon: "./assets/images/favicon.png" },
  plugins: [
    "expo-router",
    ["expo-splash-screen", { backgroundColor: BACKGROUND, image: "./assets/images/splash-icon.png", imageWidth: 180 }],
    ["expo-secure-store", { faceIDPermission: "O Profyla usa a biometria para liberar a sua sessão neste aparelho." }],
    [
      "expo-image-picker",
      {
        photosPermission: "O Profyla acessa suas fotos para você escolher a foto do perfil.",
        cameraPermission: "O Profyla usa a câmera para tirar a foto do perfil.",
        microphonePermission: false,
      },
    ],
    ["expo-calendar", { calendarPermission: "O Profyla adiciona suas entrevistas ao calendário do aparelho." }],
    ["expo-location", { locationWhenInUsePermission: "O Profyla usa sua localização só para sugerir a sua cidade." }],
    "@react-native-community/datetimepicker",
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
  extra: { eas: { projectId: "55950dc2-0611-4bd7-8c7f-0d44b07e9041" } },
};

export default config;
