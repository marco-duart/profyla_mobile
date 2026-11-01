import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { acceptConsents, getConsents, getLegalDocument } from "@/api/account";
import { getDiscResult, getEneagramaResult } from "@/api/assessments";
import { errorMessage } from "@/api/errors";
import { formatDate } from "@/lib/format";
import { Button } from "@/ui/Button";
import { Chip } from "@/ui/Chip";
import { Markdown } from "@/ui/Markdown";
import { Screen } from "@/ui/Screen";
import { Sheet } from "@/ui/Sheet";
import { Surface } from "@/ui/Surface";
import { TabHeader } from "@/ui/TabHeader";
import { Text } from "@/ui/Text";
import { useToast } from "@/ui/toast/ToastProvider";

type Kind = "disc" | "eneagrama";

const TESTS: { kind: Kind; title: string; subtitle: string }[] = [
  { kind: "disc", title: "DISC comportamental", subtitle: "50 afirmações, cerca de 10 minutos." },
  { kind: "eneagrama", title: "Eneagrama", subtitle: "54 afirmações, cerca de 12 minutos." },
];

/** Lista de testes. Antes do primeiro, o aviso dos testes comportamentais precisa ser aceito (WP-18). */
export default function Assessments() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const disc = useQuery({ queryKey: ["disc-result"], queryFn: getDiscResult });
  const eneagrama = useQuery({ queryKey: ["eneagrama-result"], queryFn: getEneagramaResult });
  const [notice, setNotice] = useState<Kind | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const document = useQuery({ queryKey: ["legal", "assessment_notice"], queryFn: () => getLegalDocument("assessment_notice"), enabled: notice !== null });

  const latest = (kind: Kind) => (kind === "disc" ? disc.data?.latest : eneagrama.data?.latest);

  async function start(kind: Kind) {
    try {
      const consents = await getConsents();
      const accepted = consents.documents.find((item) => item.kind === "assessment_notice")?.accepted;
      if (accepted) router.push(`/assessments/${kind}` as never);
      else {
        setAgreed(false);
        setNotice(kind);
      }
    } catch (error) {
      toast.show(errorMessage(error), "error");
    }
  }

  async function accept() {
    if (!notice) return;
    setAccepting(true);
    try {
      await acceptConsents(["assessment_notice"]);
      await queryClient.invalidateQueries({ queryKey: ["consents"] });
      const kind = notice;
      setNotice(null);
      router.push(`/assessments/${kind}` as never);
    } catch (error) {
      toast.show(errorMessage(error), "error");
    } finally {
      setAccepting(false);
    }
  }

  return (
    <Screen insideTabs>
      <TabHeader title="Testes" />
      <Text tone="textMuted">Avaliações comportamentais opcionais. Os resultados ajudam a conhecer seu perfil e não são um diagnóstico.</Text>
      {TESTS.map((test) => {
        const done = latest(test.kind);
        return (
          <Surface key={test.kind}>
            <Text variant="heading">{test.title}</Text>
            <Text tone="textMuted">{done ? `Realizado em ${formatDate(done.completed_at)}` : test.subtitle}</Text>
            <Button label={done ? "Refazer o teste" : "Fazer o teste"} onPress={() => void start(test.kind)} />
            {done ? (
              <Button label="Ver o resultado" variant="secondary" onPress={() => router.push({ pathname: "/assessments/result/[kind]", params: { kind: test.kind } })} />
            ) : null}
          </Surface>
        );
      })}

      <Sheet visible={notice !== null} onClose={() => setNotice(null)} title="Aviso dos testes comportamentais" closeLabel="Agora não">
        {document.data ? <Markdown source={document.data.content} /> : <Text tone="textMuted">Carregando o aviso...</Text>}
        <Chip label="Li e entendi o aviso" selected={agreed} onPress={() => setAgreed((value) => !value)} />
        <Button label="Aceitar e começar" disabled={!agreed || !document.data} loading={accepting} onPress={() => void accept()} fullWidth />
      </Sheet>
    </Screen>
  );
}
