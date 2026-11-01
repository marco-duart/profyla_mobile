import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { createAcademic } from "@/api/profile";
import { MicroFlow } from "@/features/microflow/MicroFlow";
import { EDUCATION_FIELDS, toAcademicParams } from "@/features/onboarding/profileFields";

export default function AddEducation() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return (
    <MicroFlow
      fields={EDUCATION_FIELDS}
      submitLabel="Adicionar formação"
      onExit={() => router.back()}
      onComplete={async (values) => {
        await createAcademic(toAcademicParams(values));
        await queryClient.invalidateQueries({ queryKey: ["curriculum"] });
        router.back();
      }}
    />
  );
}
