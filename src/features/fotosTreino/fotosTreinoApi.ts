import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";

// Categoria da foto no álbum público.
export type CategoriaFoto = "polo" | "graduacoes" | "geral" | "eventos";

export const CATEGORIA_LABEL: Record<CategoriaFoto, string> = {
  polo: "Treino de polo",
  graduacoes: "Graduações",
  geral: "Geral",
  eventos: "Eventos",
};

// Foto de treino (visão admin/moderação).
export interface FotoTreino {
  id: number;
  categoria: CategoriaFoto;
  poloId: number;
  poloNome?: string | null;
  turma: number;
  dataAula: string;
  legenda?: string | null;
  professorId: number;
  publicada: boolean;
  criadoEm: string;
  url: string;
}

// Foto no álbum público do site.
export interface FotoTreinoPublica {
  id: number;
  categoria: CategoriaFoto;
  poloNome?: string | null;
  turma: number;
  dataAula: string;
  legenda?: string | null;
  url: string;
}

// Config por polo do fluxo de publicação das fotos.
export interface PoloFotoConfig {
  poloId: number;
  poloNome: string;
  requerAutorizacao: boolean;
}

// ---- Upload (multipart) ---------------------------------------------------

export interface DadosUploadFoto {
  categoria: CategoriaFoto;
  dataAula: string; // "yyyy-MM-dd" — data da foto/aula
  legenda: string;
  arquivo: Blob;
  turma?: number; // só na categoria "polo"
  poloId?: number; // só admin escolhe; professor usa o próprio polo
}

async function enviarFoto(d: DadosUploadFoto): Promise<FotoTreino> {
  const form = new FormData();
  form.append("categoria", d.categoria);
  form.append("dataAula", d.dataAula);
  form.append("legenda", d.legenda ?? "");
  if (d.categoria === "polo") {
    form.append("turma", String(d.turma ?? 1));
    if (d.poloId != null) form.append("poloId", String(d.poloId));
  }
  // nome com extensão .webp para a API validar o tipo de imagem.
  form.append("arquivo", d.arquivo, "treino.webp");
  return apiPost<FotoTreino>(ApiRotas.fotosTreinoUpload, form);
}

export function useEnviarFotoTreino() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: enviarFoto,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fotos-treino"] });
      qc.invalidateQueries({ queryKey: ["fotos-treino-publicas"] });
    },
  });
}

// ---- Moderação (admin) ----------------------------------------------------

export function useFotosTreino() {
  return useQuery({
    queryKey: ["fotos-treino"],
    queryFn: () => apiGet<FotoTreino[] | null>(ApiRotas.fotosTreino).then((r) => r ?? []),
  });
}

export function usePublicarFoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, publicada }: { id: number; publicada: boolean }) =>
      apiPut(ApiRotas.fotosTreinoPublicar(id, publicada)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fotos-treino"] });
      qc.invalidateQueries({ queryKey: ["fotos-treino-publicas"] });
    },
  });
}

export function useExcluirFotoTreino() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(ApiRotas.fotosTreinoExcluir(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fotos-treino"] });
      qc.invalidateQueries({ queryKey: ["fotos-treino-publicas"] });
    },
  });
}

// Prévia (base64) de uma foto pendente, para a moderação (a chamada leva token).
export function usePreviaFoto(id: number | null) {
  return useQuery({
    queryKey: ["fotos-treino-previa", id],
    enabled: id != null,
    staleTime: 5 * 60 * 1000,
    queryFn: () =>
      apiGet<{ dataUri: string }>(ApiRotas.fotoTreinoPrevia(id!)).then((r) => r.dataUri),
  });
}

// ---- Álbum público --------------------------------------------------------

export function useFotosTreinoPublicas() {
  return useQuery({
    queryKey: ["fotos-treino-publicas"],
    queryFn: () =>
      apiGet<FotoTreinoPublica[] | null>(ApiRotas.fotosTreinoPublicas).then((r) => r ?? []),
  });
}

// ---- Config por polo (admin) ---------------------------------------------

export function usePoloFotoConfigs() {
  return useQuery({
    queryKey: ["fotos-treino-config-polos"],
    queryFn: () =>
      apiGet<PoloFotoConfig[] | null>(ApiRotas.fotosTreinoConfigPolos).then((r) => r ?? []),
  });
}

export function useDefinirPoloFotoConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ poloId, requerAutorizacao }: { poloId: number; requerAutorizacao: boolean }) =>
      apiPut(ApiRotas.fotosTreinoDefinirConfigPolo(poloId, requerAutorizacao)),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["fotos-treino-config-polos"] }),
  });
}

// ---- Util: redimensiona/comprime a imagem no navegador --------------------

// Reduz para no máximo `maxLado` px e exporta WebP (~400 KB), poupando storage
// e banda. Mantém a proporção; corrige orientação básica via createImageBitmap.
export async function comprimirImagem(
  file: File,
  maxLado = 1600,
  qualidade = 0.82,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
  const largura = Math.round(bitmap.width * escala);
  const altura = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível processar a imagem.");
  ctx.drawImage(bitmap, 0, 0, largura, altura);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", qualidade),
  );
  if (!blob) throw new Error("Não foi possível comprimir a imagem.");
  return blob;
}
