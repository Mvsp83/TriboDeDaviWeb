import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ItemNav {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  destaque?: boolean;
}

// Atalhos do dia a dia do professor. Chamada em destaque (botão elevado).
const ITENS: ItemNav[] = [
  { label: "Início", href: "/painel", icon: LayoutDashboard, exact: true },
  { label: "Aulas", href: "/aulas", icon: CalendarDays },
  { label: "Chamada", href: "/chamada", icon: ClipboardCheck, destaque: true },
  { label: "Alunos", href: "/alunos", icon: Users },
];

// Barra de navegação inferior — só no celular (md:hidden). Coloca a Chamada na
// zona do polegar, a um toque de qualquer tela.
export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-1.5">
        {ITENS.map((it) => (
          <NavLink
            key={it.href}
            to={it.href}
            end={it.exact}
            className="flex flex-1 flex-col items-center justify-end gap-1 py-1 text-[11px] font-medium"
          >
            {({ isActive }) =>
              it.destaque ? (
                <>
                  <span className="-mt-6 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background">
                    <it.icon className="size-5" />
                  </span>
                  <span className={cn(isActive ? "text-primary" : "text-foreground")}>
                    {it.label}
                  </span>
                </>
              ) : (
                <>
                  <it.icon
                    className={cn("size-5", isActive ? "text-primary" : "text-muted-foreground")}
                  />
                  <span className={cn(isActive ? "text-primary" : "text-muted-foreground")}>
                    {it.label}
                  </span>
                </>
              )
            }
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
