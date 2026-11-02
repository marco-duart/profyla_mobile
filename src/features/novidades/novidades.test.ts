// Módulo puro idêntico ao dos outros apps; os mesmos casos de teste (Jest).
import {
  createNovidadesTracker,
  novidadeBadge,
  novidadeCta,
  novidadeImage,
  novidadePrice,
  novidadesFrom,
  parseRestrictedMarkdown,
  safeHttpsUrl,
  type Novidade,
  type NovidadeEvent,
} from "./novidades";

const assert = {
  deepEqual: (actual: unknown, expected: unknown) => expect(actual).toEqual(expected),
  equal: (actual: unknown, expected: unknown) => expect(actual).toBe(expected),
  ok: (value: unknown, _message?: string) => expect(value).toBeTruthy(),
  doesNotThrow: (fn: () => void) => expect(fn).not.toThrow(),
};

const base: Novidade = { id: "a1", slug: "porta-lata", kind: "PHYSICAL_PRODUCT", title: "Porta-lata 3D" };

describe("parseRestrictedMarkdown", () => {
  it("negrito, itálico, parágrafos e quebras de linha", () => {
    assert.deepEqual(parseRestrictedMarkdown("Oi **mundo** e *você*\nlinha 2\n\nfim"), [
      [
        [
          { kind: "text", text: "Oi " },
          { kind: "strong", text: "mundo" },
          { kind: "text", text: " e " },
          { kind: "em", text: "você" },
        ],
        [{ kind: "text", text: "linha 2" }],
      ],
      [[{ kind: "text", text: "fim" }]],
    ]);
  });

  it("só links https viram link; os outros ficam só com o texto", () => {
    assert.deepEqual(parseRestrictedMarkdown("[veja](https://maaxis.com.br/x)")[0][0], [
      { kind: "link", text: "veja", href: "https://maaxis.com.br/x" },
    ]);
    for (const bad of ["[x](javascript:alert(1))", "[x](http://inseguro.com)", "[x](data:text/html,oi)"]) {
      const flat = parseRestrictedMarkdown(bad).flat(2);
      assert.ok(
        flat.every((span) => span.kind !== "link"),
        bad,
      );
    }
  });

  it("HTML nunca é interpretado: vira texto", () => {
    const flat = parseRestrictedMarkdown("<script>alert(1)</script> <img src=x onerror=alert(1)>").flat(2);
    assert.deepEqual(flat, [{ kind: "text", text: "<script>alert(1)</script> <img src=x onerror=alert(1)>" }]);
  });

  it("vazio não gera parágrafo", () => {
    assert.deepEqual(parseRestrictedMarkdown(null), []);
    assert.deepEqual(parseRestrictedMarkdown("\n\n"), []);
  });
});

describe("links, imagem, preço e selo", () => {
  it("safeHttpsUrl aceita só https", () => {
    assert.equal(safeHttpsUrl("https://wa.me/5562999999999?text=oi"), "https://wa.me/5562999999999?text=oi");
    assert.equal(safeHttpsUrl("javascript:alert(1)"), null);
    assert.equal(safeHttpsUrl("http://exemplo.com"), null);
    assert.equal(safeHttpsUrl(42), null);
  });

  it("imagem só do Cloudinary", () => {
    assert.deepEqual(novidadeImage({ ...base, image: { url: "https://res.cloudinary.com/demo/a.jpg", alt: null } }), {
      url: "https://res.cloudinary.com/demo/a.jpg",
      alt: "",
    });
    assert.equal(novidadeImage({ ...base, image: { url: "https://evil.com/a.jpg" } }), null);
  });

  it("cta mantém a url como veio e recusa esquema proibido", () => {
    const url = "https://wa.me/5562999999999?text=Vi%20no%20Dita&utm=1";
    assert.deepEqual(novidadeCta({ ...base, cta: { label: "Pedir", url } }), { label: "Pedir", url });
    assert.equal(novidadeCta({ ...base, cta: { label: "Pedir", url: "javascript:alert(1)" } }), null);
  });

  it('preço "a partir de" em pt-BR', () => {
    const price = novidadePrice({ ...base, product: { key: "p", name: "P", priceFromCents: 3500 } });
    assert.equal(price?.replace(/\s/g, " "), "a partir de R$ 35,00");
    assert.equal(novidadePrice(base), null);
  });

  it("selo por tipo; desconhecido fica sem selo", () => {
    assert.equal(novidadeBadge("SYSTEM_PROMO"), "Da Maaxis");
    assert.equal(novidadeBadge("PHYSICAL_PRODUCT"), "Produto");
    assert.equal(novidadeBadge("GENERAL"), null);
    assert.equal(novidadeBadge("NOVO_TIPO"), null);
  });

  it("novidadesFrom mantém a ordem e ignora lixo", () => {
    assert.deepEqual(
      novidadesFrom({ data: [base, { id: 1 }, null, { ...base, id: "a2" }] }).map((n) => n.id),
      ["a1", "a2"],
    );
    assert.deepEqual(novidadesFrom(undefined), []);
  });
});

describe("createNovidadesTracker", () => {
  it("impressão uma vez por anúncio e placement; cliques sempre; envia em lote", () => {
    const sent: NovidadeEvent[][] = [];
    const tracker = createNovidadesTracker((events) => sent.push(events));

    assert.equal(tracker.impression("a1", "web.dashboard"), true);
    assert.equal(tracker.impression("a1", "web.dashboard"), false);
    tracker.impression("a1", "web.novidades");
    tracker.click("a1", "web.dashboard");
    tracker.flush();
    tracker.flush();

    assert.equal(sent.length, 1);
    assert.deepEqual(
      sent[0].map((e) => `${e.placement}:${e.type}`),
      ["web.dashboard:IMPRESSION", "web.novidades:IMPRESSION", "web.dashboard:CLICK"],
    );
  });

  it("falha no envio é engolida", () => {
    const tracker = createNovidadesTracker(() => {
      throw new Error("offline");
    });
    tracker.click("a1", "mobile.home");
    assert.doesNotThrow(() => tracker.flush());
  });
});
