import { SCALE_LABELS, SCALE_ORDER, crossedSwipeThreshold, decideSwipe, scaleAnswerAt } from "./decide";

const WIDTH = 400;
const HEIGHT = 300;

describe("decideSwipe", () => {
  it("ignora arrasto curto e lento", () => {
    expect(decideSwipe(60, 100, WIDTH)).toBeNull();
    expect(decideSwipe(-60, -100, WIDTH)).toBeNull();
  });

  it("decide pelo limiar de 30% da largura", () => {
    expect(decideSwipe(121, 0, WIDTH)).toBe("right");
    expect(decideSwipe(-121, 0, WIDTH)).toBe("left");
    expect(decideSwipe(119, 0, WIDTH)).toBeNull();
  });

  it("um gesto rápido (acima de 800 px/s) decide mesmo antes do limiar", () => {
    expect(decideSwipe(30, 900, WIDTH)).toBe("right");
    expect(decideSwipe(-30, -900, WIDTH)).toBe("left");
  });

  it("a velocidade só vale se o arrasto vai no mesmo sentido", () => {
    expect(decideSwipe(-20, 900, WIDTH)).toBeNull();
    expect(decideSwipe(20, -900, WIDTH)).toBeNull();
  });

  it("avisa quando o limiar é cruzado, nos dois sentidos", () => {
    expect(crossedSwipeThreshold(100, WIDTH)).toBe(false);
    expect(crossedSwipeThreshold(130, WIDTH)).toBe(true);
    expect(crossedSwipeThreshold(-130, WIDTH)).toBe(true);
  });
});

describe("scaleAnswerAt (escala de 5 respostas)", () => {
  it("fica sem resposta enquanto o card está perto do centro", () => {
    expect(scaleAnswerAt(10, -5, WIDTH, HEIGHT)).toBeNull();
    expect(scaleAnswerAt(60, 0, WIDTH, HEIGHT)).toBeNull();
  });

  it("direita: primeiro limiar é Concordo parcialmente, segundo é Concordo totalmente", () => {
    expect(scaleAnswerAt(90, 0, WIDTH, HEIGHT)).toBe("CP");
    expect(scaleAnswerAt(180, 0, WIDTH, HEIGHT)).toBe("CT");
  });

  it("esquerda: primeiro limiar é Discordo parcialmente, segundo é Discordo totalmente", () => {
    expect(scaleAnswerAt(-90, 0, WIDTH, HEIGHT)).toBe("DP");
    expect(scaleAnswerAt(-180, 0, WIDTH, HEIGHT)).toBe("DT");
  });

  it("para cima responde Neutro, desde que o movimento vertical domine o horizontal", () => {
    expect(scaleAnswerAt(0, -60, WIDTH, HEIGHT)).toBe("N");
    expect(scaleAnswerAt(150, -60, WIDTH, HEIGHT)).toBe("CP");
  });

  it("arrastar para baixo nunca responde", () => {
    expect(scaleAnswerAt(0, 120, WIDTH, HEIGHT)).toBeNull();
  });

  it("os cinco botões cobrem exatamente as cinco respostas, com rótulo em português", () => {
    expect(SCALE_ORDER).toEqual(["DT", "DP", "N", "CP", "CT"]);
    expect(SCALE_ORDER.map((answer) => SCALE_LABELS[answer])).toEqual([
      "Discordo totalmente",
      "Discordo parcialmente",
      "Neutro",
      "Concordo parcialmente",
      "Concordo totalmente",
    ]);
  });
});
