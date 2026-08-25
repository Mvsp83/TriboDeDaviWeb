// Modelo (template) editável do Relatório de Atividades. O TEXTO das seções é
// salvo no navegador (é o "modelo" reutilizável a cada ano); as FOTOS são
// escolhidas na hora de gerar e embutidas no PDF (não ficam guardadas).
import { abrirParaImpressao, esc } from "@/lib/impressaoDocumento";

export interface SecaoRelatorio {
  id: string;
  titulo: string;
  corpo: string;
}

export interface ModeloRelatorio {
  titulo: string;
  subtitulo: string;
  secoes: SecaoRelatorio[];
}

// Foto usada só na geração do PDF (data URL em memória, não persistida).
export interface FotoRelatorio {
  id: string;
  dataUrl: string;
  legenda: string;
}

const CHAVE = "tribo:relatorio-atividades-modelo";

export const MODELO_DEFAULT: ModeloRelatorio = {
  titulo: "Relatório de Atividades",
  subtitulo: "Instituto Tribo de Davi",
  secoes: [
    {
      id: "apresentacao",
      titulo: "Apresentação",
      corpo:
        "O Instituto Tribo de Davi utiliza o jiu-jitsu como ferramenta de transformação social, oferecendo aulas gratuitas a crianças e adolescentes. Este relatório apresenta as atividades realizadas no período.",
    },
    {
      id: "atividades",
      titulo: "Atividades desenvolvidas",
      corpo:
        "Descreva as principais atividades do ano: treinos, projetos, participações em eventos e ações com as famílias.",
    },
    {
      id: "alcance",
      titulo: "Alcance e números",
      corpo:
        "Use o botão \"Preencher números do ano\" para trazer os dados do sistema, ou escreva aqui.",
    },
    {
      id: "destaques",
      titulo: "Depoimentos e destaques",
      corpo: "Depoimentos de famílias, conquistas de alunos e destaques do ano.",
    },
    {
      id: "final",
      titulo: "Considerações finais",
      corpo:
        "Desafios enfrentados, parcerias, agradecimentos e metas para o próximo período.",
    },
  ],
};

export function carregarModelo(): ModeloRelatorio {
  try {
    const cru = localStorage.getItem(CHAVE);
    if (!cru) return MODELO_DEFAULT;
    const m = JSON.parse(cru) as Partial<ModeloRelatorio>;
    return {
      titulo: m.titulo ?? MODELO_DEFAULT.titulo,
      subtitulo: m.subtitulo ?? MODELO_DEFAULT.subtitulo,
      secoes: m.secoes ?? MODELO_DEFAULT.secoes,
    };
  } catch {
    return MODELO_DEFAULT;
  }
}

export function salvarModelo(m: ModeloRelatorio): void {
  localStorage.setItem(CHAVE, JSON.stringify(m));
}

// Monta o corpo HTML do PDF: seções de texto + registro fotográfico.
function corpoHtml(modelo: ModeloRelatorio, fotos: FotoRelatorio[]): string {
  const secoes = modelo.secoes
    .filter((s) => s.titulo.trim() || s.corpo.trim())
    .map((s) => {
      const corpo = s.corpo
        .split(/\n{2,}/)
        .map(
          (p) =>
            `<p style="margin:0 0 8px;line-height:1.5;">${p
              .split("\n")
              .map(esc)
              .join("<br>")}</p>`,
        )
        .join("");
      return `<h2 style="font-size:14px;margin:16px 0 6px;">${esc(s.titulo)}</h2>${corpo}`;
    })
    .join("");

  const galeria = fotos.length
    ? `<h2 style="font-size:14px;margin:18px 0 8px;">Registro fotográfico</h2>
       <div style="display:flex;flex-wrap:wrap;gap:10px;">
         ${fotos
           .map(
             (f) => `<figure style="width:48%;margin:0;break-inside:avoid;">
               <img src="${f.dataUrl}" style="width:100%;border-radius:6px;display:block;" />
               ${f.legenda.trim() ? `<figcaption style="font-size:11px;color:#666;margin-top:3px;">${esc(f.legenda)}</figcaption>` : ""}
             </figure>`,
           )
           .join("")}
       </div>`
    : "";

  return `${secoes}${galeria}`;
}

// Abre a janela de impressão (salvar como PDF) do relatório montado.
export function imprimirRelatorio(
  modelo: ModeloRelatorio,
  ano: number,
  fotos: FotoRelatorio[],
): boolean {
  return abrirParaImpressao({
    titulo: `${modelo.titulo} — ${ano}`,
    subtitulo: modelo.subtitulo,
    corpoHtml: corpoHtml(modelo, fotos),
  });
}
