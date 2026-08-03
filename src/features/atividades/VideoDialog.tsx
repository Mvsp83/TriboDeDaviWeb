import { ExternalLink } from "lucide-react";
import { extrairVideoId, urlEmbed, urlWatch } from "@/lib/youtube";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  titulo?: string | null;
  videoUrl?: string | null;
}

// Player embutido do YouTube (mesma abordagem do portal Blazor).
export function VideoDialog({ aberto, onOpenChange, titulo, videoUrl }: Props) {
  const videoId = extrairVideoId(videoUrl);

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-6">
            {titulo || "Vídeo"}
          </DialogTitle>
        </DialogHeader>

        {videoId && (
          <div className="relative w-full overflow-hidden rounded-lg bg-black [aspect-ratio:16/9]">
            <iframe
              src={urlEmbed(videoId)}
              title={titulo ?? "Vídeo"}
              className="absolute inset-0 size-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        <DialogFooter>
          {videoId && (
            <Button variant="outline" asChild>
              <a href={urlWatch(videoId)} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                Abrir no YouTube
              </a>
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
