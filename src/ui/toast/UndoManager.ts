import { UNDO_MS } from "@/gestures/config";

export type UndoableAction = {
  message: string;
  /** Desfaz a parte local (ex.: devolve o card ao feed). Só roda se o usuário tocar em "Desfazer". */
  revert: () => void;
  /** Efeito real (chamada à API). Só roda quando o prazo acaba, ou antes, se o app vai para segundo plano. */
  commit: () => void | Promise<void>;
  durationMs?: number;
};

type Pending = { action: UndoableAction; timer: ReturnType<typeof setTimeout> };

/**
 * Ações reversíveis acontecem na hora na tela e só vão ao servidor depois do prazo (D-M08).
 * Uma ação pendente por vez: ao começar outra, a anterior é confirmada na hora.
 */
export class UndoManager {
  private pending: Pending | null = null;
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getMessage = (): string | null => this.pending?.action.message ?? null;

  run(action: UndoableAction): void {
    this.flush();
    const timer = setTimeout(() => this.settle(), action.durationMs ?? UNDO_MS);
    this.pending = { action, timer };
    this.notify();
  }

  /** O usuário tocou em "Desfazer": nada vai ao servidor. */
  undo(): boolean {
    if (!this.pending) return false;
    const { action, timer } = this.pending;
    clearTimeout(timer);
    this.pending = null;
    action.revert();
    this.notify();
    return true;
  }

  /** Confirma a ação pendente agora (novo gesto, app indo para segundo plano, logout). */
  flush(): void {
    if (!this.pending) return;
    clearTimeout(this.pending.timer);
    this.settle();
  }

  /** Descarta sem confirmar nem desfazer (ex.: troca de usuário). */
  clear(): void {
    if (!this.pending) return;
    clearTimeout(this.pending.timer);
    this.pending = null;
    this.notify();
  }

  private settle(): void {
    const current = this.pending;
    if (!current) return;
    this.pending = null;
    this.notify();
    try {
      void Promise.resolve(current.action.commit()).catch(() => undefined);
    } catch {
      // Uma falha ao confirmar não pode derrubar o app; quem chamou trata o erro dentro do próprio commit.
    }
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }
}
