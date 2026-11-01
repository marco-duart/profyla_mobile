import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { type Place, placeLabel, searchPlaces } from "@/data/places";
import { haptics } from "@/lib/haptics";
import { Text } from "@/ui/Text";
import { TextField } from "@/ui/TextField";
import { colors, MIN_TOUCH, space } from "@/ui/tokens";

type Props = {
  label: string;
  value: Place | null;
  onChange: (place: Place | null) => void;
  error?: string | null;
};

/** Busca de município com sugestões (lista embutida, funciona offline). Tocar numa sugestão é o caminho curto. */
export function PlaceField({ label, value, onChange, error }: Props) {
  const [query, setQuery] = useState(value?.name ?? "");
  const results = useMemo(() => (value ? [] : searchPlaces(query)), [query, value]);
  return (
    <View style={styles.wrap}>
      <TextField
        label={label}
        value={value ? placeLabel(value) : query}
        onChangeText={(text) => {
          setQuery(text);
          if (value) onChange(null);
        }}
        error={error}
        autoFocus
        autoCapitalize="words"
        placeholder="Digite o nome da cidade"
      />
      {results.map((place) => (
        <Pressable
          key={`${place.name}-${place.uf}`}
          accessibilityRole="button"
          accessibilityLabel={placeLabel(place)}
          onPress={() => {
            haptics.select();
            onChange(place);
          }}
          style={({ pressed }) => [styles.option, pressed ? { backgroundColor: colors.surfaceStrong } : null]}
        >
          <Text variant="bodyStrong">{place.name}</Text>
          <Text tone="textMuted">{place.uf}</Text>
        </Pressable>
      ))}
      {!value && query.trim().length >= 2 && results.length === 0 ? <Text tone="textMuted">Nenhuma cidade encontrada. Confira a digitação.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[2] },
  option: { minHeight: MIN_TOUCH, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: space[4] },
});
