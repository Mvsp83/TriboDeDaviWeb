import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usePolos } from "@/features/polos/polosApi";
import {
  useUsuarios,
  useExcluirUsuario,
} from "@/features/usuarios/usuariosApi";
import { UsuarioFormDialog } from "@/features/usuarios/UsuarioFormDialog";
import { ApiError } from "@/lib/api";
import { ROLE_LABEL, type Usuario } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function UsuariosPage() {
  const { data: usuarios, isLoading, isError } = useUsuarios();
  const { data: polos } = usePolos();
  const excluir = useExcluirUsuario();

  const [filtro, setFiltro] = useState("");
  const [dialogAberto, setDialogAberto] = useState(false);
  const [usuarioEdicao, setUsuarioEdicao] = useState<Usuario | null>(null);
  const [usuarioExcluir, setUsuarioExcluir] = useState<Usuario | null>(null);

  const filtrados = useMemo(() => {
    const q = filtro.toLocaleLowerCase("pt-BR");
    return (usuarios ?? []).filter((u) =>
      u.login.toLocaleLowerCase("pt-BR").includes(q),
    );
  }, [usuarios, filtro]);

  async function confirmarExclusao() {
    if (!usuarioExcluir) return;
    try {
      await excluir.mutateAsync(usuarioExcluir.id);
      toast.success("Usuário excluído.");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Erro ao excluir o usuário.",
      );
    } finally {
      setUsuarioExcluir(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Carregando..." : `${filtrados.length} usuário(s)`}
        </p>
        <Button
          onClick={() => {
            setUsuarioEdicao(null);
            setDialogAberto(true);
          }}
        >
          <Plus className="size-4" />
          Novo usuário
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por login"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Login</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Polo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading && isError && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-destructive">
                    Erro ao carregar os usuários. Tente novamente.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && !isError && filtrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                filtrados.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.login}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.role === 0 ? "warning" : "secondary"}>
                        {ROLE_LABEL[u.role] ?? "Desconhecido"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.poloNome ?? "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setUsuarioEdicao(u);
                            setDialogAberto(true);
                          }}
                          aria-label="Editar"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setUsuarioExcluir(u)}
                          aria-label="Excluir"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UsuarioFormDialog
        aberto={dialogAberto}
        onOpenChange={setDialogAberto}
        usuario={usuarioEdicao}
        polos={polos ?? []}
      />

      <ConfirmDialog
        aberto={usuarioExcluir !== null}
        onOpenChange={(o) => !o && setUsuarioExcluir(null)}
        titulo="Confirmar exclusão"
        descricao={
          <>
            Deseja excluir o usuário <strong>{usuarioExcluir?.login}</strong>?
            Esta ação não pode ser desfeita.
          </>
        }
        confirmarLabel="Excluir"
        onConfirmar={confirmarExclusao}
        carregando={excluir.isPending}
      />
    </div>
  );
}
