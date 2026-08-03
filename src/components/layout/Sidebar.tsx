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

// Recuo crescente por nível, alinhando o texto sob o ícone do pai.
const recuo = (depth: number) => 12 + depth * 16;

interface NodeProps {
  node: NavNode;
  depth: number;
  onNavigate?: () => void;
}

function NavNodeItem(props: NodeProps) {
  return isBranch(props.node) ? (
    <NavBranchItem {...props} node={props.node} />
  ) : (
    <NavLeafItem {...props} node={props.node} />
  );
}

function NavLeafItem({
  node,
  depth,
  onNavigate,
}: NodeProps & { node: NavLeaf }) {
  return (
    <NavLink
      to={node.href}
      end={node.href === "/"}
      onClick={onNavigate}
      style={{ paddingLeft: recuo(depth) }}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg py-2 pr-3 text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
        )
      }
    >
      <node.icon className="size-[18px] shrink-0" />
      {node.label}
    </NavLink>
  );
}

function NavBranchItem({
  node,
  depth,
  onNavigate,
}: NodeProps & { node: NavBranch }) {
  const { pathname } = useLocation();
  const ativo = contemAtivo(node, pathname);
  // Abre automaticamente quando contém a rota ativa.
  const [aberto, setAberto] = useState(ativo);

  return (
    <div>
      <button
        onClick={() => setAberto((v) => !v)}
        style={{ paddingLeft: recuo(depth) }}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg py-2 pr-2 text-sm font-medium transition-colors",
          ativo
            ? "text-sidebar-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
        )}
        aria-expanded={aberto}
      >
        <node.icon className="size-[18px] shrink-0" />
        <span className="flex-1 text-left">{node.label}</span>
        <ChevronRight
          className={cn(
            "size-4 shrink-0 transition-transform",
            aberto && "rotate-90",
          )}
        />
      </button>

      {aberto && (
        <div className="mt-0.5 space-y-0.5">
          {node.children.map((child) => (
            <NavNodeItem
              key={isBranch(child) ? child.label : child.href}
              node={child}
              depth={depth + 1}
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

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
        <LogoLockup />
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

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {navGroups.map((grupo, i) => {
          const nodes = filtrarPorPapel(grupo.nodes, admin);
          if (nodes.length === 0) return null;
          return (
            <div key={grupo.titulo ?? i}>
              {grupo.titulo && (
                <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                  {grupo.titulo}
                </p>
              )}
              <div className="space-y-0.5">
                {nodes.map((node) => (
                  <NavNodeItem
                    key={isBranch(node) ? node.label : node.href}
                    node={node}
                    depth={0}
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
