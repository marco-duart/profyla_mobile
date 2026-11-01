import { isValidCpf, isValidPhone, maskCpf, maskPhone, onlyDigits } from "./masks";
import { isValidEmail, normalizeEmail, passwordStrength } from "./validation";

describe("máscaras", () => {
  it("aplica a máscara de CPF aos poucos", () => {
    expect(maskCpf("529")).toBe("529");
    expect(maskCpf("5299")).toBe("529.9");
    expect(maskCpf("52998224725")).toBe("529.982.247-25");
    expect(maskCpf("529982247251234")).toBe("529.982.247-25");
  });

  it("valida CPF pelos dígitos verificadores e recusa repetidos", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224725")).toBe(true);
    expect(isValidCpf("12345678900")).toBe(false);
    expect(isValidCpf("11111111111")).toBe(false);
    expect(isValidCpf("5299822472")).toBe(false);
  });

  it("aplica a máscara de telefone para fixo e celular", () => {
    expect(maskPhone("1")).toBe("(1");
    expect(maskPhone("11")).toBe("(11");
    expect(maskPhone("1198")).toBe("(11) 98");
    expect(maskPhone("1132224455")).toBe("(11) 3222-4455");
    expect(maskPhone("11987654321")).toBe("(11) 98765-4321");
    expect(maskPhone("119876543219999")).toBe("(11) 98765-4321");
  });

  it("valida telefone com DDD (10 ou 11 dígitos)", () => {
    expect(isValidPhone("(11) 98765-4321")).toBe(true);
    expect(isValidPhone("(11) 3222-4455")).toBe(true);
    expect(isValidPhone("98765-4321")).toBe(false);
  });

  it("onlyDigits remove tudo que não é número", () => {
    expect(onlyDigits("(11) 98765-4321")).toBe("11987654321");
  });
});

describe("validação", () => {
  it("classifica a força da senha", () => {
    expect(passwordStrength("")).toEqual({ score: 0, label: "" });
    expect(passwordStrength("abc")).toEqual({ score: 1, label: "Curta demais" });
    expect(passwordStrength("abcdefgh")).toEqual({ score: 1, label: "Fraca" });
    expect(passwordStrength("abcdefG1")).toEqual({ score: 2, label: "Média" });
    expect(passwordStrength("Abcdefgh1234!")).toEqual({ score: 3, label: "Forte" });
  });

  it("valida e normaliza e-mail", () => {
    expect(isValidEmail("ana@example.com")).toBe(true);
    expect(isValidEmail("ana@example")).toBe(false);
    expect(isValidEmail("ana example@x.com")).toBe(false);
    expect(normalizeEmail("  Ana@Example.COM ")).toBe("ana@example.com");
  });
});
