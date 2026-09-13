import { useState } from "react";
import { DocumentosContabeisPage } from "@/features/administrativo/DocumentosContabeisPage";
import { CategoriaDocumento } from "@/types";
import { cn } from "@/lib/utils";

// Documentos institucionais/de governança da ONG, organizados por categoria
// (cada aba é uma subpasta própria no Drive). Reutiliza o gerenciador de
// arquivos do Drive, só trocando a categoria conforme a aba ativa.
const ABAS: {
  id: CategoriaDocumento;
  label: string;
  descricao: string;
}[] = [
  {
    id: CategoriaDocumento.Estatuto,
    label: "Estatuto",
    descricao: "Estatuto social vigente da entidade.",
  },
  {
    id: CategoriaDocumento.AlteracoesEstatuto,
    label: "Alterações",
    descricao: "Alterações e aditamentos ao estatuto ao longo do tempo.",
  },
  {
    id: CategoriaDocumento.Atas,
    label: "Atas",
    descricao: "Atas de assembleias e reuniões de diretoria.",
  },
  {
    id: CategoriaDocumento.Pareceres,
    label: "Pareceres",
    descricao: "Pareceres jurídicos, contábeis ou técnicos.",
  },
  {
    id: CategoriaDocumento.OutrosDocumentos,
    label: "Outros",
    descricao: "Demais documentos institucionais que não se encaixam acima.",
  },
];

export function DocumentosInstitucionaisPage() {
  const [aba, setAba] = useState<CategoriaDocumento>(ABAS[0].id);
  const ativa = ABAS.find((a) => a.id === aba) ?? ABAS[0];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Documentos Institucionais</h1>
        <p className="text-sm text-muted-foreground">
          Guarde os documentos oficiais da entidade organizados por categoria —
          envie, baixe e visualize os arquivos.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5" role="tablist">
        {ABAS.map((a) => {
          const ativo = aba === a.id;
          return (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={ativo}
              onClick={() => setAba(a.id)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                ativo
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary",
              )}
            >
              {a.label}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground">{ativa.descricao}</p>

      {/* Uma instância por categoria (key) para o estado interno resetar ao
          trocar de aba. O cabeçalho fica escondido — esta tela já tem o seu. */}
      <DocumentosContabeisPage
        key={ativa.id}
        categoria={ativa.id}
        titulo={ativa.label}
        descricao={ativa.descricao}
        mostrarCabecalho={false}
      />
    </div>
  );
}
