import { useRouter } from "expo-router";
import { ImportReviewScreen } from "@/features/import/ImportReviewScreen";

export default function OnboardingImportReview() {
  const router = useRouter();
  // Importou: pula as perguntas de experiência e formação (já vieram do PDF) e segue para habilidades.
  return <ImportReviewScreen onFinished={() => router.replace("/skills")} onFallback={() => router.replace("/experience")} />;
}
