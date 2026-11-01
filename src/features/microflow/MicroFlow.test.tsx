import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MicroFlow } from "./MicroFlow";
import type { FieldSpec } from "./types";

jest.mock("expo-router", () => ({
  useRouter: () => ({ canGoBack: () => false, back: jest.fn() }),
  useFocusEffect: (callback: () => void | (() => void)) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("react").useEffect(callback, []);
  },
}));

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

const FIELDS: FieldSpec[] = [
  { key: "name", kind: "text", title: "Qual é o seu nome?", label: "Nome", validate: (value) => (String(value).length < 3 ? "Informe o nome." : null) },
  { key: "employed", kind: "choice", title: "Você está empregado(a)?", options: [{ label: "Sim", value: true }, { label: "Não", value: false }] },
  { key: "end", kind: "text", title: "Quando saiu?", label: "Saída", when: (values) => values.employed === false },
];

async function setup(onComplete = jest.fn().mockResolvedValue(undefined)) {
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <MicroFlow fields={FIELDS} submitLabel="Concluir" onComplete={onComplete} />
    </SafeAreaProvider>,
  );
  return onComplete;
}

describe("MicroFlow", () => {
  it("mostra um campo por tela e barra o avanço com resposta inválida", async () => {
    await setup();
    expect(screen.getByText("Qual é o seu nome?")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Nome"), "Al");
    await fireEvent.press(screen.getByLabelText("Continuar"));
    expect(await screen.findByText("Informe o nome.")).toBeTruthy();
    expect(screen.queryByText("Você está empregado(a)?")).toBeNull();
  });

  it("pula campos que não se aplicam e entrega as respostas ao concluir", async () => {
    const onComplete = await setup();
    await fireEvent.changeText(screen.getByLabelText("Nome"), "Beatriz");
    await fireEvent.press(screen.getByLabelText("Continuar"));
    await fireEvent.press(await screen.findByLabelText("Sim"));
    // "Sim" avança sozinho; sem "Quando saiu?" este é o último passo.
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith({ name: "Beatriz", employed: true }));
  });

  it("mostra o passo extra quando a condição vale", async () => {
    await setup();
    await fireEvent.changeText(screen.getByLabelText("Nome"), "Beatriz");
    await fireEvent.press(screen.getByLabelText("Continuar"));
    await fireEvent.press(await screen.findByLabelText("Não"));
    expect(await screen.findByText("Quando saiu?")).toBeTruthy();
  });
});
