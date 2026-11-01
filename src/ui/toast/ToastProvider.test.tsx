import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastProvider, useToast } from "./ToastProvider";

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

function Trigger({ commit, revert }: { commit: () => void; revert: () => void }) {
  const toast = useToast();
  return (
    <Pressable accessibilityLabel="disparar" onPress={() => toast.undoable({ message: "Candidatando-se", commit, revert })}>
      <Text>go</Text>
    </Pressable>
  );
}

async function setup() {
  const commit = jest.fn();
  const revert = jest.fn();
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ToastProvider>
        <Trigger commit={commit} revert={revert} />
      </ToastProvider>
    </SafeAreaProvider>,
  );
  await fireEvent.press(screen.getByLabelText("disparar"));
  return { commit, revert };
}

describe("ToastProvider · desfazer", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("só confirma a ação depois dos 5 segundos", async () => {
    const { commit, revert } = await setup();
    expect(screen.getByText("Candidatando-se")).toBeTruthy();
    await act(async () => void jest.advanceTimersByTime(4900));
    expect(commit).not.toHaveBeenCalled();
    await act(async () => void jest.advanceTimersByTime(200));
    expect(commit).toHaveBeenCalledTimes(1);
    expect(revert).not.toHaveBeenCalled();
  });

  it("Desfazer devolve o estado e nada vai ao servidor", async () => {
    const { commit, revert } = await setup();
    await fireEvent.press(screen.getByLabelText("Desfazer"));
    expect(revert).toHaveBeenCalledTimes(1);
    await act(async () => void jest.advanceTimersByTime(6000));
    expect(commit).not.toHaveBeenCalled();
  });
});
