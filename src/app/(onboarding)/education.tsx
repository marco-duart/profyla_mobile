import { useRouter } from "expo-router";
import { createAcademic } from "@/api/profile";
import { AddListFlow } from "@/features/onboarding/AddListFlow";
import { EDUCATION_FIELDS, toAcademicParams } from "@/features/onboarding/profileFields";
import { DEGREES_WITHOUT_COURSE } from "@/data/suggestions";

export default function Education() {
  const router = useRouter();
  return (
    <AddListFlow
      title="Sua formação"
      help="Adicione o que quiser. Você pode completar depois."
      fields={EDUCATION_FIELDS}
      submitLabel="Adicionar formação"
      describe={(values) => ({
        title: DEGREES_WITHOUT_COURSE.includes(String(values.degree)) ? String(values.degree) : `${String(values.degree)} em ${String(values.course)}`,
        subtitle: String(values.institution),
      })}
      create={(values) => createAcademic(toAcademicParams(values))}
      addAnotherLabel="Adicionar outra formação"
      continueLabel="Continuar"
      skipLabel="Pular esta etapa"
      onNext={() => router.replace("/skills")}
    />
  );
}
