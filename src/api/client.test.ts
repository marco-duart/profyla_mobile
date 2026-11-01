import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { AxiosError } from "axios";
import { api, http, setUnauthorizedHandler } from "./client";
import { ApiError, toApiError } from "./errors";
import { MutationQueue } from "./MutationQueue";
import { session } from "./session";

const first = { accessToken: "token-1", client: "c1", uid: "ana@example.com", tokenType: "Bearer" };

function reply(config: InternalAxiosRequestConfig, data: unknown, headers: Record<string, string> = {}, status = 200): AxiosResponse {
  return { data, status, statusText: "OK", headers, config };
}

describe("MutationQueue", () => {
  it("libera uma requisição por vez, na ordem de chegada", async () => {
    const queue = new MutationQueue();
    const order: string[] = [];

    const a = queue.acquire().then((release) => {
      order.push("a:start");
      return new Promise<void>((resolve) => setTimeout(() => { order.push("a:end"); release(); resolve(); }, 20));
    });
    const b = queue.acquire().then((release) => {
      order.push("b:start");
      release();
    });
    await Promise.all([a, b]);

    expect(order).toEqual(["a:start", "a:end", "b:start"]);
  });
});

describe("cliente HTTP", () => {
  const seen: { method?: string; url?: string; token?: string }[] = [];
  let adapter: jest.Mock;

  beforeEach(async () => {
    seen.length = 0;
    await session.set(first);
    adapter = jest.fn();
    http.defaults.adapter = adapter as unknown as AxiosAdapter;
    setUnauthorizedHandler(null);
  });

  it("anexa os headers da sessão e grava o token que o servidor trocou", async () => {
    adapter.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      seen.push({ url: config.url, token: String(config.headers.get("access-token")) });
      return reply(config, { ok: true }, { "access-token": "token-2", client: "c1", uid: first.uid, "token-type": "Bearer", expiry: "999" });
    });

    await api.get("/api/account");

    expect(seen[0].token).toBe("token-1");
    expect(session.get()).toMatchObject({ accessToken: "token-2", expiry: "999" });
  });

  it("não grava token numa resposta sem token nem cria sessão a partir de uma resposta sem sessão", async () => {
    adapter.mockImplementation(async (config: InternalAxiosRequestConfig) => reply(config, {}));
    await api.get("/api/account");
    expect(session.get()?.accessToken).toBe("token-1");

    await session.clear();
    adapter.mockImplementation(async (config: InternalAxiosRequestConfig) => reply(config, {}, { "access-token": "x", client: "y", uid: "z" }));
    await api.get("/api/legal/terms");
    expect(session.get()).toBeNull();
  });

  it("mutações paralelas saem em fila: a segunda já usa o token trocado pela primeira", async () => {
    let call = 0;
    adapter.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      call += 1;
      seen.push({ method: config.method, url: config.url, token: String(config.headers.get("access-token")) });
      await new Promise((resolve) => setTimeout(resolve, 15));
      return reply(config, { n: call }, { "access-token": `token-${call + 1}`, client: "c1", uid: first.uid });
    });

    await Promise.all([api.post("/api/candidates/application", { a: 1 }), api.post("/api/candidates/application", { a: 2 })]);

    expect(seen.map((s) => s.token)).toEqual(["token-1", "token-2"]);
    expect(session.get()?.accessToken).toBe("token-3");
  });

  it("uma mutação que falha libera a fila para a próxima", async () => {
    adapter.mockImplementationOnce(async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError("boom", "ERR_BAD_RESPONSE", config, null, reply(config, { error: { code: "validation_error", message: "Dados inválidos." } }, {}, 422));
    });
    adapter.mockImplementationOnce(async (config: InternalAxiosRequestConfig) => reply(config, { ok: true }));

    const failing = api.post("/api/candidates", {}).catch((error: unknown) => error);
    const next = api.post("/api/candidates", {});

    expect(await failing).toBeInstanceOf(ApiError);
    await expect(next).resolves.toEqual({ ok: true });
  });

  it("401 numa rota comum limpa a sessão e avisa o provedor (volta ao login)", async () => {
    const handler = jest.fn();
    setUnauthorizedHandler(handler);
    adapter.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError("401", "ERR_BAD_REQUEST", config, null, reply(config, { errors: ["Sessão expirada."] }, {}, 401));
    });

    await expect(api.get("/api/account")).rejects.toMatchObject({ code: "unauthorized", status: 401 });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(session.get()).toBeNull();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("401 no login (senha errada) não derruba nada", async () => {
    const handler = jest.fn();
    setUnauthorizedHandler(handler);
    adapter.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError("401", "ERR_BAD_REQUEST", config, null, reply(config, { errors: ["E-mail ou senha inválidos."] }, {}, 401));
    });

    await expect(api.post("/auth/sign_in", {})).rejects.toMatchObject({ message: "E-mail ou senha inválidos." });

    expect(handler).not.toHaveBeenCalled();
    expect(session.get()).not.toBeNull();
  });
});

describe("toApiError", () => {
  it("usa o code e os detalhes do corpo da API", () => {
    const config = {} as InternalAxiosRequestConfig;
    const error = new AxiosError("x", "ERR", config, null, reply(config, { error: { code: "validation_error", message: "Corrija.", details: { "profile.resume": ["muito longo"] } } }, {}, 422));

    expect(toApiError(error)).toMatchObject({ code: "validation_error", message: "Corrija.", status: 422, details: { "profile.resume": ["muito longo"] } });
  });

  it("entende o formato do devise (errors: [...]) e o texto simples", () => {
    const config = {} as InternalAxiosRequestConfig;
    expect(toApiError(new AxiosError("x", "ERR", config, null, reply(config, { errors: ["a", "b"] }, {}, 422))).message).toBe("a b");
    expect(toApiError(new AxiosError("x", "ERR", config, null, reply(config, { error: "Texto." }, {}, 400))).message).toBe("Texto.");
  });

  it("sem resposta vira network; estouro de tempo vira timeout", () => {
    expect(toApiError(new AxiosError("Network Error", "ERR_NETWORK")).code).toBe("network");
    expect(toApiError(new AxiosError("timeout", "ECONNABORTED")).code).toBe("timeout");
  });
});
