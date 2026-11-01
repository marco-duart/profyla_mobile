import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { CatalogItem } from "@/api/dto";
import { normalizeSearch } from "@/data/places";
import { Chip } from "@/ui/Chip";
import { SkeletonCard } from "@/ui/Skeleton";
import { ErrorState } from "@/ui/States";
import { Text } from "@/ui/Text";
import { TextField } from "@/ui/TextField";
import { space } from "@/ui/tokens";

type Props = {
  queryKey: string;
  load: () => Promise<CatalogItem.Item[]>;
  title: string;
  selected: ReadonlySet<number>;
  onToggle: (id: number) => void;
};

/** Nuvem de chips do catálogo com busca: tocar marca, tocar de novo desmarca (plano, 7.2). */
export function CatalogPicker({ queryKey, load, title, selected, onToggle }: Props) {
  const catalog = useQuery({ queryKey: ["catalog", queryKey], queryFn: load, staleTime: 10 * 60_000 });
  const [search, setSearch] = useState("");
  const items = useMemo(() => {
    const key = normalizeSearch(search);
    const all = catalog.data ?? [];
    return key ? all.filter((item) => normalizeSearch(item.title).includes(key)) : all;
  }, [catalog.data, search]);

  if (catalog.isPending) return <SkeletonCard />;
  if (catalog.isError) return <ErrorState message="Não foi possível carregar a lista." onRetry={() => void catalog.refetch()} />;
  if ((catalog.data ?? []).length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text variant="heading">{title}</Text>
      <TextField label={`Buscar em ${title.toLowerCase()}`} value={search} onChangeText={setSearch} placeholder="Digite para filtrar" />
      <View style={styles.chips}>
        {items.map((item) => (
          <Chip key={item.id} label={item.title} selected={selected.has(item.id)} onPress={() => onToggle(item.id)} />
        ))}
      </View>
      {items.length === 0 ? <Text tone="textMuted">Nada encontrado para essa busca.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { gap: space[3] }, chips: { flexDirection: "row", flexWrap: "wrap", gap: space[2] } });
