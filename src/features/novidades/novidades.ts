/**
 * Novidades do Painel de Controle: tipos do contrato e regras puras, sem React.
 * Contrato do feed: painel-controle-server/docs/feed-openapi.yaml. O app recebe o
 * feed pelo PRÓPRIO backend, nunca do painel.
 *
 * Arquivo idêntico em todos os apps web e mobile (muda só a formatação).
 */

export interface Novidade {
  id: string;
  slug: string;
  kind: string;
  title: string;
  subtitle?: string | null;
  bodyMd?: string | null;
  image?: { url: string; alt?: string | null } | null;
  cta?: { label: string; url: string } | null;
  product?: { key: string; name: string; priceFromCents?: number | null } | null;
  promotedSystem?: { key: string; name: string } | null;
  priority?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  updatedAt?: string;
  version?: number;
}

export interface NovidadesResponse {
  data: Novidade[];
  placement: string;
  generatedAt?: string;
  ttlSeconds?: number;
}

export type NovidadeEventType = "IMPRESSION" | "CLICK";

export interface NovidadeEvent {
  announcementId: string;
  placement: string;
  type: NovidadeEventType;
}

/** Cinco minutos: o backend já guarda o feed em cache por esse tempo. */
export const NOVIDADES_STALE_TIME_MS = 5 * 60_000;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

/** Mantém a ordem do painel e descarta só item sem id ou título. */
export function novidadesFrom(body: unknown): Novidade[] {
  if (!isRecord(body) || !Array.isArray(body.data)) return [];
  return body.data.filter((item): item is Novidade => isRecord(item) && typeof item.id === "string" && typeof item.title === "string");
}

/** Selo por tipo; kind desconhecido ou GENERAL fica sem selo. */
export function novidadeBadge(kind: string): string | null {
  if (kind === "SYSTEM_PROMO") return "Da Maaxis";
  if (kind === "PHYSICAL_PRODUCT") return "Produto";
  return null;
}

/** Só https: (wa.me também é https). javascript:, data:, http: e afins viram null. */
export function safeHttpsUrl(url: unknown): string | null {
  if (typeof url !== "string") return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname ? parsed.href : null;
  } catch {
    return null;
  }
}

/** Imagem só de res.cloudinary.com; outra origem não é exibida. */
export function novidadeImage(novidade: Novidade): { url: string; alt: string } | null {
  const url = safeHttpsUrl(novidade.image?.url);
  if (!url || new URL(url).hostname !== "res.cloudinary.com") return null;
  return { url, alt: novidade.image?.alt ?? "" };
}

/** CTA só com url https; a url vai como veio (já traz o sistema e os UTMs). */
export function novidadeCta(novidade: Novidade): { label: string; url: string } | null {
  const cta = novidade.cta;
  if (!cta || typeof cta.label !== "string" || !cta.label) return null;
  return safeHttpsUrl(cta.url) === null ? null : { label: cta.label, url: cta.url };
}

/** "a partir de R$ 35,00" */
export function novidadePrice(novidade: Novidade): string | null {
  const cents = novidade.product?.priceFromCents;
  if (typeof cents !== "number" || !Number.isFinite(cents) || cents < 0) return null;
  const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
  return `a partir de ${reais}`;
}

export type MarkdownSpan = { kind: "text" | "strong" | "em"; text: string } | { kind: "link"; text: string; href: string };

/** Parágrafo = linhas; linha = trechos. */
export type MarkdownParagraph = MarkdownSpan[][];

const TOKEN = /(\*\*[^*]+\*\*|\*[^*\n]+\*|\[[^\]\n]+\]\([^)\s]+\))/g;
const LINK = /^\[([^\]]+)\]\(([^)\s]+)\)$/;

function spans(line: string): MarkdownSpan[] {
  return line
    .split(TOKEN)
    .filter((part) => part !== "")
    .map((part): MarkdownSpan => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return { kind: "strong", text: part.slice(2, -2) };
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return { kind: "em", text: part.slice(1, -1) };
      }
      const link = LINK.exec(part);
      if (link) {
        const href = safeHttpsUrl(link[2] ?? "");
        // Link com esquema proibido vira só o texto dele.
        return href ? { kind: "link", text: link[1] ?? "", href } : { kind: "text", text: link[1] ?? "" };
      }
      return { kind: "text", text: part };
    });
}

/**
 * Markdown RESTRITO das Novidades: parágrafos, **negrito**, *itálico* e
 * [link](https://...). Nunca HTML: quem renderiza monta os elementos à mão a
 * partir destes trechos, então "<script>" é só texto.
 */
export function parseRestrictedMarkdown(source: string | null | undefined): MarkdownParagraph[] {
  if (!source) return [];
  return source
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => paragraph.split("\n").map(spans));
}

/**
 * Junta impressões (uma por anúncio e placement enquanto o app está aberto) e
 * cliques, e entrega em lote para `send`. Quem usa decide quando chamar `flush`
 * (web: logo depois; mobile: a cada 30 s e ao ir para segundo plano).
 */
export function createNovidadesTracker(send: (events: NovidadeEvent[]) => void) {
  const seen = new Set<string>();
  let queue: NovidadeEvent[] = [];

  return {
    impression(announcementId: string, placement: string): boolean {
      const key = `${announcementId}|${placement}`;
      if (seen.has(key)) return false;
      seen.add(key);
      queue.push({ announcementId, placement, type: "IMPRESSION" });
      return true;
    },
    click(announcementId: string, placement: string): void {
      queue.push({ announcementId, placement, type: "CLICK" });
    },
    pending(): number {
      return queue.length;
    },
    flush(): void {
      if (queue.length === 0) return;
      const batch = queue.slice(0, 100);
      queue = queue.slice(100);
      try {
        send(batch);
      } catch {
        // Métrica perdida não atrapalha ninguém.
      }
    },
  };
}
