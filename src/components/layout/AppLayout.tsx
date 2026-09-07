import { Suspense, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { useAuth } from "@/features/auth/AuthContext";
import { navGroups, coletarFolhas } from "@/components/layout/navConfig";
import { useDocumentoPadraoRemoto } from "@/features/configuracoes/configuracaoDocumentoApi";
import { AvisosPendentes } from "@/features/avisos/AvisosPendentes";
import { BotaoVoltarAoTopo } from "@/components/BotaoVoltarAoTopo";
import { cn } from "@/lib/utils";

function tituloDaRota(pathname: string): string {
  const folhas = navGroups.flatMap((g) => coletarFolhas(g.nodes));
  // Casa a rota mais específica (ex.: /alunos antes de /)
  const match = folhas
    .filter((it) => (it.href === "/" ? pathname === "/" : pathname.startsWith(it.href)))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label ?? "Tribo de Davi";
}

// Placeholder enquanto o chunk da página é buscado (primeira visita a uma tela).
// Estrutura leve que lembra o layout comum — título + cartões + lista — com
// varredura de luz (shimmer) e um fade de entrada. Só aparece no carregamento
// do código; o loading dos DADOS de cada página segue por conta dela.
function ConteudoCarregando() {
  return (
    <div className="animate-page-enter-fade space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-md animate-shimmer" />
        <div className="h-4 w-72 max-w-full rounded-md animate-shimmer" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 w-full rounded-lg animate-shimmer" />
        ))}
      </div>
      <div className="h-64 w-full rounded-lg animate-shimmer" />
    </div>
  );
}

export function AppLayout() {
  const location = useLocation();
  const { sessao } = useAuth();
  const admin = sessao?.isAdministrador ?? false;
  const [mobileOpen, setMobileOpen] = useState(false);

  const titulo = tituloDaRota(location.pathname);
  // A barra inferior traz atalhos do dia a dia do PROFESSOR (Aulas/Chamada/
  // Alunos). O admin navega pelo menu lateral, então não a mostramos para ele.
  // Também some na chamada em andamento (/chamada/:id), que já tem barra fixa.
  const mostrarBottomNav =
    !admin && !location.pathname.startsWith("/chamada/");

  // Prima o cache do padrão de documentos (compartilhado via API) para que a
  // exportação de PDF em qualquer tela use o valor mais recente.
  useDocumentoPadraoRemoto();

  // O drawer é só mobile. Ao passar para o desktop (rotação, split-screen,
  // janela redimensionada), fecha — senão o Dialog seguiria travando scroll e
  // foco sem nada visível na tela.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const aoMudar = () => {
      if (mq.matches) setMobileOpen(false);
    };
    mq.addEventListener("change", aoMudar);
    return () => mq.removeEventListener("change", aoMudar);
  }, []);

  // Chave da animação de entrada = pathname: cada navegação re-monta o wrapper e
  // re-dispara o enter. Só o pathname (não a query), para filtros/paginação não
  // re-animarem. Trade-off: navegar entre parâmetros da MESMA rota (ex.:
  // /atletas/1 → /atletas/2) re-monta a página — aceitável e de baixo impacto
  // (os dados vêm do cache do React Query). O ideal (chavear pelo padrão da
  // rota) exigiria a data-router API (createBrowserRouter); aqui usa-se
  // <BrowserRouter>, onde useMatches lança.
  const chaveRota = location.pathname;

  // Entrada de conteúdo ao trocar de rota. Transform+opacidade por padrão; na
  // chamada em andamento fica só-opacidade (tem barra sticky que não deve
  // "saltar" durante os ~220ms da animação).
  const classeEnter = location.pathname.startsWith("/chamada/")
    ? "animate-page-enter-fade"
    : "animate-page-enter";

  return (
    <div className="flex min-h-svh bg-background">
      {/* Sidebar fixa no desktop */}
      <aside className="hidden shrink-0 border-r border-sidebar-border md:block">
        <div className="sticky top-0 h-svh">
          <Sidebar />
        </div>
      </aside>

      {/* Drawer no mobile: Radix Dialog cuida de foco preso, trava de scroll,
          Esc, devolução de foco ao gatilho e da animação de entrada/saída (via
          data-state), tudo com a acessibilidade correta de um modal. */}
      <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className={cn(
              "fixed inset-0 z-50 bg-black/60 duration-200 md:hidden",
              "data-[state=open]:animate-in data-[state=open]:fade-in",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out",
            )}
          />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className={cn(
              "fixed inset-y-0 left-0 z-50 border-r border-sidebar-border shadow-2xl outline-none duration-200 ease-[var(--ease-out-soft)] md:hidden",
              "data-[state=open]:animate-in data-[state=open]:slide-in-from-left",
              "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left",
            )}
          >
            <DialogPrimitive.Title className="sr-only">
              Menu de navegação
            </DialogPrimitive.Title>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar titulo={titulo} onMenu={() => setMobileOpen(true)} />
        <main
          className={cn(
            "flex-1 px-4 pt-4 md:px-6 md:pt-6",
            // Espaço extra embaixo no mobile para o conteúdo não ficar sob a
            // barra de navegação inferior.
            mostrarBottomNav ? "pb-24 md:pb-6" : "pb-4 md:pb-6",
          )}
        >
          <div className="mx-auto w-full max-w-7xl">
            <Suspense fallback={<ConteudoCarregando />}>
              {/* key={chaveRota} re-monta o wrapper quando a rota muda, o que
                  re-dispara a animação CSS de entrada. */}
              <div key={chaveRota} className={classeEnter}>
                <Outlet />
              </div>
            </Suspense>
          </div>
        </main>
      </div>

      {mostrarBottomNav && <BottomNav />}
      {/* No mobile fica acima da navegação inferior; no desktop, junto à base. */}
      <BotaoVoltarAoTopo className={cn(mostrarBottomNav ? "bottom-24" : "bottom-6", "md:bottom-6")} />
      <AvisosPendentes />
    </div>
  );
}
