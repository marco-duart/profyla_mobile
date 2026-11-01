import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { errorMessage } from "@/api/errors";
import { addKnowledges, addSkills, getKnowledgesCatalog, getSkillsCatalog } from "@/api/profile";
import { useCurriculum } from "@/features/profile/useCurriculum";
import { CatalogPicker } from "@/features/onboarding/CatalogPicker";
import { StepLayout } from "@/ui/StepLayout";
import { useToast } from "@/ui/toast/ToastProvider";

const toggle = (set: ReadonlySet<number>, id: number) => {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
};

/** Marca habilidades e conhecimentos do catálogo; os que a pessoa já tem não são enviados de novo. */
export default function EditSkills() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const curriculum = useCurriculum();
  const [skills, setSkills] = useState<ReadonlySet<number>>(new Set());
  const [knowledges, setKnowledges] = useState<ReadonlySet<number>>(new Set());
  const [saving, setSaving] = useState(false);

  const ownSkills = new Set((curriculum.data?.skills ?? []).map((item) => item.skill_id));
  const ownKnowledges = new Set((curriculum.data?.knowledges ?? []).map((item) => item.knowledge_id));
  const shownSkills = new Set([...ownSkills, ...skills]);
  const shownKnowledges = new Set([...ownKnowledges, ...knowledges]);
  const count = skills.size + knowledges.size;

  async function save() {
    setSaving(true);
    try {
      if (skills.size) await addSkills([...skills]);
      if (knowledges.size) await addKnowledges([...knowledges]);
      await queryClient.invalidateQueries({ queryKey: ["curriculum"] });
      router.back();
    } catch (error) {
      toast.show(errorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <StepLayout
      title="Habilidades e conhecimentos"
      help="Toque para marcar o que é seu. Para tirar uma habilidade, use a tela do perfil."
      onBack={() => router.back()}
      primaryLabel={count ? `Salvar (${count} novas)` : "Voltar"}
      onPrimary={() => (count ? void save() : router.back())}
      primaryLoading={saving}
    >
      <CatalogPicker queryKey="skills" load={getSkillsCatalog} title="Habilidades" selected={shownSkills} onToggle={(id) => !ownSkills.has(id) && setSkills((current) => toggle(current, id))} />
      <CatalogPicker queryKey="knowledges" load={getKnowledgesCatalog} title="Conhecimentos" selected={shownKnowledges} onToggle={(id) => !ownKnowledges.has(id) && setKnowledges((current) => toggle(current, id))} />
    </StepLayout>
  );
}
