import { useQuery } from "@tanstack/react-query";
import { getCurriculum } from "@/api/profile";

/** Currículo completo da pessoa (perfil, histórico, links, habilidades). Chave compartilhada para invalidar depois de editar. */
export function useCurriculum() {
  return useQuery({ queryKey: ["curriculum"], queryFn: getCurriculum });
}
