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
  // Público da ficha: 0 = criança/adolescente, 1 = adulto. Decide quais campos
  // e perguntas a ficha traz; o backend guarda para separar os cadastros.
  publico: number;
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
  // Foto (opcional) já enviada ao servidor; id do arquivo devolvido pelo upload.
  fotoArquivoId?: string;
}

// Dados de um aluno já cadastrado, para pré-preencher a rematrícula.
export interface DadosPreMatricula {
  alunoId: number;
  nome: string;
  dataNascimento: string; // yyyy-MM-dd
  rg: string;
  cpf: string;
  peso: number | null;
  altura: number | null;
  faixa: number;
  escola: string;
  serie: string;
  periodo: string;
  parentesco: number;
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
  poloId: number;
  turmaAnterior: number;
}

// Rematrícula: busca o aluno por CPF do responsável + data de nascimento.
// Retorna null quando não encontra (a API responde Success=true, Data=null).
export function useBuscarRematricula() {
  return useMutation({
    mutationFn: ({ cpfResponsavel, dataNascimento }: { cpfResponsavel: string; dataNascimento: string }) =>
      apiPost<DadosPreMatricula | null>(ApiRotas.inscricaoBuscarAluno, {
        cpfResponsavel,
        dataNascimento: `${dataNascimento}T00:00:00`,
      }),
  });
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
