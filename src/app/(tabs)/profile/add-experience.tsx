import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { createEmployment } from "@/api/profile";
import { MicroFlow } from "@/features/microflow/MicroFlow";
import { EXPERIENCE_FIELDS, toEmploymentParams } from "@/features/onboarding/profileFields";

export default function AddExperience() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return (
    <MicroFlow
      fields={EXPERIENCE_FIELDS}
      submitLabel="Adicionar experiência"
      onExit={() => router.back()}
      onComplete={async (values) => {
        await createEmployment(toEmploymentParams(values));
        await queryClient.invalidateQueries({ queryKey: ["curriculum"] });
        router.back();
      }}
    />
  );
}
