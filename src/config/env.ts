// EXPO_PUBLIC_* é embutido pelo Metro no build. Sem a variável, o padrão é a API local (ver .env.example).
export const API_URL: string = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/+$/, "");

/** Quanto tempo uma requisição pode demorar antes de virar erro "timeout". */
export const REQUEST_TIMEOUT_MS = 20_000;

/** Origem do site web do Profyla: os links de e-mail (confirmar conta, redefinir senha) abrem lá (D-M07). */
export const WEB_URL: string = (process.env.EXPO_PUBLIC_WEB_URL ?? "http://localhost:5173").replace(/\/+$/, "");
