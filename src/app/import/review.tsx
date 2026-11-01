import { useRouter } from "expo-router";
import { ImportReviewScreen } from "@/features/import/ImportReviewScreen";

export default function ImportReview() {
  const router = useRouter();
  return <ImportReviewScreen onFinished={() => router.replace("/(tabs)/profile")} onFallback={() => router.replace("/(tabs)/profile")} />;
}
