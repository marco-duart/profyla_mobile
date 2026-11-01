import { useRouter } from "expo-router";
import { ImportPickScreen } from "@/features/import/ImportPickScreen";

export default function OnboardingImportPick() {
  const router = useRouter();
  return <ImportPickScreen onReview={() => router.replace("/import-review")} onFallback={() => router.replace("/experience")} />;
}
