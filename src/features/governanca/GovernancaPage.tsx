import { useEffect, useState } from "react";
import { Landmark, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ORGAO,
  CARGOS_DIRETORIA,
  QTD_CONSELHO,
  useMembrosGovernanca,
  useAnosGovernanca,
  useSalvarGovernanca,
  type MembroGovernanca,
} from "@/features/governanca/governancaApi";

interface Slot {
  orgao: number;
  cargo: string;
  ordem: number;
  nome: string;
}

// Estrutura fixa: 6 cargos da diretoria + 3 titulares + 3 suplentes do conselho.
function slotsBase(): Slot[] {
  const diretoria = CARGOS_DIRETORIA.map((cargo, i) => ({
    orgao: ORGAO.diretoria,
    cargo,
    ordem: i + 1,
    nome: "",
  }));
  const titulares = Array.from({ length: QTD_CONSELHO }, (_, i) => ({
    orgao: ORGAO.conselho,
    cargo: "Titular",
    ordem: i + 1,
    nome: "",
  }));
  const suplentes = Array.from({ length: QTD_CONSELHO }, (_, i) => ({
    orgao: ORGAO.conselho,
    cargo: "Suplente",
    ordem: QTD_CONSELHO + i + 1,
    nome: "",
  }));
  return [...diretoria, ...titulares, ...suplentes];
}

export function GovernancaPage() {
  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(anoAtual);
  const [slots, setSlots] = useState<Slot[]>(slotsBase);

  const { data: anos = [] } = useAnosGovernanca();
  const { data: membros, isLoading } = useMembrosGovernanca(ano);
  const salvar = useSalvarGovernanca();

  // Ao trocar de ano / carregar, monta os slots e preenche pelos dados salvos.
  useEffect(() => {
    const base = slotsBase();
    for (const m of membros ?? []) {
      const s = base.find((x) => x.orgao === m.orgao && x.ordem === m.ordem);
      if (s) s.nome = m.nome;
    }
    setSlots(base);
  }, [membros, ano]);

  function editar(orgao: number, ordem: number, nome: string) {
    setSlots((atual) =>
      atual.map((s) =>
        s.orgao === orgao && s.ordem === ordem ? { ...s, nome } : s,
      ),
    );
  }

  async function onSalvar() {
    const membrosDTO: MembroGovernanca[] = slots.map((s) => ({
      ano,
      orgao: s.orgao,
      cargo: s.cargo,
      nome: s.nome.trim(),
      ordem: s.ordem,
    }));
    try {
      await salvar.mutateAsync({ ano, membros: membrosDTO });
      toast.success(`Governança de ${ano} salva.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Não foi possível salvar.");
    }
  }

  const diretoria = slots.filter((s) => s.orgao === ORGAO.diretoria);
  const titulares = slots.filter((s) => s.orgao === ORGAO.conselho && s.ordem <= QTD_CONSELHO);
  const suplentes = slots.filter((s) => s.orgao === ORGAO.conselho && s.ordem > QTD_CONSELHO);

  const campo = (s: Slot) => (
    <div key={`${s.orgao}-${s.ordem}`}>
      <Label className="mb-1.5">{s.cargo}</Label>
      <Input
        value={s.nome}
        placeholder="Nome"
        onChange={(e) => editar(s.orgao, s.ordem, e.target.value)}
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Landmark className="size-5 text-primary" />
            Governança
          </h1>
          <p className="text-sm text-muted-foreground">
            Diretoria e conselho fiscal por ano. Alimenta a página pública de
            Transparência.
          </p>
        </div>
        <div className="w-32">
          <Label className="mb-1.5">Ano de vigência</Label>
          <Input
            type="number"
            value={ano}
            min={2000}
            max={anoAtual + 1}
            onChange={(e) => setAno(Number(e.target.value))}
          />
        </div>
      </div>

      {anos.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <span>Anos cadastrados:</span>
          {anos.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAno(a)}
              className={`rounded-md border px-2 py-0.5 text-xs ${
                a === ano ? "border-primary text-primary" : "border-border hover:text-foreground"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <>
          <Card>
            <CardContent className="space-y-4 p-5">
              <p className="text-sm font-semibold">Diretoria</p>
              <div className="grid gap-3 sm:grid-cols-2">{diretoria.map(campo)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-5">
              <p className="text-sm font-semibold">Conselho Fiscal</p>
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Titulares
                </p>
                <div className="grid gap-3 sm:grid-cols-3">{titulares.map(campo)}</div>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Suplentes
                </p>
                <div className="grid gap-3 sm:grid-cols-3">{suplentes.map(campo)}</div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={onSalvar} disabled={salvar.isPending}>
              {salvar.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Salvar governança de {ano}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Cargos sem nome não aparecem no site. Salvar substitui a governança
            deste ano.
          </p>
        </>
      )}
    </div>
  );
}
