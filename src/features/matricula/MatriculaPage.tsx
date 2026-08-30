import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CircleAlert,
  Loader2,
  PartyPopper,
  KeyRound,
  MessageCircle,
  Copy,
  UserSearch,
} from "lucide-react";
import { ApiError } from "@/lib/api";
import { OPCOES_FAIXA_BASE, baseDaCor } from "@/features/alunos/faixa";
import {
  usePolosPublicos,
  useEnviarInscricao,
  useBuscarRematricula,
  type DadosPreMatricula,
} from "@/features/matricula/matriculaApi";
import { BAIRROS } from "@/features/matricula/bairros";
import { comprimirImagem } from "@/features/fotosTreino/fotosTreinoApi";
import { enviarFotoInscricao } from "@/features/alunos/fotoAlunoApi";
import { ORIENTACAO_FOTO } from "@/features/matricula/FotoInscricao";
import { formatarTelefone } from "@/lib/format";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import {
  PARQ,
  TERMO_RESPONSABILIDADE,
  CONDICOES,
  SINTOMAS,
  ACOMPANHAMENTOS,
  MOTIVOS_MATRICULA,
  OBJETIVOS,
  VERSAO_TERMOS,
  respostasSaudeVazias,
  respostasFamiliarVazias,
  temSimNoParq,
  parqCompleto,
} from "@/features/matricula/questionarios";
import {
  TERMO_PARTICIPACAO,
  TERMO_COMODATO,
  TERMO_IMAGEM,
  TERMO_LGPD,
  PRAZO_FILIACAO,
} from "@/features/matricula/termos";
import { PaginaPublica } from "@/components/PaginaPublica";
import { cn } from "@/lib/utils";
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

const PARENTESCOS = [
  { valor: 0, nome: "Pai" },
  { valor: 1, nome: "Mãe" },
  { valor: 2, nome: "Tio" },
  { valor: 3, nome: "Tia" },
  { valor: 4, nome: "Avô / Avó" },
  { valor: 5, nome: "Outro" },
];

const ETAPAS = [
  "Polo",
  "Aluno",
  "Responsável",
  "Saúde",
  "Termos",
];

// ── Campos de apoio ───────────────────────────────────────────────────────
function Campo({
  label,
  obrigatorio,
  children,
  dica,
}: {
  label: string;
  obrigatorio?: boolean;
  children: React.ReactNode;
  dica?: string;
}) {
  return (
    <div>
      <Label className="mb-1.5">
        {label} {obrigatorio && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {dica && <p className="mt-1 text-xs text-muted-foreground">{dica}</p>}
    </div>
  );
}

function Marcavel({
  marcado,
  onToggle,
  children,
}: {
  marcado: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border p-2.5 text-sm">
      <input
        type="checkbox"
        checked={marcado}
        onChange={onToggle}
        className="mt-0.5 size-4 shrink-0 accent-primary"
      />
      <span>{children}</span>
    </label>
  );
}

// Sim/Não em botões grandes — mais confortável no celular que um select.
function SimNao({
  valor,
  onChange,
}: {
  valor: boolean | undefined;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex gap-2">
      {[
        { rotulo: "Sim", v: true },
        { rotulo: "Não", v: false },
      ].map((o) => (
        <button
          key={o.rotulo}
          type="button"
          onClick={() => onChange(o.v)}
          className={cn(
            "min-w-20 rounded-md border px-4 py-2 text-sm font-medium transition-colors",
            valor === o.v
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-secondary/40 hover:bg-secondary",
          )}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}

function BlocoTermo({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold">{titulo}</p>
      <div className="whitespace-pre-line rounded-md border border-border bg-secondary/30 p-4 text-sm leading-relaxed text-foreground/85">
        {texto}
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────
export function MatriculaPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { data: polos } = usePolosPublicos();
  const enviar = useEnviarInscricao();
  const ano = new Date().getFullYear();
  useDocumentTitle(`Inscrição ${ano} — Instituto Tribo de Davi`);

  const [etapa, setEtapa] = useState(0);
  const [enviada, setEnviada] = useState(false);
  const [codigoGerado, setCodigoGerado] = useState<string | null>(null);

  // Polo pode vir pré-selecionado pelo link (/matricula?polo=3), mas continua
  // editável — se a família errar, a equipe também corrige na revisão.
  const poloDoLink = Number(params.get("polo")) || null;

  const [poloId, setPoloId] = useState<number | null>(poloDoLink);
  const [jaEraAluno, setJaEraAluno] = useState<boolean | undefined>();
  const [turmaAnterior, setTurmaAnterior] = useState("");

  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [rg, setRg] = useState("");
  const [cpf, setCpf] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [faixaBase, setFaixaBase] = useState("0");
  const [grau, setGrau] = useState("0");
  const [escola, setEscola] = useState("");
  const [serie, setSerie] = useState("");
  const [periodo, setPeriodo] = useState("");

  const [parentesco, setParentesco] = useState("");
  const [parentescoOutro, setParentescoOutro] = useState("");
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [rgResponsavel, setRgResponsavel] = useState("");
  const [cpfResponsavel, setCpfResponsavel] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("Blumenau");
  const [whatsApp, setWhatsApp] = useState("");
  const [telefone2, setTelefone2] = useState("");

  const [saude, setSaude] = useState(respostasSaudeVazias);
  const [familiar, setFamiliar] = useState(respostasFamiliarVazias);

  const [aceitouTermo, setAceitouTermo] = useState(false);
  const [aceitouImagem, setAceitouImagem] = useState(false);
  const [aceitouComodato, setAceitouComodato] = useState(false);
  const [aceitouLgpd, setAceitouLgpd] = useState(false);

  // Foto (opcional) da ficha: enviada ao servidor e referenciada por id.
  const fotoRef = useRef<HTMLInputElement>(null);
  const [fotoInscricaoId, setFotoInscricaoId] = useState<string | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  async function escolherFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fotoRef.current) fotoRef.current.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.warning("Selecione uma imagem.");
      return;
    }
    setEnviandoFoto(true);
    try {
      const blob = await comprimirImagem(file, 512, 0.85);
      const id = await enviarFotoInscricao(blob);
      setFotoInscricaoId(id);
      setFotoPreview(URL.createObjectURL(blob));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao enviar a foto.");
    } finally {
      setEnviandoFoto(false);
    }
  }
  const [assinatura, setAssinatura] = useState("");

  // Rematrícula: busca por CPF do responsável + nascimento para trazer os dados.
  const [cpfBusca, setCpfBusca] = useState("");
  const [nascBusca, setNascBusca] = useState("");
  const buscarRematricula = useBuscarRematricula();

  // Carrega os dados encontrados nos campos do formulário. Saúde, pesquisa
  // familiar e termos ficam em branco de propósito: são re-respondidos a cada ano.
  function preencherComDados(d: DadosPreMatricula) {
    setJaEraAluno(true);
    if (d.poloId) setPoloId(d.poloId);
    if (d.turmaAnterior) setTurmaAnterior(String(d.turmaAnterior));
    setNome(d.nome);
    setDataNascimento(d.dataNascimento);
    setRg(d.rg);
    setCpf(d.cpf);
    setPeso(d.peso != null ? String(d.peso) : "");
    setAltura(d.altura != null ? String(d.altura) : "");
    setFaixaBase(String(baseDaCor(d.faixa)));
    setGrau(String(d.faixa - baseDaCor(d.faixa)));
    setEscola(d.escola);
    setSerie(d.serie);
    setPeriodo(d.periodo);
    setParentesco(d.parentesco ? String(d.parentesco) : "");
    setNomeResponsavel(d.nomeResponsavel);
    setRgResponsavel(d.rgResponsavel);
    setCpfResponsavel(d.cpfResponsavel);
    setRua(d.rua);
    setNumero(d.numero);
    setComplemento(d.complemento);
    setBairro(d.bairro);
    if (d.cidade) setCidade(d.cidade);
    setWhatsApp(d.whatsApp);
    setTelefone2(d.telefone2);
  }

  async function buscarMeusDados() {
    if (cpfBusca.trim().length < 11 || !nascBusca) {
      toast.warning("Informe o CPF do responsável e a data de nascimento do aluno.");
      return;
    }
    try {
      const dados = await buscarRematricula.mutateAsync({
        cpfResponsavel: cpfBusca,
        dataNascimento: nascBusca,
      });
      if (!dados) {
        toast.error("Não encontramos um aluno com esse CPF e data de nascimento. Confira os dados ou preencha a ficha normalmente.");
        return;
      }
      preencherComDados(dados);
      toast.success(`Dados de ${dados.nome} carregados. Confira e ajuste o que mudou.`);
      setEtapa(1);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Não foi possível buscar agora.");
    }
  }

  useEffect(() => {
    if (poloDoLink) setPoloId(poloDoLink);
  }, [poloDoLink]);

  // Rola ao topo a cada troca de etapa: no celular, o formulário é longo.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [etapa]);

  const precisaTermoResponsabilidade = temSimNoParq(saude);

  const alternar = (lista: string[], item: string) =>
    lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item];

  // Validação por etapa: cada passo só libera o avanço com o essencial preenchido.
  const erroDaEtapa = useMemo((): string | null => {
    if (etapa === 0) {
      if (!poloId) return "Selecione o polo onde o aluno vai treinar.";
    }
    if (etapa === 1) {
      if (!nome.trim()) return "Informe o nome do aluno.";
      if (!dataNascimento) return "Informe a data de nascimento.";
      if (new Date(dataNascimento) > new Date())
        return "A data de nascimento não pode estar no futuro.";
      if (!escola.trim()) return "Informe a escola.";
      if (!serie.trim()) return "Informe a série.";
      if (!periodo) return "Informe o período escolar.";
    }
    if (etapa === 2) {
      if (!parentesco) return "Informe o parentesco com o aluno.";
      if (!nomeResponsavel.trim()) return "Informe o nome do responsável.";
      if (!whatsApp.trim()) return "Informe o WhatsApp para contato.";
      if (!rua.trim() || !numero.trim()) return "Informe a rua e o número.";
      if (!bairro.trim()) return "Informe o bairro.";
    }
    if (etapa === 3) {
      if (!parqCompleto(saude))
        return "Responda todas as 7 perguntas do questionário de aptidão.";
      if (precisaTermoResponsabilidade && !saude.aceitouTermoResponsabilidade)
        return "Como houve resposta “sim”, é preciso aceitar o Termo de Responsabilidade.";
    }
    if (etapa === 4) {
      if (!aceitouTermo) return "É preciso aceitar o termo de participação.";
      if (!aceitouComodato) return "É preciso aceitar o termo de comodato.";
      if (!aceitouLgpd) return "É preciso autorizar o tratamento dos dados.";
      if (!assinatura.trim()) return "Escreva o nome completo do responsável.";
    }
    return null;
  }, [
    etapa, poloId, nome, dataNascimento, escola, serie, periodo,
    parentesco, nomeResponsavel, whatsApp, rua, numero, bairro, saude,
    precisaTermoResponsabilidade, aceitouTermo, aceitouComodato, aceitouLgpd, assinatura,
  ]);

  function avancar() {
    if (erroDaEtapa) {
      toast.warning(erroDaEtapa);
      return;
    }
    setEtapa((e) => Math.min(e + 1, ETAPAS.length - 1));
  }

  async function submeter() {
    if (erroDaEtapa) {
      toast.warning(erroDaEtapa);
      return;
    }
    try {
      const res = await enviar.mutateAsync({
        publico: 0, // ficha infantil/adolescente
        poloId: poloId!,
        turma: null, // definida pela equipe na revisão
        jaEraAluno: !!jaEraAluno,
        turmaAnterior: turmaAnterior ? Number(turmaAnterior) : null,
        nome: nome.trim(),
        dataNascimento,
        rg: rg.trim(),
        cpf: cpf.trim(),
        peso: peso ? Number(peso.replace(",", ".")) : null,
        altura: altura ? Number(altura.replace(",", ".")) : null,
        faixa: Number(faixaBase) + Number(grau),
        escola: escola.trim(),
        serie: serie.trim(),
        periodo,
        parentesco: Number(parentesco),
        parentescoOutro: parentescoOutro.trim(),
        nomeResponsavel: nomeResponsavel.trim(),
        rgResponsavel: rgResponsavel.trim(),
        cpfResponsavel: cpfResponsavel.trim(),
        rua: rua.trim(),
        numero: numero.trim(),
        complemento: complemento.trim(),
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        whatsApp: whatsApp.trim(),
        telefone2: telefone2.trim(),
        respostasSaudeJson: JSON.stringify(saude),
        respostasFamiliarJson: JSON.stringify(familiar),
        // Destaque para o professor: houve "sim" no questionário legal.
        temRestricaoMedica: precisaTermoResponsabilidade,
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
    const msgWhats =
      `Guarde este código de acesso ao portal do Instituto Tribo de Davi para acompanhar ${nome}: ` +
      `*${codigoGerado}*\n\nPortal: ${linkPortal}\n(entre com o código + a data de nascimento do aluno)`;

    function copiarCodigo() {
      if (!codigoGerado) return;
      navigator.clipboard
        .writeText(codigoGerado)
        .then(() => toast.success("Código copiado."))
        .catch(() => toast.error("Não foi possível copiar."));
    }

    return (
      <PaginaPublica larguraMax="max-w-2xl">
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-4 p-6 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-success/15 text-success">
          <PartyPopper className="size-8" />
        </div>
        <h1 className="text-2xl font-semibold">Inscrição enviada!</h1>
        <p className="text-muted-foreground">
          Recebemos a ficha de <strong>{nome}</strong>. A equipe do polo vai
          conferir os dados e entrar em contato pelo WhatsApp informado.
        </p>

        {codigoGerado && (
          <div className="w-full rounded-2xl border-2 border-primary/40 bg-primary/5 p-5">
            <div className="flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
              <KeyRound className="size-4" />
              Seu código de acesso ao portal
            </div>
            <div className="my-3 select-all font-mono text-4xl font-extrabold tracking-[0.25em] sm:text-5xl">
              {codigoGerado}
            </div>
            <p className="text-sm font-medium text-destructive">
              ⚠️ ANOTE ESTE CÓDIGO. É com ele (mais a data de nascimento do
              aluno) que você vai acompanhar seu filho no portal.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button asChild className="flex-1">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(msgWhats)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="size-4" />
                  Enviar pelo WhatsApp
                </a>
              </Button>
              <Button variant="outline" onClick={copiarCodigo}>
                <Copy className="size-4" />
                Copiar
              </Button>
            </div>
          </div>
        )}

        <Button asChild variant="outline">
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
      </PaginaPublica>
    );
  }

  return (
    <PaginaPublica larguraMax="max-w-2xl">
    <div className="mx-auto w-full max-w-2xl p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Ficha de inscrição {ano}
        </h1>
        <p className="text-sm text-muted-foreground">
          Projeto Jiu-Jitsu · preenchida pelo responsável
        </p>
      </header>

      {/* Aviso: ao concluir, a família recebe o código de acesso ao portal. */}
      <div className="mb-5 flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
        <KeyRound className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          <strong>Importante:</strong> ao final você receberá um{" "}
          <strong>código de acesso</strong> para acompanhar seu filho no portal
          (frequência, graduação e avisos). <strong>Guarde-o bem</strong> — ele
          aparece uma vez, na tela de conclusão.
        </p>
      </div>

      {/* Progresso */}
      <div className="mb-5">
        <div className="flex gap-1">
          {ETAPAS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                i <= etapa ? "bg-primary" : "bg-secondary",
              )}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Etapa {etapa + 1} de {ETAPAS.length} · {ETAPAS[etapa]}
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4 md:p-5">
          {/* 1. Polo */}
          {etapa === 0 && (
            <>
              {/* Rematrícula: quem já é aluno traz os dados por CPF do
                  responsável + nascimento e só edita o que mudou. */}
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <UserSearch className="size-4 text-primary" />
                  Já é aluno do projeto?
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Traga seus dados do ano passado e ajuste só o que mudou.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="CPF do responsável"
                    inputMode="numeric"
                    value={cpfBusca}
                    onChange={(e) => setCpfBusca(e.target.value)}
                  />
                  <Input
                    type="date"
                    aria-label="Data de nascimento do aluno"
                    value={nascBusca}
                    onChange={(e) => setNascBusca(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={buscarMeusDados}
                  disabled={buscarRematricula.isPending}
                >
                  {buscarRematricula.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <UserSearch className="size-4" />
                  )}
                  Buscar meus dados
                </Button>
              </div>

              <Campo label="Polo onde o aluno vai treinar" obrigatorio>
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

            </>
          )}

          {/* 2. Aluno */}
          {etapa === 1 && (
            <>
              <Campo label="Nome completo do aluno" obrigatorio>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} />
              </Campo>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Data de nascimento" obrigatorio>
                  <Input
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                  />
                </Campo>
                <Campo label="RG" dica="Deixe em branco se não possuir">
                  <Input value={rg} onChange={(e) => setRg(e.target.value)} />
                </Campo>
                <Campo label="CPF" dica="Deixe em branco se não possuir">
                  <Input value={cpf} onChange={(e) => setCpf(e.target.value)} />
                </Campo>
                <Campo label="Peso (kg)">
                  <Input
                    inputMode="decimal"
                    placeholder="ex: 32,5"
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                  />
                </Campo>
                <Campo label="Altura (m)">
                  <Input
                    inputMode="decimal"
                    placeholder="ex: 1,42"
                    value={altura}
                    onChange={(e) => setAltura(e.target.value)}
                  />
                </Campo>
                <Campo label="Faixa" dica="Se ainda não pratica, deixe Branca">
                  <Select value={faixaBase} onValueChange={setFaixaBase}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPCOES_FAIXA_BASE.map((f) => (
                        <SelectItem key={f.valor} value={String(f.valor)}>
                          {f.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Campo>
                <Campo label="Graus">
                  <Select value={grau} onValueChange={setGrau}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4].map((g) => (
                        <SelectItem key={g} value={String(g)}>
                          {g === 0 ? "Nenhum" : `${g}º grau`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Campo>
                <Campo label="Escola" obrigatorio>
                  <Input value={escola} onChange={(e) => setEscola(e.target.value)} />
                </Campo>
                <Campo label="Série" obrigatorio>
                  <Input value={serie} onChange={(e) => setSerie(e.target.value)} />
                </Campo>
                <Campo label="Período escolar" obrigatorio>
                  <Select value={periodo} onValueChange={setPeriodo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Matutino">Matutino</SelectItem>
                      <SelectItem value="Vespertino">Vespertino</SelectItem>
                      <SelectItem value="Noturno">Noturno</SelectItem>
                    </SelectContent>
                  </Select>
                </Campo>
              </div>
            </>
          )}

          {/* 3. Responsável e endereço */}
          {etapa === 2 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Parentesco com o aluno" obrigatorio>
                  <Select value={parentesco} onValueChange={setParentesco}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {PARENTESCOS.map((p) => (
                        <SelectItem key={p.valor} value={String(p.valor)}>
                          {p.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Campo>
                {parentesco === "5" && (
                  <Campo label="Qual?">
                    <Input
                      value={parentescoOutro}
                      onChange={(e) => setParentescoOutro(e.target.value)}
                    />
                  </Campo>
                )}
                <Campo label="Nome completo do responsável" obrigatorio>
                  <Input
                    value={nomeResponsavel}
                    onChange={(e) => setNomeResponsavel(e.target.value)}
                  />
                </Campo>
                <Campo label="RG do responsável">
                  <Input
                    value={rgResponsavel}
                    onChange={(e) => setRgResponsavel(e.target.value)}
                  />
                </Campo>
                <Campo label="CPF do responsável">
                  <Input
                    value={cpfResponsavel}
                    onChange={(e) => setCpfResponsavel(e.target.value)}
                  />
                </Campo>
                <Campo
                  label="WhatsApp"
                  obrigatorio
                  dica="Será incluído no grupo de recados"
                >
                  <Input
                    inputMode="tel"
                    placeholder="(47) 99999-9999"
                    value={whatsApp}
                    onChange={(e) => setWhatsApp(formatarTelefone(e.target.value))}
                  />
                </Campo>
                <Campo label="Telefone 2">
                  <Input
                    inputMode="tel"
                    placeholder="(47) 3333-3333"
                    value={telefone2}
                    onChange={(e) => setTelefone2(formatarTelefone(e.target.value))}
                  />
                </Campo>
              </div>

              <p className="pt-2 text-sm font-semibold">Endereço</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Rua" obrigatorio>
                  <Input value={rua} onChange={(e) => setRua(e.target.value)} />
                </Campo>
                <Campo label="Número" obrigatorio>
                  <Input value={numero} onChange={(e) => setNumero(e.target.value)} />
                </Campo>
                <Campo label="Complemento">
                  <Input
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value)}
                  />
                </Campo>
                <Campo label="Bairro" obrigatorio>
                  <Input
                    list="lista-bairros"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    placeholder="Comece a digitar…"
                  />
                  <datalist id="lista-bairros">
                    {BAIRROS.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </Campo>
                <Campo label="Cidade" obrigatorio>
                  <Input value={cidade} onChange={(e) => setCidade(e.target.value)} />
                </Campo>
              </div>
            </>
          )}

          {/* 4. Saúde */}
          {etapa === 3 && (
            <>
              <div className="rounded-md border border-border bg-secondary/30 p-3">
                <p className="text-sm font-semibold">
                  Questionário de Aptidão para Atividade Física
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Exigido pela Lei nº 16.331/2014. Responda pensando no{" "}
                  <strong>aluno</strong>. É renovado a cada ano.
                </p>
              </div>

              {PARQ.map((p, i) => (
                <div key={p.id} className="space-y-2 border-b border-border pb-4 last:border-0">
                  <p className="text-sm">
                    <span className="mr-1 font-medium text-muted-foreground">{i + 1}.</span>
                    {p.texto}
                  </p>
                  <SimNao
                    valor={saude.parq[p.id]}
                    onChange={(v) =>
                      setSaude((s) => ({ ...s, parq: { ...s.parq, [p.id]: v } }))
                    }
                  />
                </div>
              ))}

              {precisaTermoResponsabilidade && (
                <div className="rounded-md border border-warning/40 bg-warning/10 p-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-warning">
                    <CircleAlert className="size-4" />
                    Termo de Responsabilidade
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/85">
                    {TERMO_RESPONSABILIDADE}
                  </p>
                  <div className="mt-3">
                    <Marcavel
                      marcado={saude.aceitouTermoResponsabilidade}
                      onToggle={() =>
                        setSaude((s) => ({
                          ...s,
                          aceitouTermoResponsabilidade: !s.aceitouTermoResponsabilidade,
                        }))
                      }
                    >
                      Li e assumo a responsabilidade descrita acima.
                    </Marcavel>
                  </div>
                </div>
              )}

              <p className="pt-2 text-sm font-semibold">
                Informações de saúde{" "}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Ajuda o professor a cuidar melhor do aluno durante a aula.
              </p>

              <Campo label="O aluno tem alguma dessas condições?">
                <div className="grid gap-2 sm:grid-cols-2">
                  {CONDICOES.map((c) => (
                    <Marcavel
                      key={c}
                      marcado={saude.condicoes.includes(c)}
                      onToggle={() =>
                        setSaude((s) => ({ ...s, condicoes: alternar(s.condicoes, c) }))
                      }
                    >
                      {c}
                    </Marcavel>
                  ))}
                </div>
              </Campo>
              <Campo label="Outra condição">
                <Input
                  value={saude.condicaoOutra}
                  onChange={(e) => setSaude((s) => ({ ...s, condicaoOutra: e.target.value }))}
                />
              </Campo>

              <Campo label="Sente alguma dessas dores?">
                <div className="grid gap-2 sm:grid-cols-2">
                  {SINTOMAS.map((c) => (
                    <Marcavel
                      key={c}
                      marcado={saude.sintomas.includes(c)}
                      onToggle={() =>
                        setSaude((s) => ({ ...s, sintomas: alternar(s.sintomas, c) }))
                      }
                    >
                      {c}
                    </Marcavel>
                  ))}
                </div>
              </Campo>

              <Campo
                label="Medicamentos em uso"
                dica="Nome e motivo. Deixe em branco se não usa nenhum."
              >
                <Textarea
                  rows={3}
                  value={saude.medicamentos}
                  onChange={(e) => setSaude((s) => ({ ...s, medicamentos: e.target.value }))}
                />
              </Campo>

              <Campo label="Já fez acompanhamento com algum profissional?">
                <div className="grid gap-2 sm:grid-cols-2">
                  {ACOMPANHAMENTOS.map((c) => (
                    <Marcavel
                      key={c}
                      marcado={saude.acompanhamentos.includes(c)}
                      onToggle={() =>
                        setSaude((s) => ({
                          ...s,
                          acompanhamentos: alternar(s.acompanhamentos, c),
                        }))
                      }
                    >
                      {c}
                    </Marcavel>
                  ))}
                </div>
              </Campo>

              <Campo label="Objetivos com o jiu-jitsu">
                <div className="grid gap-2 sm:grid-cols-2">
                  {OBJETIVOS.map((c) => (
                    <Marcavel
                      key={c}
                      marcado={saude.objetivos.includes(c)}
                      onToggle={() =>
                        setSaude((s) => ({ ...s, objetivos: alternar(s.objetivos, c) }))
                      }
                    >
                      {c}
                    </Marcavel>
                  ))}
                </div>
              </Campo>

              <Campo label="Motivos para matricular no instituto">
                <div className="grid gap-2 sm:grid-cols-2">
                  {MOTIVOS_MATRICULA.map((m) => (
                    <Marcavel
                      key={m}
                      marcado={familiar.motivos.includes(m)}
                      onToggle={() =>
                        setFamiliar((f) => ({ ...f, motivos: alternar(f.motivos, m) }))
                      }
                    >
                      {m}
                    </Marcavel>
                  ))}
                </div>
              </Campo>
            </>
          )}

          {/* 5. Termos */}
          {etapa === 4 && (
            <>
              <BlocoTermo titulo="Termo de participação" texto={TERMO_PARTICIPACAO} />
              <Marcavel marcado={aceitouTermo} onToggle={() => setAceitouTermo(!aceitouTermo)}>
                Li e concordo com o termo de participação.{" "}
                <span className="text-destructive">*</span>
              </Marcavel>

              <BlocoTermo titulo="Comodato de kimono e faixa" texto={TERMO_COMODATO} />
              <Marcavel
                marcado={aceitouComodato}
                onToggle={() => setAceitouComodato(!aceitouComodato)}
              >
                Estou ciente do empréstimo do uniforme e da devolução ao fim do ano.{" "}
                <span className="text-destructive">*</span>
              </Marcavel>

              <BlocoTermo titulo="Uso de imagem e voz" texto={TERMO_IMAGEM} />
              <Marcavel
                marcado={aceitouImagem}
                onToggle={() => setAceitouImagem(!aceitouImagem)}
              >
                Autorizo o uso de imagem e voz.{" "}
                <span className="text-muted-foreground">(opcional)</span>
              </Marcavel>

              <div className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium">Foto do aluno (opcional)</p>
                <p className="mb-2 text-xs text-muted-foreground">
                  {ORIENTACAO_FOTO}
                </p>
                <div className="flex items-center gap-3">
                  {fotoPreview ? (
                    <img
                      src={fotoPreview}
                      alt="Prévia"
                      className="size-16 rounded-full border border-border object-cover"
                    />
                  ) : (
                    <span className="flex size-16 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground">
                      <Camera className="size-5" />
                    </span>
                  )}
                  <input
                    ref={fotoRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={escolherFoto}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fotoRef.current?.click()}
                    disabled={enviandoFoto}
                  >
                    {enviandoFoto ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Camera className="size-4" />
                    )}
                    {fotoInscricaoId ? "Trocar foto" : "Tirar/escolher foto"}
                  </Button>
                  {fotoInscricaoId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFotoInscricaoId(null);
                        setFotoPreview(null);
                      }}
                    >
                      Remover
                    </Button>
                  )}
                </div>
              </div>

              <BlocoTermo titulo="Tratamento de dados (LGPD)" texto={TERMO_LGPD} />
              <Marcavel marcado={aceitouLgpd} onToggle={() => setAceitouLgpd(!aceitouLgpd)}>
                Autorizo o tratamento dos dados nos termos acima.{" "}
                <span className="text-destructive">*</span>
              </Marcavel>

              <p className="text-xs text-muted-foreground">{PRAZO_FILIACAO(ano)}</p>

              <Campo
                label="Nome completo do responsável (assinatura)"
                obrigatorio
                dica="Ao escrever seu nome, você confirma os termos aceitos acima."
              >
                <Input
                  value={assinatura}
                  onChange={(e) => setAssinatura(e.target.value)}
                  placeholder="Digite seu nome completo"
                />
              </Campo>
            </>
          )}
        </CardContent>
      </Card>

      {/* Navegação */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() =>
            etapa === 0 ? navigate("/") : setEtapa((e) => Math.max(e - 1, 0))
          }
          disabled={enviar.isPending}
        >
          <ArrowLeft className="size-4" />
          {etapa === 0 ? "Voltar ao início" : "Voltar"}
        </Button>

        {etapa < ETAPAS.length - 1 ? (
          <Button onClick={avancar}>
            Continuar
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button onClick={submeter} disabled={enviar.isPending}>
            {enviar.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Enviar inscrição
          </Button>
        )}
      </div>
    </div>
    </PaginaPublica>
  );
}
