import { UNDO_MS } from "@/gestures/config";
import { UndoManager } from "./UndoManager";

function action(overrides: Partial<{ message: string; revert: () => void; commit: () => void; durationMs: number }> = {}) {
  return { message: "Candidatura enviada", revert: jest.fn(), commit: jest.fn(), ...overrides };
}

describe("UndoManager", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("só chama a API depois do prazo de 5 segundos", () => {
    const manager = new UndoManager();
    const a = action();

    manager.run(a);
    jest.advanceTimersByTime(UNDO_MS - 1);
    expect(a.commit).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(a.commit).toHaveBeenCalledTimes(1);
    expect(a.revert).not.toHaveBeenCalled();
  });

  it("desfazer cancela a chamada e reverte a parte local", () => {
    const manager = new UndoManager();
    const a = action();

    manager.run(a);
    expect(manager.undo()).toBe(true);
    jest.advanceTimersByTime(UNDO_MS * 2);

    expect(a.revert).toHaveBeenCalledTimes(1);
    expect(a.commit).not.toHaveBeenCalled();
  });

  it("desfazer sem nada pendente devolve false", () => {
    expect(new UndoManager().undo()).toBe(false);
  });

  it("uma nova ação confirma a anterior na hora (uma pendente por vez)", () => {
    const manager = new UndoManager();
    const first = action({ message: "primeira" });
    const second = action({ message: "segunda" });

    manager.run(first);
    manager.run(second);

    expect(first.commit).toHaveBeenCalledTimes(1);
    expect(second.commit).not.toHaveBeenCalled();
    expect(manager.getMessage()).toBe("segunda");
  });

  it("flush (app indo para segundo plano) envia na hora e não envia de novo no prazo", () => {
    const manager = new UndoManager();
    const a = action();

    manager.run(a);
    manager.flush();
    jest.advanceTimersByTime(UNDO_MS * 2);

    expect(a.commit).toHaveBeenCalledTimes(1);
    expect(manager.getMessage()).toBeNull();
  });

  it("clear descarta sem confirmar nem desfazer", () => {
    const manager = new UndoManager();
    const a = action();

    manager.run(a);
    manager.clear();
    jest.advanceTimersByTime(UNDO_MS * 2);

    expect(a.commit).not.toHaveBeenCalled();
    expect(a.revert).not.toHaveBeenCalled();
  });

  it("avisa os ouvintes quando a mensagem pendente muda", () => {
    const manager = new UndoManager();
    const listener = jest.fn();
    manager.subscribe(listener);

    manager.run(action());
    manager.undo();

    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("uma falha no commit não quebra o fluxo", async () => {
    const manager = new UndoManager();
    const a = action({ commit: jest.fn(() => { throw new Error("falhou"); }) });

    manager.run(a);
    expect(() => manager.flush()).not.toThrow();
  });
});
