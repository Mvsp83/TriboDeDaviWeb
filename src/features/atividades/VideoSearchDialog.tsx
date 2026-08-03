import { useEffect, useState } from "react";
import { Video, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  termoInicial?: string;
}

// A busca dentro do portal (via API do YouTube) exigiria uma chave no backend.
// Num SPA isso ficaria exposto, então oferecemos os atalhos para pesquisar em
// nova aba — o mesmo fallback que o portal Blazor usa quando não há chave.
export function VideoSearchDialog({
  aberto,
  onOpenChange,
  termoInicial = "",
}: Props) {
  const [termo, setTermo] = useState(termoInicial);

  useEffect(() => {
    if (aberto) setTermo(termoInicial);
  }, [aberto, termoInicial]);

  const vazio = !termo.trim();
  const q = encodeURIComponent(termo);
  const urlYouTube = `https://www.youtube.com/results?search_query=${q}`;
  const urlGoogle = `https://www.google.com/search?q=${q}`;

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pesquisar vídeo</DialogTitle>
          <DialogDescription>
            Digite as palavras-chave e abra a busca no YouTube ou no Google em
            uma nova aba. Copie o link do vídeo e cole no campo da atividade.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="ex: guarda fechada armlock infantil"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            className="pl-9"
          />
        </div>

        <DialogFooter className="sm:justify-start">
          <Button variant="outline" asChild disabled={vazio}>
            <a href={urlYouTube} target="_blank" rel="noreferrer">
              <Video className="size-4 text-destructive" />
              YouTube
            </a>
          </Button>
          <Button variant="outline" asChild disabled={vazio}>
            <a href={urlGoogle} target="_blank" rel="noreferrer">
              <Search className="size-4" />
              Google
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
