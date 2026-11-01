export const MIN_PASSWORD_LENGTH = 8;

export type PasswordStrength = { score: 0 | 1 | 2 | 3; label: string };

export function passwordStrength(password: string): PasswordStrength {
  if (password.length === 0) return { score: 0, label: "" };
  if (password.length < MIN_PASSWORD_LENGTH) return { score: 1, label: "Curta demais" };

  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(password)).length;
  if (variety >= 3 && password.length >= 10) return { score: 3, label: "Forte" };
  if (variety >= 2) return { score: 2, label: "Média" };
  return { score: 1, label: "Fraca" };
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}
