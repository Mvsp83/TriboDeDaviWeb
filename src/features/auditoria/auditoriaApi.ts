import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";

export interface LogAuditoria {
  id: number;
  data: string;
  usuarioLogin: string;
  acao: string; // Criou | Alterou | Excluiu
  entidade: string;
  entidadeId: number;
  resumo: string;
  alteracoes: string; // JSON {"Campo":{"de":x,"para":y}}
  ip: string;
}

// Nomes amigáveis das entidades auditadas, para a tela não mostrar o nome da
// classe. Só as que a API audita aparecem aqui.
export const ENTIDADE_LABEL: Record<string, string> = {
  ContaFinanceira: "Conta financeira",
  MovimentacaoFinanceira: "Lançamento financeiro",
  Doador: "Doador",
  Doacao: "Doação",
  Aluno: "Aluno",
  Usuario: "Usuário",
  Presenca: "Presença",
  Graduacao: "Graduação",
};

export function useLogAuditoria(entidade: string, usuario: string, limite = 100) {
  return useQuery({
    queryKey: ["auditoria", entidade, usuario, limite],
    queryFn: () =>
      apiGet<LogAuditoria[] | null>(
        ApiRotas.auditoria(entidade, usuario, limite),
      ).then((r) => r ?? []),
  });
}
