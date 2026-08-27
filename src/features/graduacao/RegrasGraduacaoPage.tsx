import { useState } from "react";
import { ScrollText, CalendarClock, Baby, Image as ImageIcon, Calculator } from "lucide-react";
import { useConfigGraduacao } from "@/features/graduacao/graduacaoApi";
import { idadeMinimaDaFaixa } from "@/features/graduacao/regras";
import { OPCOES_FAIXA_BASE, faixaInfo } from "@/features/alunos/faixa";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Página de consulta: regras de graduação da IBJJF (Artigos 2 e 3), o cálculo
// de idade, a tabela de idade mínima aplicada pelo sistema e o pôster oficial
// das faixas. As idades mínimas aqui refletem o que está configurado em
// Parâmetros (que bloqueia a graduação por idade).

// Caminho do pôster oficial (mesma ideia da tabela de golpes proibidos). Basta
// colocar o arquivo em public/faixas/ para ele aparecer.
const POSTER_SRC = "/faixas/poster.webp";

function ChipFaixa({ faixa }: { faixa: number }) {
  const info = faixaInfo(faixa);
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: info.cor, color: info.texto }}
    >
      {info.nome}
    </span>
  );
}

// Categorias de idade da IBJJF (Art. 2.2.2) — idade pela regra do ano.
const CATEGORIAS_IDADE: { cat: string; idade: string }[] = [
  { cat: "Pré-Mirim 1", idade: "4" },
  { cat: "Pré-Mirim 2", idade: "5" },
  { cat: "Pré-Mirim 3", idade: "6" },
  { cat: "Mirim 1", idade: "7" },
  { cat: "Mirim 2", idade: "8" },
  { cat: "Mirim 3", idade: "9" },
  { cat: "Infantil 1", idade: "10" },
  { cat: "Infantil 2", idade: "11" },
  { cat: "Infantil 3", idade: "12" },
  { cat: "Infanto-Juvenil 1", idade: "13" },
  { cat: "Infanto-Juvenil 2", idade: "14" },
  { cat: "Infanto-Juvenil 3", idade: "15" },
  { cat: "Juvenil 1", idade: "16" },
  { cat: "Juvenil 2", idade: "17" },
  { cat: "Adulto", idade: "18 – 29" },
  { cat: "Master 1", idade: "30 – 35" },
  { cat: "Master 2", idade: "36 – 40" },
  { cat: "Master 3", idade: "41 – 45" },
  { cat: "Master 4", idade: "46 – 50" },
  { cat: "Master 5", idade: "51 – 55" },
  { cat: "Master 6", idade: "56 – 60" },
  { cat: "Master 7", idade: "61 e acima" },
];

export function RegrasGraduacaoPage() {
  const { data: cfg } = useConfigGraduacao();
  const parametros = cfg?.parametros;
  const [verPoster, setVerPoster] = useState(false);
  const [posterOk, setPosterOk] = useState(true);
  const anoCorrente = new Date().getFullYear();

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
        <ScrollText className="mt-0.5 size-4 shrink-0" />
        <p>
          Regras de graduação da <span className="font-medium text-foreground">IBJJF</span>{" "}
          (Artigos 2 e 3). A <span className="font-medium text-foreground">idade mínima</span>{" "}
          abaixo é aplicada pelo sistema no registro de graduação — quem não cumpre{" "}
          <span className="font-medium text-foreground">não pode</span> ser graduado à faixa.
          Os valores vêm da tela de <span className="font-medium text-foreground">Parâmetros</span>.
        </p>
      </div>

      {/* Idade mínima aplicada pelo sistema */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Baby className="size-4 text-muted-foreground" />
            Idade mínima por faixa (aplicada pelo sistema)
          </div>
          <div className="flex flex-wrap gap-2">
            {OPCOES_FAIXA_BASE.map(({ valor }) => {
              const min = idadeMinimaDaFaixa(valor, parametros);
              return (
                <div
                  key={valor}
                  className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5"
                >
                  <ChipFaixa faixa={valor} />
                  <span className="text-sm tabular-nums">
                    {min > 0 ? `${min}+ anos` : "qualquer idade"}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Como calcular a idade */}
      <Card>
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Calculator className="size-4 text-muted-foreground" />
            Como a idade é calculada (Art. 2.2.1)
          </div>
          <p className="text-sm text-muted-foreground">
            A idade que vale para a mudança de faixa é a que o atleta{" "}
            <span className="font-medium text-foreground">completa no ano corrente</span> — não
            a idade em anos completos:
          </p>
          <p className="rounded-md bg-secondary/60 px-3 py-2 text-center text-sm font-medium">
            ano corrente − ano de nascimento = idade do atleta
          </p>
          <p className="text-xs text-muted-foreground">
            Ex.: em {anoCorrente}, um aluno nascido em {anoCorrente - 10} tem, pela regra,{" "}
            <span className="font-medium text-foreground">10 anos</span> — já elegível à faixa
            Laranja, mesmo que ainda não tenha feito aniversário.
          </p>
        </CardContent>
      </Card>

      {/* Artigo 2 — idades mínimas (texto oficial resumido) */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <h2 className="text-sm font-semibold">Artigo 2 — Idades mínimas</h2>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Atletas de 4 a 15 anos
            </p>
            <ul className="space-y-1 text-sm">
              <li>• <span className="font-medium">Branca:</span> qualquer idade</li>
              <li>• <span className="font-medium">Grupo Cinza</span> (Cinza/Branca, Cinza, Cinza/Preta): 4 a 15 anos</li>
              <li>• <span className="font-medium">Grupo Amarela</span> (Amarela/Branca, Amarela, Amarela/Preta): 7 a 15 anos</li>
              <li>• <span className="font-medium">Grupo Laranja</span> (Laranja/Branca, Laranja, Laranja/Preta): 10 a 15 anos</li>
              <li>• <span className="font-medium">Grupo Verde</span> (Verde/Branca, Verde, Verde/Preta): 13 a 15 anos</li>
            </ul>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Atletas a partir de 16 anos
            </p>
            <ul className="space-y-1 text-sm">
              <li>• <span className="font-medium">Branca:</span> qualquer idade</li>
              <li>• <span className="font-medium">Azul:</span> 16 anos ou mais</li>
              <li>• <span className="font-medium">Roxa:</span> 16 anos ou mais</li>
              <li>• <span className="font-medium">Marrom:</span> 18 anos ou mais</li>
              <li>• <span className="font-medium">Preta:</span> 18 anos ou mais*</li>
            </ul>
            <p className="mt-1 text-xs text-muted-foreground">
              *18 anos apenas para campeões mundiais adultos na faixa marrom. Vermelha e Preta:
              49+; Vermelha e Branca: 56+; Vermelha: 66+.
            </p>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Ao completar 16 anos — Juvenil (Art. 2.2.3)
            </p>
            <ul className="space-y-1 text-sm">
              <li>• Branca mantém-se Branca</li>
              <li>• Cinza, Amarela e Laranja tornam-se Azul</li>
              <li>• Verde torna-se Azul ou Roxa (decisão do professor)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de categorias de idade */}
      <Card>
        <CardContent className="space-y-2 p-4">
          <h2 className="text-sm font-semibold">Categorias de idade (Art. 2.2.2)</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
            {CATEGORIAS_IDADE.map((c) => (
              <div
                key={c.cat}
                className="flex items-center justify-between border-b border-border/50 py-0.5 text-sm"
              >
                <span className="text-muted-foreground">{c.cat}</span>
                <span className="font-medium tabular-nums">{c.idade}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Artigo 3 — períodos mínimos */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CalendarClock className="size-4 text-muted-foreground" />
            Artigo 3 — Períodos mínimos de permanência
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Atletas de 4 a 15 anos
            </p>
            <p className="text-sm">
              <span className="font-medium">Não há</span> período mínimo de permanência em cada
              faixa.
            </p>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              A partir dos 18 anos (Adulto)
            </p>
            <ul className="space-y-1 text-sm">
              <li>• <span className="font-medium">Branca:</span> sem tempo mínimo</li>
              <li>• <span className="font-medium">Azul:</span> 2 anos (1 ano com cadastro anterior em Cinza/Amarela/Laranja; sem mínimo se veio da Verde)</li>
              <li>• <span className="font-medium">Roxa:</span> 1 ano e meio (1 ano se veio da Azul Juvenil)</li>
              <li>• <span className="font-medium">Marrom:</span> 1 ano</li>
            </ul>
            <p className="mt-1 text-xs text-muted-foreground">
              Os prazos contam a partir do cadastro na faixa. O sistema não bloqueia por tempo
              nesta versão (a graduação infantil não tem período mínimo); use os{" "}
              <span className="font-medium text-foreground">Parâmetros</span> para exigir tempo
              mínimo de aptidão ao exame.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pôster oficial das faixas */}
      <Card>
        <CardContent className="space-y-2 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ImageIcon className="size-4 text-muted-foreground" />
              Pôster oficial das faixas
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => setVerPoster((v) => !v)}
            >
              {verPoster ? "Ocultar" : "Ver"} pôster
            </Button>
          </div>

          {verPoster &&
            (posterOk ? (
              <div className="overflow-x-auto">
                <a href={POSTER_SRC} target="_blank" rel="noreferrer" title="Abrir em tamanho cheio">
                  <img
                    src={POSTER_SRC}
                    alt="Pôster oficial das faixas por idade (IBJJF)"
                    className="min-w-[700px] rounded"
                    onError={() => setPosterOk(false)}
                  />
                </a>
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                Pôster ainda não adicionado. Coloque a imagem em{" "}
                <code className="rounded bg-secondary px-1">public/faixas/poster.webp</code> para
                exibi-la aqui.
              </p>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
