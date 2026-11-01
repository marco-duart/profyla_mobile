import { TIME_SLOTS, isFuture, toSuggestedDateTime } from "./reschedule";

describe("reagendamento", () => {
  it("monta o ISO a partir da data e do horário escolhidos (no fuso do aparelho)", () => {
    const iso = toSuggestedDateTime("2026-11-12", "14:00");
    const date = new Date(iso);
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes()]).toEqual([2026, 10, 12, 14, 0]);
  });

  it("só aceita sugestão no futuro", () => {
    const now = new Date(2026, 10, 12, 14, 30);
    expect(isFuture("2026-11-12", "14:00", now)).toBe(false);
    expect(isFuture("2026-11-12", "15:00", now)).toBe(true);
    expect(isFuture("2026-11-13", "08:00", now)).toBe(true);
  });

  it("oferece horários comerciais em ordem", () => {
    expect([...TIME_SLOTS].sort()).toEqual(TIME_SLOTS);
    expect(TIME_SLOTS).toContain("14:00");
  });
});
