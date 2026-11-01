import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getDiscQuestions, getEneagramaQuestions, submitDisc, submitEneagrama } from "@/api/assessments";
import { errorCode, errorMessage } from "@/api/errors";
import { ScaleSwipeCard } from "@/gestures/ScaleSwipeCard";
import type { ScaleAnswer } from "@/gestures/decide";
import { KEYS, readJson, removeKey, writeJson } from "@/lib/localStore";
import { Button } from "@/ui/Button";
import { Progress } from "@/ui/Progress";
import { Screen } from "@/ui/Screen";
import { SkeletonCard } from "@/ui/Skeleton";
import { ErrorState } from "@/ui/States";
import { StepLayout } from "@/ui/StepLayout";
import { Surface } from "@/ui/Surface";
import { Text } from "@/ui/Text";
import { useToast } from "@/ui/toast/ToastProvider";
import { answerCurrent, goBack, isComplete, progressOf, restoreDraft, shuffledOrder, type Draft } from "./flow";
import { ScaleButtons } from "./ScaleButtons";

export type AssessmentKind = "disc" | "eneagrama";

const CONFIG = {
  disc: { title: "DISC comportamental", questions: getDiscQuestions, submit: submitDisc, resultKey: "disc-result" },
  eneagrama: { title: "Eneagrama", questions: getEneagramaQuestions, submit: submitEneagrama, resultKey: "eneagrama-result" },
} as const;

/** Um card por afirmação: arraste (dois limiares por lado, para cima = neutro) ou toque nos cinco botões. */
export function TestScreen({ kind }: { kind: AssessmentKind }) {
  const config = CONFIG[kind];
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const questions = useQuery({ queryKey: ["assessment-questions", kind], queryFn: config.questions, staleTime: Infinity });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const started = useRef(false);

  const byId = useMemo(() => new Map((questions.data ?? []).map((question) => [question.id, question.text])), [questions.data]);

  // Retoma o rascunho ou começa um novo (ordem embaralhada e guardada).
  useEffect(() => {
    if (!questions.data || started.current) return;
    started.current = true;
    const ids = questions.data.map((question) => question.id);
    void readJson<Draft | null>(KEYS.assessmentDraft(kind), null).then((saved) => {
      setDraft(restoreDraft(saved, ids) ?? { order: shuffledOrder(ids), answers: {}, index: 0 });
    });
  }, [questions.data, kind]);

  useEffect(() => {
    if (draft) void writeJson(KEYS.assessmentDraft(kind), draft);
  }, [draft, kind]);

  const answer = useCallback((value: ScaleAnswer) => setDraft((current) => (current ? answerCurrent(current, value) : current)), []);

  if (questions.isError) {
    // Sem o aviso aceito o servidor recusa as perguntas: volta para a lista, onde o aviso é pedido.
    if (errorCode(questions.error) === "assessment_consent_required") {
      return <StepLayout title={config.title} primaryLabel="Voltar" onPrimary={() => router.back()}><Text tone="textMuted">Antes de começar, aceite o aviso dos testes comportamentais na lista de testes.</Text></StepLayout>;
    }
    return <StepLayout title={config.title}><ErrorState message={errorMessage(questions.error)} onRetry={() => void questions.refetch()} /></StepLayout>;
  }
  if (questions.isPending || !draft) return <StepLayout title={config.title}><SkeletonCard /></StepLayout>;

  async function send(current: Draft) {
    setSubmitting(true);
    try {
      await config.submit({ answers: current.answers });
      await removeKey(KEYS.assessmentDraft(kind));
      await queryClient.invalidateQueries({ queryKey: [config.resultKey] });
      toast.show("Respostas enviadas!", "success");
      router.replace({ pathname: "/assessments/result/[kind]", params: { kind } });
    } catch (error) {
      toast.show(errorMessage(error, "Não foi possível enviar agora. Suas respostas continuam salvas."), "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (draft.index >= draft.order.length) {
    return (
      <StepLayout title="Tudo respondido" help="Revise se quiser. Ao enviar, o resultado aparece na hora." onBack={null} primaryLabel="Enviar respostas" onPrimary={() => void send(draft)} primaryDisabled={!isComplete(draft)} primaryLoading={submitting} secondaryLabel="Voltar à última pergunta" onSecondary={() => setDraft(goBack(draft))} />
    );
  }

  const { current, total } = progressOf(draft);
  const id = draft.order[draft.index];
  return (
    <Screen footer={<><ScaleButtons onAnswer={answer} selected={draft.answers[id]} /><Button label="Voltar à pergunta anterior" variant="ghost" onPress={() => setDraft(goBack(draft))} disabled={draft.index === 0} fullWidth /></>}>
      <Progress current={current} total={total} label={`Pergunta ${current} de ${total}`} />
      <Text variant="label" tone="textMuted">{config.title}</Text>
      <ScaleSwipeCard key={id} onAnswer={answer} accessibilityLabel={`Afirmação ${current} de ${total}: ${byId.get(id) ?? ""}`}>
        <Surface>
          <Text variant="title" style={{ paddingTop: 24 }}>{byId.get(id)}</Text>
          <Text tone="textMuted">O quanto você concorda com esta afirmação?</Text>
        </Surface>
      </ScaleSwipeCard>
      <Text variant="caption" tone="textMuted" center>Arraste o card ou toque nos botões. Para cima = neutro.</Text>
    </Screen>
  );
}
