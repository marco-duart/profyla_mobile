import axios from "axios";

type ErrorBody = {
  error?: string | { code?: string; message?: string; details?: Record<string, string[]> };
  errors?: string[] | { full_messages?: string[] };
};

/** Erro normalizado da API: o app decide pelo `code`, nunca pelo texto da mensagem. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number | null;
  readonly details: Record<string, string[]> | null;

  constructor(message: string, code: string, status: number | null = null, details: Record<string, string[]> | null = null) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function messageFromBody(body: ErrorBody | undefined): string | undefined {
  if (!body) return undefined;
  if (typeof body.error === "string") return body.error;
  if (typeof body.error?.message === "string") return body.error.message;
  if (Array.isArray(body.errors)) return body.errors.join(" ");
  if (Array.isArray(body.errors?.full_messages)) return body.errors.full_messages.join(" ");
  return undefined;
}

export function toApiError(error: unknown, fallback = "Não foi possível concluir a operação."): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return error.code === "ECONNABORTED"
        ? new ApiError("O servidor demorou para responder. Tente de novo.", "timeout")
        : new ApiError("Sem conexão com o servidor. Confira a internet e tente de novo.", "network");
    }
    const body = error.response.data as ErrorBody | undefined;
    const structured = typeof body?.error === "object" ? body.error : undefined;
    return new ApiError(
      messageFromBody(body) ?? fallback,
      structured?.code ?? (error.response.status === 401 ? "unauthorized" : `http_${error.response.status}`),
      error.response.status,
      structured?.details ?? null,
    );
  }
  if (error instanceof Error) return new ApiError(error.message || fallback, "unknown");
  return new ApiError(fallback, "unknown");
}

export function errorMessage(error: unknown, fallback?: string): string {
  return toApiError(error, fallback).message;
}

export function errorCode(error: unknown): string | undefined {
  return toApiError(error).code;
}
