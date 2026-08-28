import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";

export interface VideoGaleria {
  id: number;
  titulo: string;
  youtubeId: string;
  url: string;
  descricao?: string | null;
}

export function useVideosGaleria() {
  return useQuery({
    queryKey: ["videos-galeria"],
    queryFn: () =>
      apiGet<VideoGaleria[] | null>(ApiRotas.videosGaleria).then((r) => r ?? []),
  });
}

export function useSalvarVideoGaleria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: Omit<VideoGaleria, "id"> & { id?: number }) =>
      apiPost<VideoGaleria>(ApiRotas.videoGaleriaSalvar, { ...v, id: v.id ?? 0 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["videos-galeria"] }),
  });
}

export function useExcluirVideoGaleria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(ApiRotas.videoGaleriaExcluir(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["videos-galeria"] }),
  });
}

// Extrai o id (11 chars) das formas comuns de URL do YouTube. "" se não achar.
export function extrairYoutubeId(url: string): string {
  const s = (url ?? "").trim();
  // Id colado direto.
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  // youtu.be/ID, /embed/ID, /shorts/ID, /live/ID, /v/ID.
  let m = s.match(/(?:youtu\.be\/|\/embed\/|\/shorts\/|\/live\/|\/v\/)([A-Za-z0-9_-]{11})/i);
  if (m) return m[1];
  // Parâmetro v= em qualquer posição (watch?v=, ?a=b&v=, mobile, etc.).
  m = s.match(/[?&]v=([A-Za-z0-9_-]{11})/i);
  if (m) return m[1];
  return "";
}

export const thumbYoutube = (youtubeId: string) =>
  `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

export const embedYoutube = (youtubeId: string) =>
  `https://www.youtube-nocookie.com/embed/${youtubeId}`;
