import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LogOut, X, ChevronRight } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import {
  navGroups,
  filtrarPorPapel,
  isBranch,
  type NavNode,
  type NavLeaf,
  type NavBranch,
} from "@/components/layout/navConfig";
import { LogoLockup } from "@/components/Logo";
import { useAlunosSemTurma } from "@/features/alunos/alunosApi";
import { cn } from "@/lib/utils";

// Badge (contador) do menu — some quando zero.
function NavBadge({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span className="ml-auto inline-flex min-w-[18px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-semibold leading-5 text-black">
      {n > 99 ? "99+" : n}
    </span>
  );
}

// Cor de cada pilar (nível 0). A cor "desce" para os filhos, agrupando
// visualmente as opções. No item ativo, o dourado da marca assume.
const CORES_SECAO: Record<string, string> = {
  Dashboard: "#38bdf8",
  Operacional: "#34d399",
  Administrativo: "#a78bfa",
  Financeiro: "#a3e635",
  Relatórios: "#c084fc",
  Loja: "#f472b6",
  Configurações: "#f59e0b",
};

function rotaAtiva(href: string, pathname: string): boolean {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

function contemAtivo(node: NavNode, pathname: string): boolean {
  return isBranch(node)
    ? node.children.some((c) => contemAtivo(c, pathname))
    : rotaAtiva(node.href, pathname);
}

interface NodeProps {
  node: NavNode;
  depth: number;
  cor: string;
  onNavigate?: () => void;
  // Resolve o contador (badge) de um nó: folha usa sua própria chave; ramo soma
  // a subárvore (para borbulhar o total ao pilar quando fechado).
  getBadge: (node: NavNode) => number;
  // Abertura controlada de fora (usada nos pilares de nível 0, para manter só
  // um aberto por vez). Sem isto, o ramo controla o próprio estado.
  aberto?: boolean;
  onAlternar?: () => void;
}

function NavNodeItem(props: NodeProps) {
  return isBranch(props.node) ? (
    <NavBranchItem {...props} node={props.node} />
  ) : (
    <NavLeafItem {...props} node={props.node} />
  );
}

function NavLeafItem({ node, depth, cor, onNavigate, getBadge }: NodeProps & { node: NavLeaf }) {
  const raiz = depth === 0;
  const badge = getBadge(node);
  return (
    <NavLink
      to={node.href}
      end={node.href === "/"}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center rounded-lg transition-colors",
          // No mobile, alvos de toque maiores (>=44px) e fonte legível; no
          // desktop (md:) volta ao compacto original.
          "min-h-[44px] md:min-h-0",
          raiz
            ? "gap-3 px-3 py-2.5 text-[15px] font-medium md:text-sm"
            : "gap-2.5 px-3 py-2 text-sm md:px-2.5 md:py-1.5 md:text-[13px]",
          isActive
            ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
            : raiz
              ? "text-sidebar-foreground/85 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              : "text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
        )
      }
    >
      {({ isActive }) => (
        <>
          <node.icon
            className={cn("shrink-0", raiz ? "size-[18px]" : "size-[18px] md:size-4")}
            style={{ color: isActive ? undefined : cor }}
          />
          <span className="truncate">{node.label}</span>
          <NavBadge n={badge} />
        </>
      )}
    </NavLink>
  );
}

function NavBranchItem({
  node,
  depth,
  cor,
  onNavigate,
  getBadge,
  aberto: abertoProp,
  onAlternar,
}: NodeProps & { node: NavBranch }) {
  const { pathname } = useLocation();
  const ativo = contemAtivo(node, pathname);
  const [abertoLocal, setAbertoLocal] = useState(ativo);
  const raiz = depth === 0;
  const badge = getBadge(node);
  // Se o pai controla a abertura (pilares), usa isso; senão, estado próprio.
  const controlado = onAlternar !== undefined;
  const aberto = controlado ? !!abertoProp : abertoLocal;
  const alternar = controlado ? onAlternar : () => setAbertoLocal((v) => !v);

  return (
    <div>
      <button
        onClick={alternar}
        className={cn(
          "flex w-full items-center rounded-lg transition-colors",
          "min-h-[44px] md:min-h-0",
          raiz
            ? "gap-3 px-3 py-2.5 text-[15px] font-medium md:text-sm"
            : "gap-2.5 px-3 py-2 text-sm font-medium md:px-2.5 md:py-1.5 md:text-[13px]",
          ativo
            ? "text-sidebar-foreground"
            : raiz
              ? "text-sidebar-foreground/85 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              : "text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
        )}
        aria-expanded={aberto}
      >
        <node.icon
          className={cn("shrink-0", raiz ? "size-[18px]" : "size-[18px] md:size-4")}
          style={{ color: cor }}
        />
        <span className="flex-1 text-left">{node.label}</span>
        {/* Fechado: mostra o total da subárvore no pilar; aberto, quem mostra é
            a folha/ramo interno (evita duplicar). */}
        {!aberto && <NavBadge n={badge} />}
        <ChevronRight
          className={cn(
            "size-5 shrink-0 text-sidebar-foreground/40 transition-transform duration-[var(--dur-fast)] ease-[var(--ease-standard)] md:size-4",
            aberto && "rotate-90",
          )}
        />
      </button>

      {/* Expansão suave via grid-template-rows 0fr→1fr (altura auto animável).
          Três divs: wrapper que anima a grade > clipe overflow-hidden "pelado"
          (qualquer margem/borda nele vazaria altura fechado) > conteúdo com o
          espaçamento. Os filhos ficam SEMPRE montados (a grade só interpola
          entre dois estados presentes) e `inert` quando fechado, para não serem
          tabuláveis/lidos por leitor de tela enquanto invisíveis. */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-[var(--dur-base)] ease-[var(--ease-out-premium)]",
          aberto ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              "mt-0.5 space-y-0.5 border-l pl-2.5 transition-opacity duration-[var(--dur-base)]",
              aberto ? "opacity-100" : "opacity-0",
            )}
            style={{ marginLeft: raiz ? 22 : 14, borderColor: `${cor}55` }}
            inert={!aberto || undefined}
          >
            {node.children.map((child) => (
              <NavNodeItem
                key={isBranch(child) ? child.label : child.href}
                node={child}
                depth={depth + 1}
                cor={cor}
                onNavigate={onNavigate}
                getBadge={getBadge}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { sessao, sair } = useAuth();
  const { pathname } = useLocation();
  const admin = sessao?.isAdministrador ?? false;
  const modulos = sessao?.modulos ?? [];

  // Contadores do menu, por chave (ver NavLeaf.badge). Um ramo soma a subárvore
  // para borbulhar o total ao pilar fechado.
  const { data: alunosSemTurma } = useAlunosSemTurma();
  const contadores: Record<string, number> = {
    alunosSemTurma: alunosSemTurma?.length ?? 0,
  };
  const getBadge = (node: NavNode): number =>
    isBranch(node)
      ? node.children.reduce((soma, filho) => soma + getBadge(filho), 0)
      : node.badge
        ? (contadores[node.badge] ?? 0)
        : 0;

  // Acordeão dos pilares (nível 0): só um aberto por vez. Começa aberto no
  // pilar que contém a página atual.
  const pilarInicial = navGroups
    .flatMap((g) => filtrarPorPapel(g.nodes, { admin, modulos }))
    .find((n) => isBranch(n) && contemAtivo(n, pathname));
  const [pilarAberto, setPilarAberto] = useState<string | null>(
    pilarInicial ? pilarInicial.label : null,
  );

  return (
    <div className="flex h-full w-[86vw] max-w-sm flex-col bg-sidebar text-sidebar-foreground md:w-64">
      <div className="flex h-20 items-center justify-between border-b border-sidebar-border px-5">
        <LogoLockup className="h-14" />
        {onNavigate && (
          <button
            onClick={onNavigate}
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground md:hidden"
            aria-label="Fechar menu"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navGroups.map((grupo, i) => {
          const nodes = filtrarPorPapel(grupo.nodes, { admin, modulos });
          if (nodes.length === 0) return null;
          return (
            <div
              key={grupo.titulo ?? i}
              className={cn(
                "py-2",
                i > 0 && "mt-1 border-t border-sidebar-border/50 pt-3",
              )}
            >
              {grupo.titulo && (
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/40">
                  {grupo.titulo}
                </p>
              )}
              <div className="space-y-0.5">
                {nodes.map((node) => (
                  <NavNodeItem
                    key={isBranch(node) ? node.label : node.href}
                    node={node}
                    depth={0}
                    cor={CORES_SECAO[node.label] ?? "#94a3b8"}
                    onNavigate={onNavigate}
                    getBadge={getBadge}
                    {...(isBranch(node)
                      ? {
                          aberto: pilarAberto === node.label,
                          onAlternar: () =>
                            setPilarAberto((atual) =>
                              atual === node.label ? null : node.label,
                            ),
                        }
                      : {})}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={sair}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-destructive/15 hover:text-destructive"
        >
          <LogOut className="size-[18px]" />
          Sair
        </button>
      </div>
    </div>
  );
}
