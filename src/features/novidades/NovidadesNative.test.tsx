import { fireEvent, render, screen } from "@testing-library/react-native";
import { NovidadeCard, NovidadesCarousel, type NovidadesPalette } from "./NovidadesNative";
import type { Novidade } from "./novidades";

// O primeiro render carrega expo-image e expo-web-browser: com os outros arquivos de teste rodando juntos passa de 5 s.
jest.setTimeout(30_000);

const palette: NovidadesPalette = {
  surface: "#111",
  border: "#222",
  text: "#fff",
  textMuted: "#aaa",
  primary: "#6a47f5",
  onPrimary: "#fff",
  badgeBackground: "#333",
  badgeText: "#eee",
};

const promo: Novidade = {
  id: "a1",
  slug: "promo-dita",
  kind: "SYSTEM_PROMO",
  title: "Atenda no WhatsApp com o Dita",
  subtitle: "IA de atendimento",
  bodyMd: "Responde clientes e **chama você** quando precisa.",
  cta: { label: "Conhecer o Dita", url: "https://dita.app.br" },
};

describe("NovidadeCard", () => {
  it("mostra selo, título, subtítulo e texto, e o botão devolve a novidade e o link", async () => {
    const onCtaPress = jest.fn();
    await render(<NovidadeCard novidade={promo} palette={palette} onCtaPress={onCtaPress} />);

    expect(screen.getByText("Da Maaxis")).toBeTruthy();
    expect(screen.getByText("Atenda no WhatsApp com o Dita")).toBeTruthy();
    expect(screen.getByText("IA de atendimento")).toBeTruthy();
    expect(screen.getByText("chama você")).toBeTruthy();

    await fireEvent.press(screen.getByRole("link", { name: "Conhecer o Dita" }));
    expect(onCtaPress).toHaveBeenCalledWith(promo, "https://dita.app.br");
  });

  it("link com esquema perigoso não vira botão", async () => {
    await render(<NovidadeCard novidade={{ ...promo, cta: { label: "Clique", url: "javascript:alert(1)" } }} palette={palette} onCtaPress={jest.fn()} />);

    expect(screen.queryByText("Clique")).toBeNull();
  });

  it("no modo compacto não mostra o corpo do texto", async () => {
    await render(<NovidadeCard novidade={promo} palette={palette} onCtaPress={jest.fn()} compact />);

    expect(screen.getByText("Atenda no WhatsApp com o Dita")).toBeTruthy();
    expect(screen.queryByText("chama você")).toBeNull();
  });
});

describe("NovidadesCarousel", () => {
  it("sem novidade não renderiza nada, nem título nem espaço", async () => {
    const { toJSON } = await render(<NovidadesCarousel items={[]} palette={palette} onImpression={jest.fn()} onCtaPress={jest.fn()} />);

    expect(toJSON()).toBeNull();
  });

  it("com novidades mostra o título e o 'Ver todas'", async () => {
    const onSeeAll = jest.fn();
    await render(<NovidadesCarousel items={[promo]} palette={palette} onImpression={jest.fn()} onCtaPress={jest.fn()} onSeeAll={onSeeAll} compact />);

    expect(screen.getByText("Novidades")).toBeTruthy();
    await fireEvent.press(screen.getByText("Ver todas"));
    expect(onSeeAll).toHaveBeenCalled();
  });
});
