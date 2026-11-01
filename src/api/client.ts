import axios, { type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { API_URL, REQUEST_TIMEOUT_MS } from "@/config/env";
import { toApiError } from "./errors";
import { MutationQueue } from "./MutationQueue";
import { session, type AuthHeaders } from "./session";

type QueuedConfig = InternalAxiosRequestConfig & { __release?: () => void };

export const http = axios.create({ baseURL: API_URL, timeout: REQUEST_TIMEOUT_MS, headers: { Accept: "application/json" } });
const queue = new MutationQueue();

let onUnauthorized: (() => void) | null = null;
/** O provedor de sessão registra aqui o que fazer quando o servidor recusa o token (volta ao login). */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

const isMutation = (method?: string) => !["get", "head", "options"].includes((method ?? "get").toLowerCase());
const isAuthEndpoint = (url?: string) => Boolean(url && /\/auth\/(sign_in|password|confirmation|unlock)/.test(url)) || url === "/auth";

function readHeader(headers: AxiosResponse["headers"], key: string): string | undefined {
  const value = (headers as Record<string, unknown>)[key] ?? (headers as Record<string, unknown>)[key.toLowerCase()];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** Headers de autenticação de uma resposta (login ou rotação de token), ou null se a resposta não traz token. */
export function authHeadersFrom(headers: AxiosResponse["headers"]): AuthHeaders | null {
  const accessToken = readHeader(headers, "access-token");
  const client = readHeader(headers, "client");
  const uid = readHeader(headers, "uid");
  if (!accessToken || !client || !uid) return null;
  return { accessToken, client, uid, tokenType: readHeader(headers, "token-type") ?? "Bearer", expiry: readHeader(headers, "expiry") };
}

http.interceptors.request.use(async (config: QueuedConfig) => {
  // A fila vem antes de ler o token: a mutação anterior pode ter gravado um token novo.
  if (isMutation(config.method)) config.__release = await queue.acquire();
  const headers = session.get();
  if (headers) {
    config.headers.set("access-token", headers.accessToken);
    config.headers.set("client", headers.client);
    config.headers.set("uid", headers.uid);
    config.headers.set("token-type", headers.tokenType);
    if (headers.expiry) config.headers.set("expiry", headers.expiry);
  }
  return config;
});

http.interceptors.response.use(
  async (response) => {
    const rotated = authHeadersFrom(response.headers);
    // A resposta do login grava a sessão pelo fluxo de login; aqui só a rotação de uma sessão existente.
    if (rotated && session.get()) await session.set(rotated);
    (response.config as QueuedConfig).__release?.();
    return response;
  },
  (error: unknown) => {
    const config = (error as { config?: QueuedConfig }).config;
    config?.__release?.();
    const status = (error as { response?: { status?: number } }).response?.status;
    if (status === 401 && session.get() && !isAuthEndpoint(config?.url)) {
      void session.clear().then(() => onUnauthorized?.());
    }
    return Promise.reject(toApiError(error));
  },
);

type Params = Record<string, unknown> | undefined;

export const api = {
  get: async <T>(url: string, params?: Params, config?: AxiosRequestConfig): Promise<T> => (await http.get<T>(url, { params, ...config })).data,
  post: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> => (await http.post<T>(url, body, config)).data,
  put: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> => (await http.put<T>(url, body, config)).data,
  patch: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> => (await http.patch<T>(url, body, config)).data,
  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => (await http.delete<T>(url, config)).data,
};
