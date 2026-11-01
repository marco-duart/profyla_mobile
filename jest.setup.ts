import "react-native-gesture-handler/jestSetup";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: "light" },
  NotificationFeedbackType: { Success: "success", Error: "error" },
}));

jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));

const mockSecureStore = new Map<string, string>();
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn((key: string) => Promise.resolve(mockSecureStore.get(key) ?? null)),
  setItemAsync: jest.fn((key: string, value: string) => {
    mockSecureStore.set(key, value);
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key: string) => {
    mockSecureStore.delete(key);
    return Promise.resolve();
  }),
}));

afterEach(() => mockSecureStore.clear());

// O Gesture Handler pede o runtime de UI do Worklets, que não existe no Jest.
jest.mock("react-native-worklets", () => ({ ...jest.requireActual("react-native-worklets"), getUIRuntimeHolder: () => ({}) }));
