// Hooks de acesso à configuração de graduação. Espelham o padrão de
// configuracaoDocumentoApi (API como fonte da verdade, cache local), mas por
// enquanto SÓ localStorage — o back-end ainda não tem o endpoint.
//
// Quando existir /api/ConfiguracaoGraduacao/obter|salvar, basta trocar o corpo
// das funções abaixo por apiGet/apiPut (mantendo o espelho local), sem tocar
// nas telas.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type ConfigGraduacao,
  type Posicao,
  type ProgramaFaixa,
  type GolpeRestrito,
  type ParametrosFaixa,
  novoId,
} from "./tipos";
import { carregarConfig, salvarConfig } from "./graduacaoStore";

const CHAVE_QUERY = ["graduacao-config"];

export function useConfigGraduacao() {
  return useQuery({
    queryKey: CHAVE_QUERY,
    // Local e síncrono; o Promise.resolve mantém a assinatura pronta para a API.
    queryFn: async (): Promise<ConfigGraduacao> => carregarConfig(),
    initialData: carregarConfig,
    staleTime: Infinity,
  });
}

// Salva a config inteira. As mutações específicas abaixo passam por aqui.
export function useSalvarConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cfg: ConfigGraduacao) => {
      salvarConfig(cfg);
      return cfg;
    },
    onSuccess: (cfg) => qc.setQueryData(CHAVE_QUERY, cfg),
  });
}

// ---- Posições (catálogo) ----

// Cria ou atualiza uma posição. Sem id => cria (gera um novo).
export function useSalvarPosicao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Posicao) => {
      const cfg = carregarConfig();
      const existe = p.id && cfg.posicoes.some((x) => x.id === p.id);
      const posicoes = existe
        ? cfg.posicoes.map((x) => (x.id === p.id ? p : x))
        : [...cfg.posicoes, { ...p, id: p.id || novoId() }];
      const nova = { ...cfg, posicoes };
      salvarConfig(nova);
      return nova;
    },
    onSuccess: (cfg) => qc.setQueryData(CHAVE_QUERY, cfg),
  });
}

export function useExcluirPosicao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const cfg = carregarConfig();
      const nova: ConfigGraduacao = {
        ...cfg,
        posicoes: cfg.posicoes.filter((x) => x.id !== id),
        // Remove também os requisitos que apontavam para a posição excluída.
        programas: cfg.programas.map((prog) => ({
          ...prog,
          graus: prog.graus.map((g) => ({
            ...g,
            requisitos: g.requisitos.filter((r) => r.posicaoId !== id),
          })),
        })),
      };
      salvarConfig(nova);
      return nova;
    },
    onSuccess: (cfg) => qc.setQueryData(CHAVE_QUERY, cfg),
  });
}

// ---- Golpes restritos (matriz por idade/faixa) ----

// Substitui a lista inteira de golpes restritos.
export function useSalvarGolpes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (golpes: GolpeRestrito[]) => {
      const cfg = carregarConfig();
      const nova = { ...cfg, golpesRestritos: golpes };
      salvarConfig(nova);
      return nova;
    },
    onSuccess: (cfg) => qc.setQueryData(CHAVE_QUERY, cfg),
  });
}

// ---- Parâmetros de aptidão (por faixa) ----

// Substitui a lista inteira de parâmetros por faixa.
export function useSalvarParametros() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (parametros: ParametrosFaixa[]) => {
      const cfg = carregarConfig();
      const nova = { ...cfg, parametros };
      salvarConfig(nova);
      return nova;
    },
    onSuccess: (cfg) => qc.setQueryData(CHAVE_QUERY, cfg),
  });
}

// ---- Programa de uma faixa ----

// Salva (substitui) o programa de uma faixa pela faixaBase.
export function useSalvarPrograma() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (prog: ProgramaFaixa) => {
      const cfg = carregarConfig();
      const existe = cfg.programas.some((p) => p.faixaBase === prog.faixaBase);
      const programas = existe
        ? cfg.programas.map((p) => (p.faixaBase === prog.faixaBase ? prog : p))
        : [...cfg.programas, prog];
      const nova = { ...cfg, programas };
      salvarConfig(nova);
      return nova;
    },
    onSuccess: (cfg) => qc.setQueryData(CHAVE_QUERY, cfg),
  });
}
