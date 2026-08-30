import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  PartyPopper,
  KeyRound,
  Copy,
} from "lucide-react";
import { ApiError } from "@/lib/api";
import { usePolosPublicos, useEnviarInscricao } from "@/features/matricula/matriculaApi";
import { FotoInscricao } from "@/features/matricula/FotoInscricao";
import { formatarTelefone } from "@/lib/format";
import {
  PARQ,
  TERMO_RESPONSABILIDADE,
  SINTOMAS,
  VERSAO_TERMOS,
  respostasSaudeVazias,
  temSimNoParq,
  parqCompleto,
} from "@/features/matricula/questionarios";
import {
  CONDICOES_ADULTO,
  OBJETIVOS_ADULTO,
  PERGUNTAS_ADULTO,
  respostasAdultoExtraVazias,
  perguntasAdultoCompletas,
  type RespostasAdultoExtra,
} from "@/features/matricula/questionariosAdulto";
import {
  TERMO_PARTICIPACAO,
  TERMO_COMODATO,
  TERMO_IMAGEM,
  TERMO_LGPD,
  PRAZO_FILIACAO,
} from "@/features/matricula/termos";
import { PaginaPublica } from "@/components/PaginaPublica";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ETAPAS = ["Polo", "Dados", "Saúde", "Termos"] as const;

function Campo({
  label,
  obrigatorio,
  dica,
  children,
}: {
  label: string;
  obrigatorio?: boolean;
  dica?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label} {obrigatorio && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {dica && <p className="text-xs text-muted-foreground">{dica}</p>}
    </div>
  );
}

function SimNao({
  valor,
  onChange,
}: {
  valor: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex gap-2">
      {[
        { v: true, t: "Sim" },
        { v: false, t: "Não" },
      ].map(({ v, t }) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(v)}
          className={[
            "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
            valor === v
              ? "border-primary bg-primary/10 text-foreground"
              : "border-border text-muted-foreground hover:bg-secondary",
          ].join(" ")}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function ChipMulti({
  opcoes,
  selecionadas,
  onToggle,
}: {
  opcoes: string[];
  selecionadas: string[];
  onToggle: (o: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {opcoes.map((o) => {
        const on = selecionadas.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            className={[
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              on
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:bg-secondary",
            ].join(" ")}
          >
            {on && <Check className="mr-1 inline size-3.5" />}
            {o}
          </button>
        );
      })}
    </div>
  );
}

// Ficha de inscrição de ADULTOS. Fluxo próprio (sem responsável/escola), mas
// reaproveita PAR-Q, termos e o mesmo envio (com publico = 1).
export function MatriculaAdultoPage({ onVoltar }: { onVoltar?: () => void }) {
  const navigate = useNavigate();
  const { data: polos } = usePolosPublicos();
  const enviar = useEnviarInscricao();
  const ano = new Date().getFullYear();

  const [etapa, setEtapa] = useState(0);

  const [poloId, setPoloId] = useState<number | null>(null);
  const [possuiKimono, setPossuiKimono] = useState<boolean | null>(null);

  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [rg, setRg] = useState("");
  const [cpf, setCpf] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("Blumenau");
  const [whatsApp, setWhatsApp] = useState("");

  const [saude, setSaude] = useState(respostasSaudeVazias);
  const [extra, setExtra] = useState(respostasAdultoExtraVazias);

  const [aceitouTermo, setAceitouTermo] = useState(false);
  const [aceitouImagem, setAceitouImagem] = useState(false);
  const [aceitouComodato, setAceitouComodato] = useState(false);
  const [aceitouLgpd, setAceitouLgpd] = useState(false);
  const [assinatura, setAssinatura] = useState("");
  const [fotoInscricaoId, setFotoInscricaoId] = useState<string | null>(null);

  const [enviada, setEnviada] = useState(false);
  const [codigoGerado, setCodigoGerado] = useState("");

  const precisaTermoResp = temSimNoParq(saude);

  const setParq = (id: string, v: boolean) =>
    setSaude((s) => ({ ...s, parq: { ...s.parq, [id]: v } }));
  const toggle = (campo: "condicoes" | "sintomas" | "objetivos", o: string) =>
    setSaude((s) => ({
      ...s,
      [campo]: s[campo].includes(o)
        ? s[campo].filter((x) => x !== o)
        : [...s[campo], o],
    }));
  const setExtraCampo = (id: keyof RespostasAdultoExtra, v: boolean) =>
    setExtra((e) => ({ ...e, [id]: v }));

  const erroDaEtapa = useMemo(() => {
    if (etapa === 0) {
      if (poloId == null) return "Selecione o polo.";
      if (possuiKimono == null) return "Informe se possui kimono.";
    }
    if (etapa === 1) {
      if (!nome.trim()) return "Informe o nome.";
      if (!dataNascimento) return "Informe a data de nascimento.";
      if (!rg.trim()) return "Informe o RG.";
      if (!cpf.trim()) return "Informe o CPF.";
      if (!rua.trim()) return "Informe a rua.";
      if (!numero.trim()) return "Informe o número.";
      if (!bairro.trim()) return "Informe o bairro.";
      if (!cidade.trim()) return "Informe a cidade.";
      if (!whatsApp.trim()) return "Informe o WhatsApp.";
    }
    if (etapa === 2) {
      if (!parqCompleto(saude)) return "Responda todas as perguntas de aptidão.";
      if (precisaTermoResp && !saude.aceitouTermoResponsabilidade)
        return "Aceite o termo de responsabilidade.";
      if (!perguntasAdultoCompletas(extra))
        return "Responda todas as perguntas de saúde.";
      if (!saude.medicamentos.trim())
        return "Liste os medicamentos (ou escreva NÃO).";
    }
    if (etapa === 3) {
      if (!aceitouTermo || !aceitouComodato || !aceitouImagem || !aceitouLgpd)
        return "Aceite todos os termos para concluir.";
      if (!assinatura.trim()) return "Assine com o nome completo.";
    }
    return null;
  }, [
    etapa, poloId, possuiKimono, nome, dataNascimento, rg, cpf, rua, numero,
    bairro, cidade, whatsApp, saude, extra, precisaTermoResp, aceitouTermo,
    aceitouComodato, aceitouImagem, aceitouLgpd, assinatura,
  ]);

  function avancar() {
    if (erroDaEtapa) {
      toast.warning(erroDaEtapa);
      return;
    }
    setEtapa((e) => Math.min(e + 1, ETAPAS.length - 1));
  }

  async function enviarInscricao() {
    if (erroDaEtapa) {
      toast.warning(erroDaEtapa);
      return;
    }
    try {
      const saudeJson = JSON.stringify({
        ...saude,
        possuiKimono,
        ...extra,
      });
      const res = await enviar.mutateAsync({
        publico: 1, // adulto
        poloId: poloId!,
        turma: null,
        jaEraAluno: false,
        turmaAnterior: null,
        nome: nome.trim(),
        dataNascimento,
        rg: rg.trim(),
        cpf: cpf.trim(),
        peso: null,
        altura: null,
        faixa: 0,
        escola: "",
        serie: "",
        periodo: "",
        parentesco: 0,
        parentescoOutro: "",
        nomeResponsavel: "",
        rgResponsavel: "",
        cpfResponsavel: "",
        rua: rua.trim(),
        numero: numero.trim(),
        complemento: complemento.trim(),
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        whatsApp: whatsApp.trim(),
        telefone2: "",
        respostasSaudeJson: saudeJson,
        respostasFamiliarJson: "{}",
        temRestricaoMedica: precisaTermoResp || extra.restricaoMedica === true,
        medicamentos: saude.medicamentos.trim(),
        aceitouTermo,
        aceitouImagem,
        aceitouComodato,
        aceitouLgpd,
        nomeAssinatura: assinatura.trim(),
        versaoTermos: VERSAO_TERMOS,
        fotoArquivoId: fotoInscricaoId ?? undefined,
      });
      setCodigoGerado(res.codigoResponsavel);
      setEnviada(true);
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Não foi possível enviar a inscrição. Verifique a conexão e tente novamente.",
      );
    }
  }

  if (enviada) {
    const linkPortal = `${window.location.origin}/responsavel`;
    return (
      <PaginaPublica larguraMax="max-w-2xl">
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <PartyPopper className="mx-auto size-12 text-primary" />
        <h1 className="mt-4 text-2xl font-bold">Inscrição enviada!</h1>
        <p className="mt-2 text-muted-foreground">
          Sua ficha foi recebida. A equipe vai revisar e confirmar a matrícula.
        </p>
        <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-5 text-left">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <KeyRound className="size-4 text-primary" /> Seu código de acesso
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="rounded bg-secondary px-3 py-1.5 text-lg font-bold tracking-widest">
              {codigoGerado}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                navigator.clipboard?.writeText(codigoGerado);
                toast.success("Código copiado.");
              }}
              aria-label="Copiar código"
            >
              <Copy className="size-4" />
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Guarde este código: com ele e sua data de nascimento você acompanha
            presença e recados na Área do Responsável.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <a href={linkPortal}>Ir para a Área do Responsável</a>
          </Button>
          <Button onClick={() => navigate("/")}>Voltar ao início</Button>
        </div>
      </div>
      </PaginaPublica>
    );
  }

  return (
    <PaginaPublica larguraMax="max-w-2xl">
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-4 text-center">
        <div className="text-sm font-semibold uppercase tracking-wide text-primary">
          Ficha de inscrição · Adultos
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Etapa {etapa + 1} de {ETAPAS.length} · {ETAPAS[etapa]}
        </p>
      </div>

      {/* Progresso */}
      <div className="mb-6 flex gap-1.5">
        {ETAPAS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= etapa ? "bg-primary" : "bg-secondary"}`}
          />
        ))}
      </div>

      <Card>
        <CardContent className="space-y-5 p-5">
          {etapa === 0 && (
            <>
              <Campo label="Polo onde vai treinar" obrigatorio>
                <Select
                  value={poloId != null ? String(poloId) : ""}
                  onValueChange={(v) => setPoloId(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o polo" />
                  </SelectTrigger>
                  <SelectContent>
                    {(polos ?? []).map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Campo>
              <Campo label="Possui kimono?" obrigatorio>
                <SimNao valor={possuiKimono} onChange={setPossuiKimono} />
              </Campo>
            </>
          )}

          {etapa === 1 && (
            <>
              <Campo label="Nome completo" obrigatorio>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} />
              </Campo>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Data de nascimento" obrigatorio>
                  <Input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} />
                </Campo>
                <Campo label="WhatsApp" obrigatorio dica="Será incluído no grupo para recados.">
                  <Input inputMode="tel" placeholder="(47) 99999-9999" value={whatsApp} onChange={(e) => setWhatsApp(formatarTelefone(e.target.value))} />
                </Campo>
                <Campo label="RG" obrigatorio>
                  <Input value={rg} onChange={(e) => setRg(e.target.value)} />
                </Campo>
                <Campo label="CPF" obrigatorio>
                  <Input inputMode="numeric" value={cpf} onChange={(e) => setCpf(e.target.value)} />
                </Campo>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Rua" obrigatorio>
                  <Input value={rua} onChange={(e) => setRua(e.target.value)} />
                </Campo>
                <Campo label="Número" obrigatorio>
                  <Input value={numero} onChange={(e) => setNumero(e.target.value)} />
                </Campo>
                <Campo label="Complemento">
                  <Input value={complemento} onChange={(e) => setComplemento(e.target.value)} />
                </Campo>
                <Campo label="Bairro" obrigatorio>
                  <Input value={bairro} onChange={(e) => setBairro(e.target.value)} />
                </Campo>
                <Campo label="Cidade" obrigatorio>
                  <Input value={cidade} onChange={(e) => setCidade(e.target.value)} />
                </Campo>
              </div>
            </>
          )}

          {etapa === 2 && (
            <>
              <div>
                <p className="text-sm font-semibold">Questionário de aptidão (PAR-Q)</p>
                <p className="mb-3 text-xs text-muted-foreground">
                  Lei 16.331/2014. Responda sim ou não a cada pergunta.
                </p>
                <div className="space-y-4">
                  {PARQ.map((p) => (
                    <div key={p.id}>
                      <p className="mb-1.5 text-sm">{p.texto}</p>
                      <SimNao valor={saude.parq[p.id] ?? null} onChange={(v) => setParq(p.id, v)} />
                    </div>
                  ))}
                </div>
                {precisaTermoResp && (
                  <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={saude.aceitouTermoResponsabilidade}
                      onChange={(e) => setSaude((s) => ({ ...s, aceitouTermoResponsabilidade: e.target.checked }))}
                    />
                    <span>{TERMO_RESPONSABILIDADE}</span>
                  </label>
                )}
              </div>

              <Campo label="Já teve alguma destas doenças?">
                <ChipMulti opcoes={CONDICOES_ADULTO} selecionadas={saude.condicoes} onToggle={(o) => toggle("condicoes", o)} />
                <Input className="mt-2" placeholder="Outra (opcional)" value={saude.condicaoOutra} onChange={(e) => setSaude((s) => ({ ...s, condicaoOutra: e.target.value }))} />
              </Campo>

              <Campo label="Sente algum destes sintomas?">
                <ChipMulti opcoes={SINTOMAS} selecionadas={saude.sintomas} onToggle={(o) => toggle("sintomas", o)} />
              </Campo>

              <Campo label="Medicamentos em uso" obrigatorio dica="Nome e motivo. Se não usa nenhum, escreva NÃO.">
                <Textarea value={saude.medicamentos} onChange={(e) => setSaude((s) => ({ ...s, medicamentos: e.target.value }))} />
              </Campo>

              <div className="space-y-4">
                {PERGUNTAS_ADULTO.map((p) => (
                  <div key={p.id}>
                    <p className="mb-1.5 text-sm">{p.texto}</p>
                    <SimNao valor={extra[p.id]} onChange={(v) => setExtraCampo(p.id, v)} />
                  </div>
                ))}
              </div>

              <Campo label="Quais seus objetivos no projeto?">
                <ChipMulti opcoes={OBJETIVOS_ADULTO} selecionadas={saude.objetivos} onToggle={(o) => toggle("objetivos", o)} />
              </Campo>
            </>
          )}

          {etapa === 3 && (
            <>
              {[
                { texto: TERMO_PARTICIPACAO, on: aceitouTermo, set: setAceitouTermo, rot: "Li e aceito o termo de participação." },
                { texto: TERMO_COMODATO, on: aceitouComodato, set: setAceitouComodato, rot: "Li e aceito o termo de comodato (uniforme)." },
                { texto: TERMO_IMAGEM, on: aceitouImagem, set: setAceitouImagem, rot: "Autorizo o uso de imagem e voz." },
                { texto: TERMO_LGPD, on: aceitouLgpd, set: setAceitouLgpd, rot: "Autorizo o tratamento dos dados (LGPD)." },
              ].map((t, i) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <div className="max-h-40 overflow-y-auto whitespace-pre-line text-xs text-muted-foreground">
                    {t.texto}
                  </div>
                  <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm font-medium">
                    <input type="checkbox" checked={t.on} onChange={(e) => t.set(e.target.checked)} />
                    {t.rot}
                  </label>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">{PRAZO_FILIACAO(ano)}</p>
              <Campo label="Assinatura (nome completo)" obrigatorio>
                <Input value={assinatura} onChange={(e) => setAssinatura(e.target.value)} />
              </Campo>
              <FotoInscricao onChange={setFotoInscricaoId} />
            </>
          )}
        </CardContent>
      </Card>

      <div className="mt-5 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() =>
            etapa === 0 ? (onVoltar ? onVoltar() : navigate("/")) : setEtapa((e) => Math.max(e - 1, 0))
          }
        >
          <ArrowLeft className="size-4" />
          {etapa === 0 ? "Voltar" : "Anterior"}
        </Button>

        {etapa < ETAPAS.length - 1 ? (
          <Button onClick={avancar}>
            Próximo
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button onClick={enviarInscricao} disabled={enviar.isPending}>
            {enviar.isPending && <Loader2 className="size-4 animate-spin" />}
            Enviar inscrição
          </Button>
        )}
      </div>
    </div>
    </PaginaPublica>
  );
}
