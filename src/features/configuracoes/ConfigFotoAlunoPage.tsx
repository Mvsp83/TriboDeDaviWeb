import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Image as ImageIcon, Loader2, Save } from "lucide-react";
import { ApiError } from "@/lib/api";
import {
  useConfigFotoAluno,
  useSalvarConfigFotoAluno,
  type ConfigFotoAluno,
} from "@/features/alunos/fotoAlunoApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const PADRAO: ConfigFotoAluno = {
  mostrarNoCadastro: true,
  mostrarNaChamada: true,
  mostrarNoResponsavel: true,
  mostrarNaCarteirinha: true,
};

const OPCOES: { chave: keyof ConfigFotoAluno; label: string; ajuda: string }[] = [
  { chave: "mostrarNoCadastro", label: "Cadastro do aluno", ajuda: "Foto e botão de tirar/trocar na ficha do aluno." },
  { chave: "mostrarNaChamada", label: "Chamada", ajuda: "Miniatura ao lado de cada aluno na chamada." },
  { chave: "mostrarNoResponsavel", label: "Portal do responsável", ajuda: "Foto do aluno no acompanhamento da família." },
  { chave: "mostrarNaCarteirinha", label: "Carteirinha", ajuda: "Foto impressa na carteirinha do aluno." },
];

export function ConfigFotoAlunoPage() {
  const { data, isLoading } = useConfigFotoAluno();
  const salvar = useSalvarConfigFotoAluno();
  const [cfg, setCfg] = useState<ConfigFotoAluno>(PADRAO);

  useEffect(() => {
    if (data) setCfg(data);
  }, [data]);

  async function guardar() {
    try {
      await salvar.mutateAsync(cfg);
      toast.success("Configuração salva.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar.");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Foto do aluno</h1>
        <p className="text-sm text-muted-foreground">
          Escolha em quais telas a foto do aluno aparece. Vale para todos os
          usuários. A foto é tirada no cadastro (professor/admin) ou na inscrição.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-1 p-2">
          {isLoading && <Skeleton className="m-2 h-24" />}
          {!isLoading &&
            OPCOES.map((o) => (
              <label
                key={o.chave}
                className="flex cursor-pointer items-start gap-3 rounded-md p-3 hover:bg-secondary/50"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-primary"
                  checked={cfg[o.chave]}
                  onChange={(e) => setCfg((c) => ({ ...c, [o.chave]: e.target.checked }))}
                />
                <span className="flex items-center gap-2">
                  <ImageIcon className="size-4 text-muted-foreground" />
                  <span>
                    <span className="text-sm font-medium">{o.label}</span>
                    <span className="block text-xs text-muted-foreground">{o.ajuda}</span>
                  </span>
                </span>
              </label>
            ))}
        </CardContent>
      </Card>

      <Button onClick={guardar} disabled={salvar.isPending}>
        {salvar.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Salvar
      </Button>
    </div>
  );
}
