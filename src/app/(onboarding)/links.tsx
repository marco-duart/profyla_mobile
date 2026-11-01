import { useRouter } from "expo-router";
import { createProfessionalLink, createSocialLink } from "@/api/profile";
import type { FieldSpec } from "@/features/microflow/types";
import { AddListFlow } from "@/features/onboarding/AddListFlow";

const KINDS = [
  { label: "LinkedIn", social: false },
  { label: "GitHub", social: false },
  { label: "Portfólio ou site", social: false },
  { label: "Instagram", social: true },
  { label: "Outra rede social", social: true },
];

const FIELDS: FieldSpec[] = [
  { key: "kind", kind: "choice", title: "Que tipo de link?", options: KINDS.map((kind) => ({ label: kind.label, value: kind.label })) },
  {
    key: "url",
    kind: "text",
    title: "Cole o endereço",
    label: "Endereço do link",
    keyboardType: "url",
    autoCapitalize: "none",
    validate: (value) => (/^https?:\/\/\S+\.\S+/i.test(String(value).trim()) ? null : "Comece com https:// e informe o endereço completo."),
  },
];

export default function Links() {
  const router = useRouter();
  return (
    <AddListFlow
      title="Seus links"
      help="Opcional. Ajudam o recrutador a conhecer o seu trabalho."
      fields={FIELDS}
      submitLabel="Adicionar link"
      describe={(values) => ({ title: String(values.kind), subtitle: String(values.url) })}
      create={async (values) => {
        const kind = KINDS.find((item) => item.label === values.kind);
        const payload = { title: String(values.kind), link: String(values.url).trim() };
        await (kind?.social ? createSocialLink(payload) : createProfessionalLink(payload));
      }}
      addAnotherLabel="Adicionar outro link"
      continueLabel="Continuar"
      skipLabel="Pular esta etapa"
      onNext={() => router.replace("/done")}
    />
  );
}
