import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { MODULOS, type ModuloId } from "@/config/modulos";

// Tela mostrada quando a conta tenta acessar uma área de um módulo que não
// contratou. Ponto natural de upsell ("Contrate este módulo").
export function ModuloIndisponivel({ modulo }: { modulo: ModuloId }) {
  const info = MODULOS[modulo];

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="size-7" />
        </div>
        <h1 className="text-xl font-semibold">Módulo não contratado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          O módulo{" "}
          <strong className="text-foreground">{info?.nome ?? modulo}</strong>{" "}
          não está incluído no seu plano atual.
        </p>
        {info?.descricao && (
          <p className="mt-1 text-sm text-muted-foreground">{info.descricao}</p>
        )}
        <p className="mt-4 text-sm text-muted-foreground">
          Fale com o suporte para habilitá-lo.
        </p>
        <Link
          to="/painel"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Voltar ao painel
        </Link>
      </div>
    </div>
  );
}
