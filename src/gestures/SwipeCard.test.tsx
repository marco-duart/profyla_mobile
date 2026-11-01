import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SwipeCard } from "./SwipeCard";

async function setup(props: Partial<React.ComponentProps<typeof SwipeCard>> = {}) {
  const onSwipeRight = jest.fn();
  const onSwipeLeft = jest.fn();
  const onOpen = jest.fn();
  await render(
    <GestureHandlerRootView>
      <SwipeCard
        accessibilityLabel="Vaga de analista"
        rightLabel="Quero esta vaga"
        leftLabel="Agora não"
        onSwipeRight={onSwipeRight}
        onSwipeLeft={onSwipeLeft}
        onOpen={onOpen}
        {...props}
      >
        <Text>conteúdo</Text>
      </SwipeCard>
    </GestureHandlerRootView>,
  );
  return { onSwipeRight, onSwipeLeft, onOpen };
}

describe("SwipeCard", () => {
  it("expõe cada gesto como ação de acessibilidade", async () => {
    await setup();
    const card = await screen.findByLabelText("Vaga de analista");
    const names = (card.props.accessibilityActions as { name: string; label: string }[]).map(
      (action) => action.label,
    );
    expect(names).toEqual(["Abrir detalhes", "Quero esta vaga", "Agora não"]);
  });

  it("dispara o mesmo efeito do gesto pela ação de acessibilidade", async () => {
    const { onSwipeRight, onSwipeLeft, onOpen } = await setup();
    const card = await screen.findByLabelText("Vaga de analista");
    await fireEvent(card, "accessibilityAction", { nativeEvent: { actionName: "swipeRight" } });
    await fireEvent(card, "accessibilityAction", { nativeEvent: { actionName: "swipeLeft" } });
    await fireEvent(card, "accessibilityAction", { nativeEvent: { actionName: "activate" } });
    expect(onSwipeRight).toHaveBeenCalledTimes(1);
    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("não oferece ação para um lado sem tratador", async () => {
    await setup({ onSwipeLeft: undefined });
    const card = await screen.findByLabelText("Vaga de analista");
    expect(
      (card.props.accessibilityActions as { name: string }[]).map((action) => action.name),
    ).not.toContain("swipeLeft");
  });
});
