/**
 * Serializa as requisições que alteram dados. O devise_token_auth pode trocar o access-token a cada resposta:
 * uma mutação só sai depois que a anterior terminou (e gravou o token novo), senão usaria um token já trocado.
 */
export class MutationQueue {
  private tail: Promise<void> = Promise.resolve();

  /** Resolve quando é a vez desta requisição; devolve a função que libera a próxima. */
  acquire(): Promise<() => void> {
    let release!: () => void;
    const mine = new Promise<void>((resolve) => {
      release = resolve;
    });
    const previous = this.tail;
    this.tail = previous.then(() => mine);
    return previous.then(() => release);
  }
}
