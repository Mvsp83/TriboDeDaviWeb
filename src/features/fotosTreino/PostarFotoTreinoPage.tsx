import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, ImagePlus, Loader2, Send, CalendarX } from "lucide-react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/features/auth/AuthContext";
import { usePolos } from "@/features/polos/polosApi";
import { useAulas } from "@/features/aulas/aulasApi";
import {
  useEnviarFotoTreino,
  comprimirImagem,
  CATEGORIA_LABEL,
  type CategoriaFoto,
} from "@/features/fotosTreino/fotosTreinoApi";
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

export function PostarFotoTreinoPage() {
  const { sessao } = useAuth();
  const admin = sessao?.isAdministrador ?? false;
  const { data: polos } = usePolos();
  const { data: aulas } = useAulas(admin);
  const enviar = useEnviarFotoTreino();
  const hoje = new Date().toISOString().slice(0, 10);

  // Professor só posta treino do polo; admin pode escolher a coleção.
  const [categoria, setCategoria] = useState<CategoriaFoto>("polo");
  const ehPolo = categoria === "polo";
  const [poloId, setPoloId] = useState<string>(
    sessao?.poloId != null ? String(sessao.poloId) : "",
  );
  const [turma, setTurma] = useState("");
  const [dataAula, setDataAula] = useState(hoje);
  const [legenda, setLegenda] = useState("");
  const [consentimento, setConsentimento] = useState(true);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const previewUrl = useMemo(
    () => (arquivo ? URL.createObjectURL(arquivo) : null),
    [arquivo],
  );

  // Polo cujas aulas alimentam os seletores: o professor usa o próprio; o admin
  // usa o que escolheu. Sem polo definido, não há aulas para oferecer.
  const poloEfetivo = admin
    ? poloId
      ? Number(poloId)
      : null
    : sessao?.poloId ?? null;

  // Aulas do polo já realizadas (data <= hoje): a foto se amarra a uma delas,
  // então turma e data só podem sair daqui. Mais recentes primeiro.
  const aulasDoPolo = useMemo(() => {
    if (!ehPolo || poloEfetivo == null) return [];
    return (aulas ?? [])
      .filter((a) => a.poloId === poloEfetivo && a.data.slice(0, 10) <= hoje)
      .sort((a, b) => b.data.slice(0, 10).localeCompare(a.data.slice(0, 10)));
  }, [aulas, ehPolo, poloEfetivo, hoje]);

  // Aula escolhida = a que casa com turma + data atuais (turma e data sempre
  // saem juntas de uma mesma aula, então nunca ficam descompassadas).
  const aulaSelecionada = useMemo(
    () =>
      aulasDoPolo.find(
        (a) => a.turma === Number(turma) && a.data.slice(0, 10) === dataAula,
      ) ?? null,
    [aulasDoPolo, turma, dataAula],
  );

  // Mantém a seleção válida: escolhe a aula mais recente ao trocar de polo, e
  // limpa se o polo não tem aulas. Em coleção não-polo, a data é livre.
  useEffect(() => {
    if (!ehPolo) {
      if (!dataAula) setDataAula(hoje);
      return;
    }
    if (aulaSelecionada) return; // já válida
    if (aulasDoPolo.length === 0) {
      if (turma || dataAula) {
        setTurma("");
        setDataAula("");
      }
    } else {
      const a = aulasDoPolo[0];
      setTurma(String(a.turma));
      setDataAula(a.data.slice(0, 10));
    }
  }, [ehPolo, aulasDoPolo, aulaSelecionada, turma, dataAula, hoje]);

  const semAulasNoPolo = ehPolo && poloEfetivo != null && aulasDoPolo.length === 0;
  const fmtData = (yyyyMMdd: string) =>
    new Date(`${yyyyMMdd}T00:00:00`).toLocaleDateString("pt-BR");

  function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (f && !f.type.startsWith("image/")) {
      toast.warning("Selecione um arquivo de imagem.");
      return;
    }
    setArquivo(f);
  }

  async function enviarFoto() {
    if (!arquivo) {
      toast.warning("Escolha uma foto.");
      return;
    }
    if (ehPolo && admin && !poloId) {
      toast.warning("Selecione o polo.");
      return;
    }
    if (ehPolo) {
      // A foto precisa se vincular a uma aula existente (mesma turma e data).
      const temAula = aulasDoPolo.some(
        (a) => a.turma === Number(turma) && a.data.slice(0, 10) === dataAula,
      );
      if (!temAula) {
        toast.warning(
          "Escolha uma turma e uma data com aula cadastrada. Sem aula, crie-a primeiro em Aula › Aulas.",
        );
        return;
      }
    }
    if (!dataAula) {
      toast.warning("Informe a data.");
      return;
    }
    if (!consentimento) {
      toast.warning("Confirme a autorização de imagem para publicar.");
      return;
    }
    try {
      const blob = await comprimirImagem(arquivo);
      await enviar.mutateAsync({
        categoria,
        dataAula,
        legenda,
        arquivo: blob,
        turma: ehPolo ? Number(turma) : undefined,
        poloId: ehPolo && admin && poloId ? Number(poloId) : undefined,
      });
      toast.success(
        ehPolo
          ? "Foto enviada! Ficará visível no site após a aprovação."
          : "Foto publicada no álbum!",
      );
      setArquivo(null);
      setLegenda("");
      setConsentimento(true);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao enviar a foto.");
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-start gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
        <Camera className="mt-0.5 size-4 shrink-0" />
        <p>
          {ehPolo ? (
            <>
              Poste <span className="font-medium text-foreground">1 foto por turma por aula</span>{" "}
              para o álbum do polo. Postar de novo para a mesma aula substitui a anterior.
              Conforme a configuração do polo, pode passar por{" "}
              <span className="font-medium text-foreground">aprovação</span> antes de aparecer.
            </>
          ) : (
            <>
              Foto para a coleção{" "}
              <span className="font-medium text-foreground">{CATEGORIA_LABEL[categoria]}</span> do
              site. Como admin, ela é <span className="font-medium text-foreground">publicada
              direto</span> no álbum público.
            </>
          )}
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          {admin && (
            <div>
              <Label className="mb-1.5">Coleção</Label>
              <Select
                value={categoria}
                onValueChange={(v) => {
                  const c = v as CategoriaFoto;
                  setCategoria(c);
                  if (c !== "polo" && !dataAula) setDataAula(hoje);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="polo">Treino de polo</SelectItem>
                  <SelectItem value="graduacoes">{CATEGORIA_LABEL.graduacoes}</SelectItem>
                  <SelectItem value="geral">{CATEGORIA_LABEL.geral}</SelectItem>
                  <SelectItem value="eventos">{CATEGORIA_LABEL.eventos}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {ehPolo && admin && (
            <div>
              <Label className="mb-1.5">Polo</Label>
              <Select value={poloId} onValueChange={setPoloId}>
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
            </div>
          )}

          {ehPolo ? (
            <div>
              <Label className="mb-1.5">Aula</Label>
              <Select
                value={aulaSelecionada ? String(aulaSelecionada.id) : ""}
                onValueChange={(id) => {
                  const a = aulasDoPolo.find((x) => String(x.id) === id);
                  if (a) {
                    setTurma(String(a.turma));
                    setDataAula(a.data.slice(0, 10));
                  }
                }}
                disabled={aulasDoPolo.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a aula" />
                </SelectTrigger>
                <SelectContent>
                  {aulasDoPolo.map((a) => {
                    const d = a.data.slice(0, 10);
                    return (
                      <SelectItem key={a.id} value={String(a.id)}>
                        Turma {a.turma} · {fmtData(d)} · {a.horaInicio.slice(0, 5)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <Label className="mb-1.5">Data da foto</Label>
              <Input
                type="date"
                value={dataAula}
                max={hoje}
                onChange={(e) => setDataAula(e.target.value)}
              />
            </div>
          )}

          {semAulasNoPolo && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-300">
              <CalendarX className="mt-0.5 size-4 shrink-0" />
              <span>
                Nenhuma aula cadastrada para este polo. Crie a aula em{" "}
                <span className="font-medium">Aula › Aulas</span> antes de postar a foto —
                a foto fica vinculada a uma aula.
              </span>
            </div>
          )}

          <div>
            <Label className="mb-1.5">Foto</Label>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={escolher}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-8 text-sm text-muted-foreground hover:bg-secondary/50"
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Prévia"
                  className="max-h-56 w-auto rounded-md object-contain"
                />
              ) : (
                <>
                  <ImagePlus className="size-6" />
                  Escolher imagem
                </>
              )}
            </button>
            {arquivo && (
              <p className="mt-1 text-xs text-muted-foreground">
                {arquivo.name} — será redimensionada e comprimida no envio.
              </p>
            )}
          </div>

          <div>
            <Label className="mb-1.5">Legenda (opcional)</Label>
            <Textarea
              rows={2}
              maxLength={300}
              placeholder="ex: Treino de quedas da turma da manhã"
              value={legenda}
              onChange={(e) => setLegenda(e.target.value)}
            />
          </div>

          <label className="flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-primary"
              checked={consentimento}
              onChange={(e) => setConsentimento(e.target.checked)}
            />
            <span className="text-muted-foreground">
              Confirmo que <span className="font-medium text-foreground">todas as pessoas
              na foto têm autorização de uso de imagem</span> (LGPD).
            </span>
          </label>

          <Button
            className="w-full"
            onClick={enviarFoto}
            disabled={enviar.isPending || (ehPolo && (!turma || !dataAula))}
          >
            {enviar.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Enviar foto
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
