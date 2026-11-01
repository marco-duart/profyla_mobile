module.exports = {
  preset: "jest-expo",
  // Worklets e Reanimated sem módulo nativo: usa as implementações JS (resolver oficial).
  resolver: "react-native-reanimated/jest/resolver.js",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  testPathIgnorePatterns: ["/node_modules/", "/.expo/", "/dist/"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@shopify/flash-list|react-native-worklets|react-native-reanimated|react-native-gesture-handler)",
  ],
};
