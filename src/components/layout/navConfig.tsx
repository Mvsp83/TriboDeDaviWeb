import {
  LayoutDashboard,
  Users,
  MapPin,
  CalendarDays,
  CalendarRange,
  Camera,
  Video,
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
  MessagesSquare,
  UserCog,
  ShieldCheck,
  Upload,
  RefreshCw,
  Stamp,
  FileBarChart,
  FolderPlus,
  GraduationCap,
  Award,
  ListChecks,
  ShieldAlert,
  SlidersHorizontal,
  ScrollText,
  NotebookPen,
  Calculator,
  Scale,
  Wallet,
  CircleDollarSign,
  Receipt,
  HeartHandshake,
  TrendingUp,
  FileSpreadsheet,
  type LucideIcon,
} from "lucide-react";
import type { ModuloId } from "@/config/modulos";

// A navegação é uma árvore: folhas levam a uma rota; ramos apenas agrupam e
// abrem/fecham. adminOnly esconde o nó de contas que não são Administrador.
export interface NavLeaf {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  // Só aparece se a conta contratou este módulo. Sem `modulo` = base (core),
  // sempre visível. Ortogonal a `adminOnly` (papel do usuário).
  modulo?: ModuloId;
}

export interface NavBranch {
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  modulo?: ModuloId;
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
      { label: "Dashboard", href: "/painel", icon: LayoutDashboard },
      // Operacional, disponível a professores e admin (sem gate de módulo).
      { label: "Solicitações", href: "/solicitacoes", icon: MessagesSquare },
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
      {
        label: "Fotos do Treino",
        icon: Camera,
        modulo: "relacionamento",
        children: [
          {
            label: "Postar foto",
            href: "/fotos-treino/postar",
            icon: Camera,
            modulo: "relacionamento",
          },
          {
            label: "Moderar fotos",
            href: "/fotos-treino/moderacao",
            icon: ShieldCheck,
            adminOnly: true,
            modulo: "relacionamento",
          },
          {
            label: "Vídeos da galeria",
            href: "/galeria/videos",
            icon: Video,
            adminOnly: true,
            modulo: "relacionamento",
          },
        ],
      },
      {
        label: "Programas de Graduação",
        icon: ListChecks,
        modulo: "graduacao",
        children: [
          { label: "Programas", href: "/graduacao/programas", icon: GraduationCap },
          { label: "Posições", href: "/graduacao/posicoes", icon: BookOpen },
          { label: "Golpes Restritos", href: "/graduacao/golpes", icon: ShieldAlert },
          { label: "Regras (IBJJF)", href: "/graduacao/regras", icon: ScrollText },
          { label: "Parâmetros", href: "/graduacao/parametros", icon: SlidersHorizontal },
        ],
      },
      { label: "Relatórios", href: "/relatorios", icon: FileBarChart },
      {
        label: "Relatório de Impacto",
        href: "/impacto",
        icon: TrendingUp,
        modulo: "captacao",
      },
    ],
  },
  {
    titulo: "Administrativo",
    nodes: [
      {
        label: "Calendário",
        href: "/calendario",
        icon: CalendarRange,
        modulo: "relacionamento",
      },
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
        modulo: "financeiro",
      },
      {
        label: "Patrimônio",
        href: "/patrimonio",
        icon: Boxes,
        adminOnly: true,
        modulo: "financeiro",
      },
      {
        label: "Doações",
        href: "/doacoes",
        icon: HeartHandshake,
        adminOnly: true,
        modulo: "captacao",
      },
      {
        label: "Contabilidade",
        icon: Calculator,
        adminOnly: true,
        modulo: "financeiro",
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
        modulo: "financeiro",
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
      {
        label: "Mensalidades",
        icon: CircleDollarSign,
        adminOnly: true,
        modulo: "financeiro",
        children: [
          {
            label: "Planos",
            href: "/administrativo/financeiro/mensalidades/planos",
            icon: CircleDollarSign,
          },
          {
            label: "Matrículas",
            href: "/administrativo/financeiro/mensalidades/matriculas",
            icon: Users,
          },
          {
            label: "Cobranças",
            href: "/administrativo/financeiro/mensalidades/cobrancas",
            icon: Receipt,
          },
        ],
      },
    ],
  },
  {
    titulo: "Configurações",
    nodes: [
      {
        label: "Avisos",
        href: "/avisos",
        icon: Megaphone,
        adminOnly: true,
        modulo: "relacionamento",
      },
      { label: "Usuários", href: "/usuarios", icon: UserCog, adminOnly: true },
      { label: "Auditoria", href: "/auditoria", icon: ShieldCheck, adminOnly: true },
      {
        label: "Padrão de Documentos",
        href: "/padrao-documentos",
        icon: Stamp,
        adminOnly: true,
      },
      {
        label: "Foto do Aluno",
        href: "/config-foto-aluno",
        icon: Camera,
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

// Contexto de visibilidade: papel do usuário (admin) e módulos que a conta
// contratou. As duas dimensões são independentes e ambas precisam passar.
export interface CtxNav {
  admin: boolean;
  modulos: ModuloId[];
}

// Esconde nós restritos a admin e nós de módulos não contratados; um ramo
// some quando fica sem filhos visíveis.
export function filtrarPorPapel(nodes: NavNode[], ctx: CtxNav): NavNode[] {
  return nodes.flatMap<NavNode>((n) => {
    if (n.adminOnly && !ctx.admin) return [];
    if (n.modulo && !ctx.modulos.includes(n.modulo)) return [];
    if (isBranch(n)) {
      const filhos = filtrarPorPapel(n.children, ctx);
      return filhos.length > 0 ? [{ ...n, children: filhos }] : [];
    }
    return [n];
  });
}
