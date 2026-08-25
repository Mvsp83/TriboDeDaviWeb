import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/features/auth/LoginPage";
import { SitePublico } from "@/features/site/SitePublico";
import { useAuth } from "@/features/auth/AuthContext";

// A landing (SitePublico) é carregada de imediato — é a primeira tela do
// visitante. As demais telas públicas são carregadas sob demanda para não
// baixar tudo de uma vez num celular simples (a comum é abrir só o site).
const DoacaoPage = lazy(() =>
  import("@/features/doacao/DoacaoPage").then((m) => ({ default: m.DoacaoPage })),
);
const TransparenciaPage = lazy(() =>
  import("@/features/transparencia/TransparenciaPage").then((m) => ({ default: m.TransparenciaPage })),
);
const MatriculaPage = lazy(() =>
  import("@/features/matricula/MatriculaPage").then((m) => ({ default: m.MatriculaPage })),
);
const ResponsavelPortal = lazy(() =>
  import("@/features/responsavel/ResponsavelPortal").then((m) => ({ default: m.ResponsavelPortal })),
);
const GaleriaPage = lazy(() =>
  import("@/features/galeria/GaleriaPage").then((m) => ({ default: m.GaleriaPage })),
);
const InformacoesPage = lazy(() =>
  import("@/features/informacoes/InformacoesPage").then((m) => ({ default: m.InformacoesPage })),
);

// Fallback enquanto um chunk carrega (público, fora do AppLayout).
function CarregandoTela() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}

// A raiz serve o site público para quem chega de fora e manda direto ao painel
// quem já está logado — assim o endereço divulgado e o atalho da equipe são o
// mesmo, e o app instalado (start_url "/") continua abrindo no painel.
function Raiz() {
  const { autenticado } = useAuth();
  return autenticado ? <Navigate to="/painel" replace /> : <SitePublico />;
}

// Cada página vira um chunk próprio, carregado sob demanda (o AppLayout
// mostra um skeleton via Suspense enquanto o chunk é buscado).
const DashboardPage = lazy(() =>
  import("@/features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const AlunosPage = lazy(() =>
  import("@/features/alunos/AlunosPage").then((m) => ({ default: m.AlunosPage })),
);
const AuditoriaPage = lazy(() =>
  import("@/features/auditoria/AuditoriaPage").then((m) => ({ default: m.AuditoriaPage })),
);
const DoacoesPage = lazy(() =>
  import("@/features/doadores/DoacoesPage").then((m) => ({ default: m.DoacoesPage })),
);
const GraduacoesPage = lazy(() =>
  import("@/features/graduacoes/GraduacoesPage").then((m) => ({ default: m.GraduacoesPage })),
);
const ImpactoPage = lazy(() =>
  import("@/features/relatorios/ImpactoPage").then((m) => ({ default: m.ImpactoPage })),
);
const InscricoesPage = lazy(() =>
  import("@/features/inscricoes/InscricoesPage").then((m) => ({
    default: m.InscricoesPage,
  })),
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
const ChamadaPage = lazy(() =>
  import("@/features/chamada/ChamadaPage").then((m) => ({ default: m.ChamadaPage })),
);
const CalendarioPage = lazy(() =>
  import("@/features/calendario/CalendarioPage").then((m) => ({ default: m.CalendarioPage })),
);
const PatrimonioPage = lazy(() =>
  import("@/features/patrimonio/PatrimonioPage").then((m) => ({ default: m.PatrimonioPage })),
);
const AvisosPage = lazy(() =>
  import("@/features/avisos/AvisosPage").then((m) => ({ default: m.AvisosPage })),
);
const DocumentosOficiaisPage = lazy(() =>
  import("@/features/documentosOficiais/DocumentosOficiaisPage").then((m) => ({
    default: m.DocumentosOficiaisPage,
  })),
);
const DocumentoOficialEditorPage = lazy(() =>
  import("@/features/documentosOficiais/DocumentoOficialEditorPage").then((m) => ({
    default: m.DocumentoOficialEditorPage,
  })),
);
const ChamadaAulaPage = lazy(() =>
  import("@/features/chamada/ChamadaAulaPage").then((m) => ({ default: m.ChamadaAulaPage })),
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
const PlanoViewPage = lazy(() =>
  import("@/features/planos/PlanoViewPage").then((m) => ({ default: m.PlanoViewPage })),
);
const ModelosDeAulaPage = lazy(() =>
  import("@/features/modelos/ModelosDeAulaPage").then((m) => ({ default: m.ModelosDeAulaPage })),
);
const ModeloEditorPage = lazy(() =>
  import("@/features/modelos/ModeloEditorPage").then((m) => ({ default: m.ModeloEditorPage })),
);
const ModeloViewPage = lazy(() =>
  import("@/features/modelos/ModeloViewPage").then((m) => ({ default: m.ModeloViewPage })),
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
const PadraoDocumentosPage = lazy(() =>
  import("@/features/configuracoes/PadraoDocumentosPage").then((m) => ({
    default: m.PadraoDocumentosPage,
  })),
);
const ProgramasGraduacaoPage = lazy(() =>
  import("@/features/graduacao/ProgramasPage").then((m) => ({
    default: m.ProgramasPage,
  })),
);
const ProgramaEditorPage = lazy(() =>
  import("@/features/graduacao/ProgramaEditorPage").then((m) => ({
    default: m.ProgramaEditorPage,
  })),
);
const PosicoesPage = lazy(() =>
  import("@/features/graduacao/PosicoesPage").then((m) => ({
    default: m.PosicoesPage,
  })),
);
const GolpesRestritosPage = lazy(() =>
  import("@/features/graduacao/GolpesRestritosPage").then((m) => ({
    default: m.GolpesRestritosPage,
  })),
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
const RelatorioAtividadesModeloPage = lazy(() =>
  import("@/features/administrativo/RelatorioAtividadesModeloPage").then((m) => ({
    default: m.RelatorioAtividadesModeloPage,
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
    <Suspense fallback={<CarregandoTela />}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* Públicas: divulgadas fora do sistema, não exigem login. */}
      <Route path="/" element={<Raiz />} />
      <Route path="/site" element={<SitePublico />} />
      <Route path="/doar" element={<DoacaoPage />} />
      <Route path="/transparencia" element={<TransparenciaPage />} />
      <Route path="/galeria" element={<GaleriaPage />} />
      <Route path="/informacoes" element={<InformacoesPage />} />
      <Route path="/matricula" element={<MatriculaPage />} />
      <Route path="/responsavel" element={<ResponsavelPortal />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="painel" element={<DashboardPage />} />
          <Route path="alunos" element={<AlunosPage />} />
          <Route path="inscricoes" element={<InscricoesPage />} />
          <Route path="impacto" element={<ImpactoPage />} />
          <Route path="graduacoes" element={<GraduacoesPage />} />
          <Route path="doacoes" element={<DoacoesPage />} />
          <Route path="auditoria" element={<AuditoriaPage />} />
          <Route path="aulas" element={<AulasPage />} />
          <Route path="chamada" element={<ChamadaPage />} />
          <Route path="chamada/:aulaId" element={<ChamadaAulaPage />} />
          <Route path="calendario" element={<CalendarioPage />} />
          <Route path="planos-de-aula" element={<PlanosDeAulaPage />} />
          <Route path="planos-de-aula/ver/:id" element={<PlanoViewPage />} />
          <Route path="planos-de-aula/editor" element={<PlanoEditorPage />} />
          <Route path="planos-de-aula/editor/:id" element={<PlanoEditorPage />} />
          <Route path="modelos-de-aula" element={<ModelosDeAulaPage />} />
          <Route path="modelos-de-aula/ver/:id" element={<ModeloViewPage />} />
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
            <Route path="padrao-documentos" element={<PadraoDocumentosPage />} />
            <Route path="documentos-oficiais" element={<DocumentosOficiaisPage />} />
            <Route path="patrimonio" element={<PatrimonioPage />} />
            <Route path="avisos" element={<AvisosPage />} />
            <Route
              path="documentos-oficiais/novo/:tipo"
              element={<DocumentoOficialEditorPage />}
            />
            <Route
              path="documentos-oficiais/editor/:id"
              element={<DocumentoOficialEditorPage />}
            />

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
              path="administrativo/contabilidade/relatorio-atividades/modelo"
              element={<RelatorioAtividadesModeloPage />}
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

          {/* Programa de Graduação: admin OU professor com permissão */}
          <Route element={<ProtectedRoute graduacao />}>
            <Route path="graduacao/programas" element={<ProgramasGraduacaoPage />} />
            <Route
              path="graduacao/programas/editor/:faixaBase"
              element={<ProgramaEditorPage />}
            />
            <Route path="graduacao/posicoes" element={<PosicoesPage />} />
            <Route path="graduacao/golpes" element={<GolpesRestritosPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}
