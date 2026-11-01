import { useRouter } from "expo-router";
import { useState } from "react";
import { addKnowledges, addSkills, getKnowledgesCatalog, getSkillsCatalog } from "@/api/profile";
import { errorMessage } from "@/api/errors";
import { CatalogPicker } from "@/features/onboarding/CatalogPicker";
import { StepLayout } from "@/ui/StepLayout";
import { useToast } from "@/ui/toast/ToastProvider";

const toggle = (set: ReadonlySet<number>, id: number) => {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
};

export default function Skills() {
  const router = useRouter();
  const toast = useToast();
  const [skills, setSkills] = useState<ReadonlySet<number>>(new Set());
  const [knowledges, setKnowledges] = useState<ReadonlySet<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const next = () => router.replace("/links");

  async function save() {
    setSaving(true);
    try {
      if (skills.size) await addSkills([...skills]);
      if (knowledges.size) await addKnowledges([...knowledges]);
      next();
    } catch (error) {
      toast.show(errorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  }

  const count = skills.size + knowledges.size;
  return (
    <StepLayout title="O que você sabe fazer?" help="Toque nas habilidades que são suas." onBack={null} primaryLabel={count ? `Continuar (${count} marcadas)` : "Continuar"} onPrimary={() => (count ? void save() : next())} primaryLoading={saving} secondaryLabel="Pular esta etapa" onSecondary={next}>
      <CatalogPicker queryKey="skills" load={getSkillsCatalog} title="Habilidades" selected={skills} onToggle={(id) => setSkills((current) => toggle(current, id))} />
      <CatalogPicker queryKey="knowledges" load={getKnowledgesCatalog} title="Conhecimentos" selected={knowledges} onToggle={(id) => setKnowledges((current) => toggle(current, id))} />
    </StepLayout>
  );
}
