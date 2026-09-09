import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { CabecalhoSite } from "@/components/site/CabecalhoSite";
import { RodapeSite } from "@/components/site/RodapeSite";
import { BotaoVoltarAoTopo } from "@/components/BotaoVoltarAoTopo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Casca padrão das páginas públicas (fora da home): o cabeçalho e o rodapé
// únicos do site + uma linha de "Voltar". A home tem seu próprio herói e usa os
// mesmos cabeçalho/rodapé por dentro.
export function PaginaPublica({
  children,
  larguraMax = "max-w-5xl",
  voltarPara,
}: {
  children: ReactNode;
  larguraMax?: string;
  // Destino fixo do "Voltar". Use quando o replay do histórico não serve — a
  // tela de login, por exemplo, é alcançada por `replace` após o logout, então
  // as entradas anteriores são rotas protegidas que só redirecionam de volta ao
  // login; nesse caso "voltar" deve significar "sair para a home".
  voltarPara?: string;
}) {
  const navigate = useNavigate();

  // Volta para a página anterior; se não houver histórico interno (link direto,
  // recarga ou redirecionamento), cai na home. Usa o índice do histórico do
  // React Router (idx) — critério confiável: idx === 0 = primeira entrada, então
  // navigate(-1) seria um no-op e vamos para a home.
  const voltar = () => {
    if (voltarPara !== undefined) {
      navigate(voltarPara);
      return;
    }
    const idx =
      (typeof window !== "undefined" &&
        (window.history.state as { idx?: number } | null)?.idx) ||
      0;
    if (idx > 0) navigate(-1);
    else navigate("/");
  };

  return (
    <div className="site-publico flex min-h-svh flex-col bg-background text-foreground">
      <CabecalhoSite />

      <div className={cn("mx-auto w-full px-4 pt-3", larguraMax)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={voltar}
          className="text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar
        </Button>
      </div>

      {/* pb reserva a "zona segura" dos flutuantes do canto inferior direito
          (assistente em bottom-4 e "voltar ao topo" em bottom-20), para que a
          última linha de conteúdo — normalmente a barra Anterior/Próximo dos
          formulários — nunca fique escondida atrás deles. */}
      <main className="flex-1 pb-28">{children}</main>

      <RodapeSite />

      {/* Fica acima do assistente flutuante (bottom-4). */}
      <BotaoVoltarAoTopo className="bottom-20" />
    </div>
  );
}
