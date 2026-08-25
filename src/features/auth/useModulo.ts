import { useAuth } from "@/features/auth/AuthContext";
import type { ModuloId } from "@/config/modulos";

// Diz se a conta atual contratou um módulo. Use para esconder botões, abas ou
// blocos dentro de uma página já liberada por rota.
//
// Ex.: const temCaptacao = useModulo("captacao");
//
// Lembre: gate visual é UX. Quem controla de verdade é a API.
export function useModulo(id: ModuloId): boolean {
  const { sessao } = useAuth();
  return sessao?.modulos.includes(id) ?? false;
}
