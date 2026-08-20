import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthContext";
import { useModelos, useExcluirModelo } from "@/features/modelos/modelosApi";
import { ApiError } from "@/lib/api";
import type { ModeloDeAula } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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

export function ModelosDeAulaPage() {
  const { sessao } = useAuth();
  const admin = sessao?.isAdministrador ?? false;
  const navigate = useNavigate();

  const { data: modelos, isLoading, isError } = useModelos();
  const excluir = useExcluirModelo();

  const [filtro, setFiltro] = useState("");
  const [paraExcluir, setParaExcluir] = useState<ModeloDeAula | null>(null);

  const filtrados = useMemo(() => {
    const q = filtro.toLocaleLowerCase("pt-BR");
    return (modelos ?? [])
      .filter(
        (m) =>
          !q ||
          m.nome.toLocaleLowerCase("pt-BR").includes(q) ||
          (m.descricao ?? "").toLocaleLowerCase("pt-BR").includes(q),
      )
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [modelos, filtro]);

  async function confirmarExclusao() {
    if (!paraExcluir) return;
    try {
      await excluir.mutateAsync(paraExcluir.id);
      toast.success("Modelo excluído.");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Erro ao excluir o modelo.",
      );
    } finally {
      setParaExcluir(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Carregando..." : `${filtrados.length} modelo(s)`}
        </p>
        <Button onClick={() => navigate("/modelos-de-aula/editor")}>
          <Plus className="size-4" />
          Novo modelo
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Nome ou descrição"
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
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Blocos</TableHead>
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
                    Erro ao carregar os modelos. Tente novamente.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && !isError && filtrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Nenhum modelo cadastrado. Crie o primeiro — ex.: "Aula padrão
                    65 min".
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                filtrados.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <button
                        type="button"
                        onClick={() => navigate(`/modelos-de-aula/ver/${m.id}`)}
                        className="text-left hover:text-primary hover:underline"
                      >
                        {m.nome}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.descricao || "-"}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {m.duracaoTotalMinutos} min
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {m.blocos.length}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/modelos-de-aula/ver/${m.id}`)}
                          aria-label="Visualizar"
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            navigate(`/modelos-de-aula/editor/${m.id}`)
                          }
                          aria-label="Editar"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        {admin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setParaExcluir(m)}
                            aria-label="Excluir"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        aberto={paraExcluir !== null}
        onOpenChange={(o) => !o && setParaExcluir(null)}
        titulo="Excluir modelo"
        descricao={
          <>
            Tem certeza que deseja excluir o modelo{" "}
            <strong>{paraExcluir?.nome}</strong>?
          </>
        }
        confirmarLabel="Excluir"
        onConfirmar={confirmarExclusao}
        carregando={excluir.isPending}
      />
    </div>
  );
}
