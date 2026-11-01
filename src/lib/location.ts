import * as Location from "expo-location";
import { matchPlace, type Place } from "@/data/places";

/**
 * "Usar minha localização": pede a permissão só neste toque, lê a posição uma vez e descobre a cidade.
 * Nada é guardado nem enviado: o resultado vira só a cidade escolhida no passo. Falhas voltam como Error
 * com texto pronto para a pessoa, e ela sempre pode digitar a cidade.
 */
export async function locateCity(): Promise<Place> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) throw new Error("Sem permissão de localização. Digite o nome da cidade ou libere nas configurações do aparelho.");
  if (!(await Location.hasServicesEnabledAsync())) throw new Error("A localização do aparelho está desligada. Ligue-a ou digite o nome da cidade.");

  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const [address] = await Location.reverseGeocodeAsync(position.coords);
  const place = matchPlace(address?.city ?? address?.subregion, address?.region);
  if (!place) throw new Error("Não consegui identificar a cidade por aqui. Digite o nome da cidade.");
  return place;
}
