import { useState } from "react";
import { Menu, LogOut, ImageIcon } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useMeuAvatar } from "@/features/perfil/perfilApi";
import { AvatarView } from "@/features/perfil/presets";
import { AvatarDialog } from "@/features/perfil/AvatarDialog";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Topbar({
  titulo,
  onMenu,
}: {
  titulo: string;
  onMenu: () => void;
}) {
  const { sessao, sair } = useAuth();
  const { data: avatar } = useMeuAvatar();
  const [dialogAvatar, setDialogAvatar] = useState(false);

  const nome = sessao?.login ?? "?";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      <button
        onClick={onMenu}
        className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="size-5" />
      </button>

      <h1 className="flex-1 truncate text-lg font-semibold">{titulo}</h1>

      {sessao?.poloNome && (
        <Badge variant="outline" className="hidden sm:inline-flex">
          {sessao.poloNome}
        </Badge>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <AvatarView valor={avatar} nome={nome} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="truncate">{sessao?.login}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {sessao?.role}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDialogAvatar(true)}>
            <ImageIcon className="size-4" />
            Alterar avatar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={sair}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="size-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AvatarDialog
        aberto={dialogAvatar}
        onOpenChange={setDialogAvatar}
        nome={nome}
        avatarAtual={avatar ?? null}
      />
    </header>
  );
}
