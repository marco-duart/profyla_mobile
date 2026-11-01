import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { signIn as apiSignIn, signOut as apiSignOut, validateToken } from "@/api/auth";
import { setUnauthorizedHandler } from "@/api/client";
import type { SignIn } from "@/api/dto";
import { ApiError } from "@/api/errors";
import { session } from "@/api/session";
import { LOCAL_PREFIX, removeKeysWithPrefix } from "@/lib/localStore";

type Status = "loading" | "signedOut" | "signedIn";

type SessionApi = {
  status: Status;
  user: SignIn.User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Chamado antes de sair: confirma o que estiver pendente com "Desfazer". */
  setBeforeSignOut: (handler: (() => void) | null) => void;
};

const SessionContext = createContext<SessionApi | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<SignIn.User | null>(null);
  const [beforeSignOut, setBeforeSignOut] = useState<(() => void) | null>(null);

  const reset = useCallback(async () => {
    queryClient.clear();
    await removeKeysWithPrefix(LOCAL_PREFIX);
    setUser(null);
    setStatus("signedOut");
  }, [queryClient]);

  // O servidor recusou o token: a sessão já foi limpa pelo cliente HTTP; volta ao login.
  useEffect(() => {
    setUnauthorizedHandler(() => void reset());
    return () => setUnauthorizedHandler(null);
  }, [reset]);

  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await session.load();
      if (!active) return;
      if (!stored) {
        setStatus("signedOut");
        return;
      }
      try {
        const current = await validateToken();
        if (!active) return;
        setUser(current);
        setStatus("signedIn");
      } catch (error) {
        if (!active) return;
        // Sem internet: segue com a sessão guardada (o app mostra o que está em cache). 401: já voltou ao login.
        if (error instanceof ApiError && (error.code === "network" || error.code === "timeout")) setStatus("signedIn");
        else setStatus("signedOut");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const loggedIn = await apiSignIn({ email, password });
    setUser(loggedIn);
    setStatus("signedIn");
  }, []);

  const signOut = useCallback(async () => {
    beforeSignOut?.();
    await apiSignOut();
    await reset();
  }, [beforeSignOut, reset]);

  const api = useMemo<SessionApi>(
    () => ({ status, user, signIn, signOut, setBeforeSignOut: (handler) => setBeforeSignOut(() => handler) }),
    [status, user, signIn, signOut],
  );
  return <SessionContext.Provider value={api}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionApi {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession precisa de <SessionProvider>.");
  return context;
}
