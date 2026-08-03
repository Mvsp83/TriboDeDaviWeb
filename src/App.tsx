import { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/features/auth/LoginPage";

// Cada página vira um chunk próprio, carregado sob demanda (o AppLayout
// mostra um skeleton via Suspense enquanto o chunk é buscado).
const DashboardPage = lazy(() =>
  import("@/features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const AlunosPage = lazy(() =>
  import("@/features/alunos/AlunosPage").then((m) => ({ default: m.AlunosPage })),
);
const PolosPage = lazy(() =>
  import("@/features/polos/PolosPage").then((m) => ({ default: m.PolosPage })),
);
const UsuariosPage = lazy(() =>
  import("@/features/usuarios/UsuariosPage").then((m) => ({ default: m.UsuariosPage })),
);
const AniversariantesPage = lazy(() =>
  import("@/features/aniversariantes/AniversariantesPage").then((m) => ({
    default: m.AniversariantesPage,
  })),
);
const AulasPage = lazy(() =>
  import("@/features/aulas/AulasPage").then((m) => ({ default: m.AulasPage })),
);
const PresencasPage = lazy(() =>
  import("@/features/presencas/PresencasPage").then((m) => ({ default: m.PresencasPage })),
);
const AtividadesPage = lazy(() =>
  import("@/features/atividades/AtividadesPage").then((m) => ({ default: m.AtividadesPage })),
);
const PlanosDeAulaPage = lazy(() =>
  import("@/features/planos/PlanosDeAulaPage").then((m) => ({ default: m.PlanosDeAulaPage })),
);
const PlanoEditorPage = lazy(() =>
  import("@/features/planos/PlanoEditorPage").then((m) => ({ default: m.PlanoEditorPage })),
);
const ModelosDeAulaPage = lazy(() =>
  import("@/features/modelos/ModelosDeAulaPage").then((m) => ({ default: m.ModelosDeAulaPage })),
);
const ModeloEditorPage = lazy(() =>
  import("@/features/modelos/ModeloEditorPage").then((m) => ({ default: m.ModeloEditorPage })),
);
const FrequenciaPage = lazy(() =>
  import("@/features/frequencia/FrequenciaPage").then((m) => ({ default: m.FrequenciaPage })),
);
const RelatoriosPage = lazy(() =>
  import("@/features/relatorios/RelatoriosPage").then((m) => ({ default: m.RelatoriosPage })),
);
const ImportacaoPage = lazy(() =>
  import("@/features/importacao/ImportacaoPage").then((m) => ({ default: m.ImportacaoPage })),
);
const SincronizacaoPage = lazy(() =>
  import("@/features/sincronizacao/SincronizacaoPage").then((m) => ({
    default: m.SincronizacaoPage,
  })),
);
const DocumentosPage = lazy(() =>
  import("@/features/documentos/DocumentosPage").then((m) => ({ default: m.DocumentosPage })),
);
const DrePage = lazy(() =>
  import("@/features/administrativo/DrePage").then((m) => ({ default: m.DrePage })),
);
const BalancoPage = lazy(() =>
  import("@/features/administrativo/BalancoPage").then((m) => ({ default: m.BalancoPage })),
);
const RelatorioAtividadesPage = lazy(() =>
  import("@/features/administrativo/RelatorioAtividadesPage").then((m) => ({
    default: m.RelatorioAtividadesPage,
  })),
);
const ExtratosPage = lazy(() =>
  import("@/features/administrativo/financeiro/ExtratosPage").then((m) => ({
    default: m.ExtratosPage,
  })),
);
const AplicacoesPage = lazy(() =>
  import("@/features/administrativo/financeiro/AplicacoesPage").then((m) => ({
    default: m.AplicacoesPage,
  })),
);
const PlanilhaFinanceiraPage = lazy(() =>
  import("@/features/administrativo/financeiro/PlanilhaFinanceiraPage").then((m) => ({
    default: m.PlanilhaFinanceiraPage,
  })),
);

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="alunos" element={<AlunosPage />} />
          <Route path="aulas" element={<AulasPage />} />
          <Route path="planos-de-aula" element={<PlanosDeAulaPage />} />
          <Route path="planos-de-aula/editor" element={<PlanoEditorPage />} />
          <Route path="planos-de-aula/editor/:id" element={<PlanoEditorPage />} />
          <Route path="modelos-de-aula" element={<ModelosDeAulaPage />} />
          <Route path="modelos-de-aula/editor" element={<ModeloEditorPage />} />
          <Route path="modelos-de-aula/editor/:id" element={<ModeloEditorPage />} />
          <Route path="atividades" element={<AtividadesPage />} />
          <Route path="presencas" element={<PresencasPage />} />
          <Route path="frequencia" element={<FrequenciaPage />} />
          <Route path="aniversariantes" element={<AniversariantesPage />} />
          <Route path="relatorios" element={<RelatoriosPage />} />

          {/* Áreas restritas a Administrador */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="polos" element={<PolosPage />} />
            <Route path="usuarios" element={<UsuariosPage />} />
            <Route path="importacao" element={<ImportacaoPage />} />
            <Route path="sincronizacao" element={<SincronizacaoPage />} />
            <Route path="documentos" element={<DocumentosPage />} />

            {/* Administrativo → Contabilidade */}
            <Route
              path="administrativo/contabilidade/dre"
              element={<DrePage />}
            />
            <Route
              path="administrativo/contabilidade/relatorio-atividades"
              element={<RelatorioAtividadesPage />}
            />
            <Route
              path="administrativo/contabilidade/balanco"
              element={<BalancoPage />}
            />

            {/* Administrativo → Financeiro → Contas */}
            <Route
              path="administrativo/financeiro/contas/extratos"
              element={<ExtratosPage />}
            />
            <Route
              path="administrativo/financeiro/contas/aplicacoes"
              element={<AplicacoesPage />}
            />
            <Route
              path="administrativo/financeiro/contas/planilha"
              element={<PlanilhaFinanceiraPage />}
            />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
