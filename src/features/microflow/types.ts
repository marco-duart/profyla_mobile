import type { KeyboardTypeOptions } from "react-native";
import type { Place } from "@/data/places";

export type Values = Record<string, unknown>;

export type Option = { label: string; value: string | boolean };

export type FieldKind = "text" | "multiline" | "choice" | "date" | "monthYear" | "place";

/** Um campo = uma tela. O controle certo para cada tipo de dado (plano, princípio 2: escolher em vez de digitar). */
export type FieldSpec = {
  key: string;
  kind: FieldKind;
  title: string;
  help?: string;
  label?: string;
  placeholder?: string;
  optional?: boolean;
  options?: Option[];
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words";
  mask?: (value: string) => string;
  maxLength?: number;
  /** Chips que preenchem o texto com um toque (cargos, cursos...). */
  suggestions?: string[];
  /** Começos de frase para o texto longo, calculados a partir das respostas anteriores. */
  starters?: (values: Values) => string[];
  /** Atalho de um toque ("Mesma cidade onde moro"). */
  shortcut?: { label: string; apply: (values: Values) => unknown | Promise<unknown> };
  /** Escolha avança sozinha ao tocar. */
  autoAdvance?: boolean;
  /** Para o seletor de datas. */
  maximumDate?: () => Date;
  minimumDate?: () => Date;
  /** Texto do botão de pular (campos opcionais). */
  skipLabel?: string;
  validate?: (value: unknown, values: Values) => string | null;
  /** Só aparece se verdadeiro (ex.: data de término some quando é "emprego atual"). */
  when?: (values: Values) => boolean;
};

export type PlaceValue = Place;

export const isBlank = (value: unknown): boolean => value === undefined || value === null || (typeof value === "string" && value.trim() === "");
