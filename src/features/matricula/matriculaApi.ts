import { useMutation, useQuery } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";

export interface PoloPublico {
  id: number;
  nome: string;
}

// Polos para o formulário público: a lista vem sem autenticação e traz apenas
// id e nome, nada mais do cadastro.
export function usePolosPublicos() {
  return useQuery({
    queryKey: ["polos-publicos"],
    queryFn: () => apiGet<PoloPublico[] | null>(ApiRotas.inscricaoPolos),
    staleTime: 30 * 60 * 1000,
  });
}

export interface EnvioInscricao {
  poloId: number;
  turma: number | null;
  jaEraAluno: boolean;
  turmaAnterior: number | null;

  nome: string;
  dataNascimento: string;
  rg: string;
  cpf: string;
  peso: number | null;
  altura: number | null;
  faixa: number;
  escola: string;
  serie: string;
  periodo: string;

  parentesco: number;
  parentescoOutro: string;
  nomeResponsavel: string;
  rgResponsavel: string;
  cpfResponsavel: string;

  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  whatsApp: string;
  telefone2: string;

  respostasSaudeJson: string;
  respostasFamiliarJson: string;
  temRestricaoMedica: boolean;
  medicamentos: string;

  aceitouTermo: boolean;
  aceitouImagem: boolean;
  aceitouComodato: boolean;
  aceitouLgpd: boolean;
  nomeAssinatura: string;
  versaoTermos: string;
}

export function useEnviarInscricao() {
  return useMutation({
    mutationFn: (dados: EnvioInscricao) =>
      // A API devolve o código de acesso do responsável, entregue à família
      // no fim do formulário.
      apiPost<{ id: number; codigoResponsavel: string }>(
        ApiRotas.inscricaoEnviar,
        {
          ...dados,
          // A data vai como ISO completo para o DateTime da API.
          dataNascimento: `${dados.dataNascimento}T00:00:00`,
        },
      ),
  });
}
