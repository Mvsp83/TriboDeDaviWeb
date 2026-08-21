import { Suspense, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { navGroups, coletarFolhas } from "@/components/layout/navConfig";
import { useDocumentoPadraoRemoto } from "@/features/configuracoes/configuracaoDocumentoApi";
import { AvisosPendentes } from "@/features/avisos/AvisosPendentes";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function tituloDaRota(pathname: string): string {
  const folhas = navGroups.flatMap((g) => coletarFolhas(g.nodes));
  // Casa a rota mais específica (ex.: /alunos antes de /)
  const match = folhas
    .filter((it) => (it.href === "/" ? pathname === "/" : pathname.startsWith(it.href)))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label ?? "Tribo de Davi";
}

export function AppLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const titulo = tituloDaRota(location.pathname);
  // Na chamada em andamento (/chamada/:id) já há barra fixa de "Salvar", então
  // escondemos a navegação inferior para não conflitar.
  const mostrarBottomNav = !location.pathname.startsWith("/chamada/");

  // Prima o cache do padrão de documentos (compartilhado via API) para que a
  // exportação de PDF em qualquer tela use o valor mais recente.
  useDocumentoPadraoRemoto();

  return (
    <div className="flex min-h-svh bg-background">
      {/* Sidebar fixa no desktop */}
      <aside className="hidden shrink-0 border-r border-sidebar-border md:block">
        <div className="sticky top-0 h-svh">
          <Sidebar />
        </div>
      </aside>

      {/* Drawer no mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className={cn(
              "absolute inset-y-0 left-0 border-r border-sidebar-border shadow-2xl",
              "animate-in slide-in-from-left duration-200",
            )}
          >
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

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
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>

      {mostrarBottomNav && <BottomNav />}
      <AvisosPendentes />
    </div>
  );
}
