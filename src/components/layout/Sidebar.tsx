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
import { cn } from "@/lib/utils";

// Cor de cada seção (nível 0). A cor "desce" para os filhos, agrupando
// visualmente as opções. No item ativo, o dourado da marca assume.
const CORES_SECAO: Record<string, string> = {
  Dashboard: "#38bdf8",
  Calendário: "#a78bfa",
  "Modelos de Documentos": "#fbbf24",
  "Ofícios e Recibos": "#2dd4bf",
  "Patrimônio": "#e879f9",
  Cadastros: "#34d399",
  Aula: "#818cf8",
  Presenças: "#4ade80",
  Frequência: "#22d3ee",
  Aniversariantes: "#f472b6",
  Contabilidade: "#fb923c",
  Financeiro: "#a3e635",
  Avisos: "#f59e0b",
  Usuários: "#fb7185",
  "Padrão de Documentos": "#fcd34d",
  Importação: "#60a5fa",
  Sincronização: "#67e8f9",
  Relatórios: "#c084fc",
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
}

function NavNodeItem(props: NodeProps) {
  return isBranch(props.node) ? (
    <NavBranchItem {...props} node={props.node} />
  ) : (
    <NavLeafItem {...props} node={props.node} />
  );
}

function NavLeafItem({ node, depth, cor, onNavigate }: NodeProps & { node: NavLeaf }) {
  const raiz = depth === 0;
  return (
    <NavLink
      to={node.href}
      end={node.href === "/"}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center rounded-lg transition-colors",
          raiz ? "gap-3 px-3 py-2.5 text-sm font-medium" : "gap-2.5 px-2.5 py-1.5 text-[13px]",
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
            className={cn("shrink-0", raiz ? "size-[18px]" : "size-4")}
            style={{ color: isActive ? undefined : cor }}
          />
          {node.label}
        </>
      )}
    </NavLink>
  );
}

function NavBranchItem({ node, depth, cor, onNavigate }: NodeProps & { node: NavBranch }) {
  const { pathname } = useLocation();
  const ativo = contemAtivo(node, pathname);
  const [aberto, setAberto] = useState(ativo);
  const raiz = depth === 0;

  return (
    <div>
      <button
        onClick={() => setAberto((v) => !v)}
        className={cn(
          "flex w-full items-center rounded-lg transition-colors",
          raiz ? "gap-3 px-3 py-2.5 text-sm font-medium" : "gap-2.5 px-2.5 py-1.5 text-[13px] font-medium",
          ativo
            ? "text-sidebar-foreground"
            : raiz
              ? "text-sidebar-foreground/85 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              : "text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
        )}
        aria-expanded={aberto}
      >
        <node.icon
          className={cn("shrink-0", raiz ? "size-[18px]" : "size-4")}
          style={{ color: cor }}
        />
        <span className="flex-1 text-left">{node.label}</span>
        <ChevronRight
          className={cn(
            "size-4 shrink-0 text-sidebar-foreground/40 transition-transform",
            aberto && "rotate-90",
          )}
        />
      </button>

      {aberto && (
        <div
          className="mt-0.5 space-y-0.5 border-l pl-2.5"
          style={{ marginLeft: raiz ? 22 : 14, borderColor: `${cor}55` }}
        >
          {node.children.map((child) => (
            <NavNodeItem
              key={isBranch(child) ? child.label : child.href}
              node={child}
              depth={depth + 1}
              cor={cor}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { sessao, sair } = useAuth();
  const admin = sessao?.isAdministrador ?? false;
  const modulos = sessao?.modulos ?? [];

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
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
