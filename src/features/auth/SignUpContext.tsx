import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type SignUpValues = {
  name: string;
  email: string;
  cpf: string;
  password: string;
  confirmation: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
};

const EMPTY: SignUpValues = { name: "", email: "", cpf: "", password: "", confirmation: "", acceptTerms: false, acceptPrivacy: false };

type Api = { values: SignUpValues; set: <K extends keyof SignUpValues>(key: K, value: SignUpValues[K]) => void; reset: () => void };

const Context = createContext<Api | null>(null);

/** Guarda as respostas do cadastro entre os passos (um campo por tela). */
export function SignUpProvider({ children }: { children: ReactNode }) {
  const [values, setValues] = useState<SignUpValues>(EMPTY);
  const api = useMemo<Api>(() => ({ values, set: (key, value) => setValues((current) => ({ ...current, [key]: value })), reset: () => setValues(EMPTY) }), [values]);
  return <Context.Provider value={api}>{children}</Context.Provider>;
}

export function useSignUp(): Api {
  const context = useContext(Context);
  if (!context) throw new Error("useSignUp precisa de <SignUpProvider>.");
  return context;
}

export const SIGN_UP_STEPS = ["name", "email", "cpf", "password", "terms"] as const;
export type SignUpStep = (typeof SIGN_UP_STEPS)[number];
