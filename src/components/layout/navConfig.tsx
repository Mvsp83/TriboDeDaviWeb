import {
  LayoutDashboard,
  Users,
  MapPin,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  ClipboardPaste,
  BookOpen,
  CheckCircle2,
  BarChart3,
  Cake,
  FileText,
  UserCog,
  Upload,
  RefreshCw,
  Stamp,
  FileBarChart,
  FolderPlus,
  GraduationCap,
  NotebookPen,
  Calculator,
  Scale,
  Wallet,
  Landmark,
  Receipt,
  TrendingUp,
  FileSpreadsheet,
  type LucideIcon,
} from "lucide-react";

// A navegação é uma árvore: folhas levam a uma rota; ramos apenas agrupam e
// abrem/fecham. adminOnly esconde o nó de contas que não são Administrador.
export interface NavLeaf {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export interface NavBranch {
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  children: NavNode[];
}

export type NavNode = NavLeaf | NavBranch;

export function isBranch(node: NavNode): node is NavBranch {
  return "children" in node;
}

export interface NavGroup {
  titulo?: string;
  nodes: NavNode[];
}

// Espelha o menu do portal, agora com submenus dentro de "Operacional".
export const navGroups: NavGroup[] = [
  {
    nodes: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      {
        label: "Modelos de Documentos",
        href: "/documentos",
        icon: FileText,
        adminOnly: true,
      },
    ],
  },
  {
    titulo: "Operacional",
    nodes: [
      {
        label: "Cadastros",
        icon: FolderPlus,
        children: [
          { label: "Alunos", href: "/alunos", icon: Users },
          { label: "Polos", href: "/polos", icon: MapPin, adminOnly: true },
        ],
      },
      {
        label: "Aula",
        icon: GraduationCap,
        children: [
          { label: "Chamada", href: "/chamada", icon: ClipboardCheck },
          { label: "Aulas", href: "/aulas", icon: CalendarDays },
          {
            label: "Planejamento de Aula",
            icon: NotebookPen,
            children: [
              {
                label: "Planos de Aula",
                href: "/planos-de-aula",
                icon: ClipboardList,
              },
              {
                label: "Modelos de Aula",
                href: "/modelos-de-aula",
                icon: ClipboardPaste,
              },
              { label: "Atividades", href: "/atividades", icon: BookOpen },
            ],
          },
        ],
      },
      { label: "Presenças", href: "/presencas", icon: CheckCircle2 },
      { label: "Frequência", href: "/frequencia", icon: BarChart3 },
      { label: "Aniversariantes", href: "/aniversariantes", icon: Cake },
    ],
  },
  {
    titulo: "Administrativo",
    nodes: [
      {
        label: "Contabilidade",
        icon: Calculator,
        adminOnly: true,
        children: [
          {
            label: "DRE",
            href: "/administrativo/contabilidade/dre",
            icon: FileText,
          },
          {
            label: "Relatório de Atividades",
            href: "/administrativo/contabilidade/relatorio-atividades",
            icon: FileBarChart,
          },
          {
            label: "Balanço",
            href: "/administrativo/contabilidade/balanco",
            icon: Scale,
          },
        ],
      },
      {
        label: "Financeiro",
        icon: Wallet,
        adminOnly: true,
        children: [
          {
            label: "Contas",
            icon: Landmark,
            children: [
              {
                label: "Extratos",
                href: "/administrativo/financeiro/contas/extratos",
                icon: Receipt,
              },
              {
                label: "Aplicações",
                href: "/administrativo/financeiro/contas/aplicacoes",
                icon: TrendingUp,
              },
              {
                label: "Planilha Financeira",
                href: "/administrativo/financeiro/contas/planilha",
                icon: FileSpreadsheet,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    titulo: "Configurações",
    nodes: [
      { label: "Usuários", href: "/usuarios", icon: UserCog, adminOnly: true },
      {
        label: "Padrão de Documentos",
        href: "/padrao-documentos",
        icon: Stamp,
        adminOnly: true,
      },
      {
        label: "Importação",
        href: "/importacao",
        icon: Upload,
        adminOnly: true,
      },
      {
        label: "Sincronização",
        href: "/sincronizacao",
        icon: RefreshCw,
        adminOnly: true,
      },
    ],
  },
  {
    nodes: [{ label: "Relatórios", href: "/relatorios", icon: FileBarChart }],
  },
];

// Achata a árvore só nas folhas (usado para descobrir o título da rota atual).
export function coletarFolhas(nodes: NavNode[]): NavLeaf[] {
  return nodes.flatMap((n) =>
    isBranch(n) ? coletarFolhas(n.children) : [n],
  );
}

// Remove nós restritos a admin; um ramo some quando fica sem filhos visíveis.
export function filtrarPorPapel(nodes: NavNode[], admin: boolean): NavNode[] {
  return nodes.flatMap<NavNode>((n) => {
    if (n.adminOnly && !admin) return [];
    if (isBranch(n)) {
      const filhos = filtrarPorPapel(n.children, admin);
      return filhos.length > 0 ? [{ ...n, children: filhos }] : [];
    }
    return [n];
  });
}
