import { listNovidades, sendNovidadeEvents } from "@/api/novidades";
import { novidadesService } from "./service";

jest.mock("@/api/novidades", () => ({ listNovidades: jest.fn(), sendNovidadeEvents: jest.fn() }));

const list = listNovidades as jest.Mock;
const send = sendNovidadeEvents as jest.Mock;
const id = "0192f0a1-7c1e-7b8a-9a51-3f1f0f6a2b10";

describe("novidadesService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    send.mockResolvedValue(null);
  });

  it("pede o placement ao backend do Profyla e mantém a ordem do painel", async () => {
    list.mockResolvedValue({ data: [{ id: "a1", title: "Primeira" }, { id: 7 }, { id: "a2", title: "Segunda" }] });

    const items = await novidadesService.list("mobile.home");

    expect(list).toHaveBeenCalledWith("mobile.home");
    expect(items.map((item) => item.title)).toEqual(["Primeira", "Segunda"]);
  });

  it("sem rede ou com erro do backend, devolve lista vazia sem lançar", async () => {
    list.mockRejectedValue(new Error("Network Error"));

    await expect(novidadesService.list("mobile.novidades")).resolves.toEqual([]);
  });

  it("impressão e clique saem em lote, só depois dos 30 segundos do relógio", () => {
    jest.useFakeTimers();
    try {
      novidadesService.impression(id, "mobile.home");
      novidadesService.impression(id, "mobile.home"); // a mesma impressão não conta duas vezes
      novidadesService.click(id, "mobile.home");
      expect(send).not.toHaveBeenCalled();

      jest.advanceTimersByTime(30_000);

      expect(send).toHaveBeenCalledTimes(1);
      expect(send).toHaveBeenCalledWith([
        { announcementId: id, placement: "mobile.home", type: "IMPRESSION" },
        { announcementId: id, placement: "mobile.home", type: "CLICK" },
      ]);
    } finally {
      jest.useRealTimers();
    }
  });
});
