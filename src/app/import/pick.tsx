import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { getCurriculum } from "@/api/profile";
import { ImportPickScreen } from "@/features/import/ImportPickScreen";

export default function ImportPick() {
  const router = useRouter();
  const curriculum = useQuery({ queryKey: ["curriculum"], queryFn: getCurriculum });
  return (
    <ImportPickScreen
      hasExistingFile={Boolean(curriculum.data?.curriculum_file)}
      onBack={() => router.back()}
      onReview={() => router.replace("/import/review")}
      onFallback={() => router.replace("/(tabs)/profile")}
    />
  );
}
