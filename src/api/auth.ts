import { WEB_URL } from "@/config/env";
import { api, authHeadersFrom, http } from "./client";
import type { Register, SignIn, ValidateToken } from "./dto";
import { ApiError } from "./errors";
import { session } from "./session";

export async function signIn(params: SignIn.Params): Promise<SignIn.User> {
  const response = await http.post<SignIn.Response>("/auth/sign_in", params);
  const headers = authHeadersFrom(response.headers);
  if (!headers) throw new ApiError("Não foi possível iniciar a sessão.", "no_auth_headers");
  await session.set(headers);
  return response.data?.data ?? (await validateToken());
}

export async function validateToken(): Promise<SignIn.User> {
  const data = await api.get<ValidateToken.Response>("/auth/validate_token");
  if (!data?.success || !data.data) throw new ApiError("Sessão inválida.", "unauthorized", 401);
  return data.data;
}

export async function signOut(): Promise<void> {
  try {
    await api.delete("/auth/sign_out");
  } catch {
    // Sair sempre limpa a sessão local, mesmo que o servidor não responda.
  } finally {
    await session.clear();
  }
}

// A confirmação do e-mail e a troca de senha acontecem nas páginas web que já existem (D-M07).
export async function register(params: Omit<Register.Params, "confirm_success_url">): Promise<void> {
  await api.post("/auth", { ...params, confirm_success_url: `${WEB_URL}/confirmado` });
}

export async function resendConfirmation(email: string): Promise<void> {
  await api.post("/auth/confirmation", { email, redirect_url: `${WEB_URL}/confirmado` });
}

export async function requestPasswordReset(email: string): Promise<void> {
  await api.post("/auth/password", { email, redirect_url: `${WEB_URL}/redefinir-senha` });
}
