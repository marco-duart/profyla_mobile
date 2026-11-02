/**
 * Novidades nos apps Expo: card, carrossel do início, lista da tela completa e
 * Markdown restrito em Text aninhado. Cada app passa as cores do próprio tema.
 *
 * Arquivo idêntico em todos os apps mobile (muda só a formatação).
 */
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  AppState,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
  type ListViewToken,
} from "react-native";
import {
  createNovidadesTracker,
  novidadeBadge,
  novidadeCta,
  novidadeImage,
  novidadePrice,
  parseRestrictedMarkdown,
  type Novidade,
  type NovidadeEvent,
} from "./novidades";

export interface NovidadesPalette {
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  badgeBackground: string;
  badgeText: string;
}

const APP_HOSTS = ["wa.me", "api.whatsapp.com", "whatsapp.com", "instagram.com", "www.instagram.com"];

/** Abre FORA do app. WhatsApp e Instagram vão pelo sistema (abre o app certo); o resto no navegador. */
export async function openNovidadeUrl(url: string): Promise<void> {
  try {
    if (APP_HOSTS.includes(new URL(url).hostname)) {
      await Linking.openURL(url);
      return;
    }
    await WebBrowser.openBrowserAsync(url);
  } catch {
    // Sem app ou navegador disponível: nada a fazer.
  }
}

/**
 * Métricas: impressão uma vez por anúncio e placement enquanto o app está aberto;
 * envio em lote a cada 30 s e ao ir para segundo plano, para não gastar bateria.
 */
export function createMobileNovidadesTracker(send: (events: NovidadeEvent[]) => Promise<unknown>) {
  const tracker = createNovidadesTracker((events) => {
    send(events).catch(() => undefined);
  });
  setInterval(() => tracker.flush(), 30_000);
  AppState.addEventListener("change", (status) => {
    if (status !== "active") tracker.flush();
  });
  return tracker;
}

export function RestrictedMarkdownText({ source, palette }: { source: string | null | undefined; palette: NovidadesPalette }) {
  const paragraphs = parseRestrictedMarkdown(source);
  if (paragraphs.length === 0) return null;

  return (
    <View style={styles.markdown}>
      {paragraphs.map((lines, p) => (
        <Text key={p} style={[styles.body, { color: palette.textMuted }]}>
          {lines.map((spans, l) => (
            <Text key={l}>
              {l > 0 ? "\n" : null}
              {spans.map((span, s) => {
                if (span.kind === "strong")
                  return (
                    <Text key={s} style={styles.strong}>
                      {span.text}
                    </Text>
                  );
                if (span.kind === "em")
                  return (
                    <Text key={s} style={styles.em}>
                      {span.text}
                    </Text>
                  );
                if (span.kind === "link") {
                  return (
                    <Text
                      key={s}
                      accessibilityRole="link"
                      style={[styles.link, { color: palette.primary }]}
                      onPress={() => void openNovidadeUrl(span.href)}
                    >
                      {span.text}
                    </Text>
                  );
                }
                return <Text key={s}>{span.text}</Text>;
              })}
            </Text>
          ))}
        </Text>
      ))}
    </View>
  );
}

interface NovidadeCardProps {
  novidade: Novidade;
  palette: NovidadesPalette;
  /** Clique no botão; quem chama registra a métrica e abre a url. */
  onCtaPress: (novidade: Novidade, url: string) => void;
  /** Sem imagem nem corpo: para telas onde o espaço é curto (ex.: início com mapa). */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function NovidadeCard({ novidade, palette, onCtaPress, compact = false, style }: NovidadeCardProps) {
  const badge = novidadeBadge(novidade.kind);
  const image = novidadeImage(novidade);
  const price = novidadePrice(novidade);
  const cta = novidadeCta(novidade);

  return (
    <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }, style]}>
      {image && !compact ? (
        <Image
          source={{ uri: image.url }}
          alt={image.alt}
          accessibilityLabel={image.alt || undefined}
          contentFit="cover"
          style={styles.image}
        />
      ) : null}
      <View style={styles.cardBody}>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: palette.badgeBackground }]}>
            <Text style={[styles.badgeText, { color: palette.badgeText }]}>{badge}</Text>
          </View>
        ) : null}
        <Text style={[styles.title, { color: palette.text }]} numberOfLines={compact ? 2 : undefined}>
          {novidade.title}
        </Text>
        {novidade.subtitle ? (
          <Text style={[styles.body, { color: palette.textMuted }]} numberOfLines={compact ? 2 : undefined}>
            {novidade.subtitle}
          </Text>
        ) : null}
        {price ? <Text style={[styles.price, { color: palette.text }]}>{price}</Text> : null}
        {compact ? null : <RestrictedMarkdownText source={novidade.bodyMd} palette={palette} />}
        {cta ? (
          <Pressable
            accessibilityRole="link"
            onPress={() => onCtaPress(novidade, cta.url)}
            style={({ pressed }) => [styles.cta, { backgroundColor: palette.primary, opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={[styles.ctaText, { color: palette.onPrimary }]}>{cta.label}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const VIEWABILITY = { itemVisiblePercentThreshold: 50 };
const GAP = 12;

interface NovidadesCarouselProps {
  items: Novidade[];
  palette: NovidadesPalette;
  onImpression: (novidade: Novidade) => void;
  onCtaPress: (novidade: Novidade, url: string) => void;
  onSeeAll?: () => void;
  /** Recuo lateral da tela onde o carrossel fica. */
  inset?: number;
  compact?: boolean;
}

/** Carrossel do início. Sem itens não renderiza nada: nem título nem espaço. */
export function NovidadesCarousel({
  items,
  palette,
  onImpression,
  onCtaPress,
  onSeeAll,
  inset = 16,
  compact = false,
}: NovidadesCarouselProps) {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const impressionRef = useRef(onImpression);
  useEffect(() => {
    impressionRef.current = onImpression;
  });
  // FlatList exige o mesmo callback durante toda a vida da lista.
  const [onViewableItemsChanged] = useState(() => ({ viewableItems }: { viewableItems: ListViewToken[] }) => {
    viewableItems.forEach((token) => {
      if (token.isViewable) impressionRef.current(token.item as Novidade);
    });
    const first = viewableItems.find((token) => token.isViewable && token.index !== null);
    if (first?.index != null) setPage(first.index);
  });

  if (items.length === 0) return null;
  const cardWidth = items.length === 1 ? width - inset * 2 : Math.min(width - inset * 2 - 24, 420);

  return (
    <View style={styles.carousel}>
      <View style={[styles.carouselHead, { paddingHorizontal: inset }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>Novidades</Text>
        {onSeeAll ? (
          <Pressable accessibilityRole="link" onPress={onSeeAll} hitSlop={12}>
            <Text style={[styles.seeAll, { color: palette.primary }]}>Ver todas</Text>
          </Pressable>
        ) : null}
      </View>
      <FlatList
        horizontal
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NovidadeCard novidade={item} palette={palette} onCtaPress={onCtaPress} compact={compact} style={{ width: cardWidth }} />
        )}
        ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
        contentContainerStyle={{ paddingHorizontal: inset }}
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + GAP}
        decelerationRate="fast"
        viewabilityConfig={VIEWABILITY}
        onViewableItemsChanged={onViewableItemsChanged}
      />
      {items.length > 1 ? (
        <View style={styles.dots} accessibilityLabel={`Novidade ${page + 1} de ${items.length}`}>
          {items.map((item, i) => (
            <View key={item.id} style={[styles.dot, { backgroundColor: i === page ? palette.primary : palette.border }]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

interface NovidadesListProps {
  items: Novidade[] | undefined;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  palette: NovidadesPalette;
  onImpression: (novidade: Novidade) => void;
  onCtaPress: (novidade: Novidade, url: string) => void;
  header?: ReactElement;
}

/** Lista da tela "Novidades": vertical, puxar para atualizar e estado vazio curto. */
export function NovidadesList({ items, loading, refreshing, onRefresh, palette, onImpression, onCtaPress, header }: NovidadesListProps) {
  const impressionRef = useRef(onImpression);
  useEffect(() => {
    impressionRef.current = onImpression;
  });
  const [onViewableItemsChanged] = useState(() => ({ viewableItems }: { viewableItems: ListViewToken[] }) => {
    viewableItems.forEach((token) => {
      if (token.isViewable) impressionRef.current(token.item as Novidade);
    });
  });

  return (
    <FlatList
      data={items ?? []}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <NovidadeCard novidade={item} palette={palette} onCtaPress={onCtaPress} />}
      ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
      ListHeaderComponent={header}
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator style={styles.empty} color={palette.primary} />
        ) : (
          <Text style={[styles.empty, styles.body, { color: palette.textMuted }]}>Nenhuma novidade por enquanto.</Text>
        )
      }
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />}
      viewabilityConfig={VIEWABILITY}
      onViewableItemsChanged={onViewableItemsChanged}
    />
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, overflow: "hidden" },
  image: { width: "100%", aspectRatio: 1080 / 600 },
  cardBody: { padding: 16, gap: 8 },
  badge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "700" },
  body: { fontSize: 14, lineHeight: 20 },
  price: { fontSize: 15, fontWeight: "600" },
  markdown: { gap: 8 },
  strong: { fontWeight: "700" },
  em: { fontStyle: "italic" },
  link: { textDecorationLine: "underline" },
  cta: { minHeight: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, marginTop: 4 },
  ctaText: { fontSize: 15, fontWeight: "700" },
  carousel: { gap: 12 },
  carouselHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  seeAll: { fontSize: 14, fontWeight: "600" },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  list: { padding: 16, flexGrow: 1 },
  empty: { textAlign: "center", marginTop: 48 },
});
