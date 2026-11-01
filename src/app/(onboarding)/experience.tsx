import { useRouter } from "expo-router";
import { createEmployment } from "@/api/profile";
import { formatMonthYear } from "@/lib/format";
import { AddListFlow } from "@/features/onboarding/AddListFlow";
import { EXPERIENCE_FIELDS, toEmploymentParams } from "@/features/onboarding/profileFields";

export default function Experience() {
  const router = useRouter();
  return (
    <AddListFlow
      title="Suas experiências"
      help="Adicione as que quiser. Você pode completar depois."
      fields={EXPERIENCE_FIELDS}
      submitLabel="Adicionar experiência"
      describe={(values) => ({
        title: `${String(values.position)} · ${String(values.company)}`,
        subtitle: `${formatMonthYear(`${String(values.start)}-01`)} – ${values.current === false ? formatMonthYear(`${String(values.end)}-01`) : "atual"}`,
      })}
      create={(values) => createEmployment(toEmploymentParams(values))}
      addAnotherLabel="Adicionar outra experiência"
      continueLabel="Continuar"
      skipLabel="Pular, não tenho experiência"
      onNext={() => router.replace("/education")}
    />
  );
}
