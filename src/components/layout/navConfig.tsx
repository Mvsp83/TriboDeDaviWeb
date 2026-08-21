import {
  LayoutDashboard,
  Users,
  MapPin,
  CalendarDays,
  CalendarRange,
  ClipboardCheck,
  ClipboardList,
  ClipboardPaste,
  BookOpen,
  CheckCircle2,
  BarChart3,
  Cake,
  FileText,
  FileSignature,
  Boxes,
  Megaphone,
  UserCog,
  Upload,
  RefreshCw,
  Stamp,
  FileBarChart,
  FolderPlus,
  GraduationCap,
  Award,
  NotebookPen,
  Calculator,
  Scale,
  Wallet,
  Receipt,
  HeartHandshake,
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
    nodes: [{ label: "Dashboard", href: "/painel", icon: LayoutDashboard }],
  },
  {
    titulo: "Operacional",
    nodes: [
      {
        label: "Cadastros",
        icon: FolderPlus,
        children: [
          { label: "Alunos", href: "/alunos", icon: Users },
          { label: "Inscrições", href: "/inscricoes", icon: ClipboardList },
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
          { label: "Presenças", href: "/presencas", icon: CheckCircle2 },
          { label: "Frequência", href: "/frequencia", icon: BarChart3 },
          { label: "Graduações", href: "/graduacoes", icon: Award },
          { label: "Aniversariantes", href: "/aniversariantes", icon: Cake },
        ],
      },
      { label: "Relatórios", href: "/relatorios", icon: FileBarChart },
      { label: "Relatório de Impacto", href: "/impacto", icon: TrendingUp },
    ],
  },
  {
    titulo: "Administrativo",
    nodes: [
      { label: "Calendário", href: "/calendario", icon: CalendarRange },
      {
        label: "Modelos de Documentos",
        href: "/documentos",
        icon: FileText,
        adminOnly: true,
      },
      {
        label: "Ofícios e Recibos",
        href: "/documentos-oficiais",
        icon: FileSignature,
        adminOnly: true,
      },
      {
        label: "Patrimônio",
        href: "/patrimonio",
        icon: Boxes,
        adminOnly: true,
      },
      {
        label: "Doações",
        href: "/doacoes",
        icon: HeartHandshake,
        adminOnly: true,
      },
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
  {
    titulo: "Configurações",
    nodes: [
      { label: "Avisos", href: "/avisos", icon: Megaphone, adminOnly: true },
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
