// Aceita youtube.com/watch?v=, youtu.be/, /shorts/, /embed/ e /live/.
const PADRAO =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i;

export function extrairVideoId(url?: string | null): string | null {
  if (!url || !url.trim()) return null;
  const m = url.match(PADRAO);
  return m ? m[1] : null;
}

// Campo opcional: vazio é válido; preenchido precisa ser um link reconhecível.
export function urlYouTubeValida(url?: string | null): boolean {
  return !url || !url.trim() || extrairVideoId(url) != null;
}

export function urlEmbed(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

export function urlWatch(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
