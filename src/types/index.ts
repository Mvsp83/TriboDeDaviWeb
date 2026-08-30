// Modelos do domínio, espelhando os DTOs da API Tribo de Davi.

import type { ModuloId } from "@/config/modulos";

export interface Aluno {
  id: number;
  nome: string;
  rg?: string | null;
  cpf?: string | null;
  dataNascimento: string; // ISO
  peso?: number | null;
  altura?: number | null;
  faixa: number;
  // `endereco` é a rua; número e complemento são campos próprios desde a ficha
  // de inscrição online. Cadastros antigos podem ter tudo junto em `endereco`.
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  celular?: string | null;
  telefone2?: string | null;
  responsavel?: string | null;
  parentesco?: number | null;
  rgResponsavel?: string | null;
  cpfResponsavel?: string | null;
  escola?: string | null;
  serie?: string | null;
  periodo?: string | null;
  poloId: number;
  turma: number;
  // Autorização de uso de imagem/voz (LGPD): true = autoriza, false = não,
  // null/undefined = não informado.
  autorizaImagem?: boolean | null;
  // Marca de público da ficha: true = inscrito como adulto. Ausente/false nos
  // cadastros antigos — nesse caso a idade (18+) é usada como critério.
  ehAdulto?: boolean;
  // Somente-leitura: indica se o aluno tem foto (o binário vem de
  // /api/Aluno/{id}/foto). Gerida por endpoints próprios, fora da ficha.
  temFoto?: boolean;
}

// Horário de treino de uma turma (um item por dia da semana).
// diaSemana: 0=Domingo … 6=Sábado. Horas em "HH:mm".
export interface HorarioTurma {
  id?: number;
  poloId?: number;
  turma: number;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
}

export interface Polo {
  id: number;
  nome: string;
  informacoes?: string | null;
  endereco?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  horarios?: HorarioTurma[];
}

export interface Aula {
  id: number;
  poloId: number;
  data: string;
  horaInicio: string; // "HH:mm:ss" (TimeSpan serializado)
  horaFim: string;
  presencaSalva: boolean;
  turma: number;
}

export interface Presenca {
  id: number;
  alunoId: number;
  nomeAluno: string;
  poloId: number;
  data: string;
  estaPresente: boolean;
  observacoes?: string | null;
  aulaId: number;
}

// TipoBloco espelha o enum da API (serializado como int). Usamos const object
// em vez de enum por causa do erasableSyntaxOnly do tsconfig.
export const TipoBloco = {
  Aquecimento: 0,
  Posicoes: 1,
  Lutas: 2,
  Dinamicas: 3,
  MensagemFinal: 4,
  Outro: 5,
} as const;

export type TipoBloco = (typeof TipoBloco)[keyof typeof TipoBloco];

export const TIPO_BLOCO_LABEL: Record<number, string> = {
  0: "Aquecimento",
  1: "Posições",
  2: "Lutas",
  3: "Dinâmicas",
  4: "Mensagem Final",
  5: "Outro",
};

export const TIPOS_BLOCO: { valor: number; label: string }[] = Object.entries(
  TIPO_BLOCO_LABEL,
).map(([valor, label]) => ({ valor: Number(valor), label }));

export interface Atividade {
  id: number;
  nome: string;
  tipo: number;
  descricao?: string | null;
  tags?: string | null;
  principio?: string | null;
  referenciaBiblica?: string | null;
  videoUrl?: string | null;
}

export const StatusPlano = {
  Rascunho: 0,
  Pronto: 1,
  Aplicado: 2,
} as const;

export type StatusPlano = (typeof StatusPlano)[keyof typeof StatusPlano];

export const STATUS_PLANO_LABEL: Record<number, string> = {
  0: "Rascunho",
  1: "Pronto",
  2: "Aplicado",
};

export interface AtividadeDoBloco {
  id: number;
  blocoDoPlanoId: number;
  atividadeId: number;
}

export interface BlocoDoPlano {
  id: number;
  planoDeAulaId: number;
  ordem: number;
  nome: string;
  tipo: number;
  duracaoMinutos: number;
  descricao?: string | null;
  atividades: AtividadeDoBloco[];
}

export interface PlanoDeAula {
  id: number;
  poloId: number;
  turma: number;
  titulo: string;
  objetivo?: string | null;
  dataPrevista: string;
  duracaoTotalMinutos: number;
  status: number;
  aulaId?: number | null;
  blocos: BlocoDoPlano[];
}

export interface BlocoDoModelo {
  id: number;
  modeloDeAulaId: number;
  ordem: number;
  nome: string;
  tipo: number;
  duracaoMinutos: number;
  descricao?: string | null;
}

export interface ModeloDeAula {
  id: number;
  nome: string;
  descricao?: string | null;
  duracaoTotalMinutos: number;
  blocos: BlocoDoModelo[];
}

export interface HistoricoAtividade {
  atividadeId: number;
  nome: string;
  tipo: number;
  ultimaData: string;
  vezes: number;
}

export interface Usuario {
  id: number;
  login: string;
  password?: string;
  email: string;
  role: number; // 0=Administrador, 1=Supervisor, 2=Professor
  poloId?: number | null;
  poloNome?: string | null;
  // Libera o professor a acessar o módulo Programa de Graduação.
  permiteGraduacao?: boolean;
}

export const ROLE_LABEL: Record<number, string> = {
  0: "Administrador",
  1: "Supervisor",
  2: "Professor",
};

export interface Aniversariante {
  nome: string;
  dataNascimento: string;
  jaComemorado: boolean;
}

export interface EventoCalendario {
  id: number;
  ano: number;
  data: string; // ISO
  dataFim?: string | null;
  titulo: string;
  tipo: number;
  descricao?: string | null;
  poloId?: number | null;
  // true = calendário interno (só a equipe vê); false = calendário do instituto.
  interno?: boolean;
  notificar: boolean;
  emailsNotificacao?: string | null; // vários emails separados por , ou ;
  diasAntecedencia: number; // 0 = no dia do evento
}

export interface DocumentoOficial {
  id: number;
  tipo: number; // 0 = Ofício, 1 = Recibo
  status: number; // 0 = Rascunho, 1 = Aprovado
  ano: number;
  numero: number;
  numeroFormatado: string;
  dataDocumento: string; // ISO
  titulo: string; // resumo para a listagem
  conteudo: string; // JSON dos campos do tipo
  dataAprovacao?: string | null;
}

export const TIPO_DOC_OFICIAL = { Oficio: 0, Recibo: 1 } as const;
export const STATUS_DOC = { Rascunho: 0, Aprovado: 1 } as const;

export interface Aviso {
  id: number;
  titulo?: string | null;
  mensagem: string;
  publicoAlvo: number; // 0=Todos, 1=Professores, 2=Supervisores, 3=Administradores
  dataCriacao: string;
  criadoPor?: string | null;
  ativo: boolean;
}

export const PUBLICO_AVISO_LABEL: Record<number, string> = {
  0: "Todos",
  1: "Professores",
  2: "Supervisores",
  3: "Administradores",
};

export interface BemPatrimonial {
  id: number;
  categoria: number;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  dataAquisicao?: string | null;
  estado: number;
  poloId?: number | null;
  numeroPatrimonio?: string | null;
  observacoes?: string | null;
}

export interface AuthData {
  token: string;
  tokenExpires: string;
  // Presente no login/refresh; o cliente guarda para renovar a sessão.
  refreshToken?: string;
}

// Resposta do login: ou os tokens, ou o pedido do segundo fator (2FA ativo e
// código ainda não informado).
export type LoginResposta = AuthData | { requer2fa: true };

export interface SincronizacaoHistorico {
  id: number;
  dataExecucao: string;
  poloNome: string;
  poloId: number;
  inseridos: number;
  atualizados: number;
  ignorados: number;
  sucesso: boolean;
  erros?: string | null;
  origem: string;
}

export interface RelatorioSalvo {
  id: number;
  usuarioLogin?: string | null;
  nome: string;
  fonteId: string;
  colunas: string;
  turma?: number | null;
  poloId?: number | null;
}

// CategoriaDocumento espelha o enum da API (serializado pelo nome). String
// para casar direto com a rota /DocumentoContabil/listar/{categoria}.
export const CategoriaDocumento = {
  Dre: "Dre",
  Balanco: "Balanco",
  RelatorioAtividades: "RelatorioAtividades",
  Modelos: "Modelos",
} as const;

export type CategoriaDocumento =
  (typeof CategoriaDocumento)[keyof typeof CategoriaDocumento];

export interface DocumentoArquivo {
  id: string;
  nome: string;
  tamanhoBytes: number;
  dataCriacao?: string | null; // ISO
  mimeType: string;
}

export type Papel = "Administrador" | "Supervisor" | "Professor";

export interface Sessao {
  login: string;
  email: string;
  role: Papel | string;
  poloId: number | null;
  poloNome: string;
  isAdministrador: boolean;
  isProfessor: boolean;
  // Permissão extra concedida pelo admin: acessar o Programa de Graduação.
  permiteGraduacao: boolean;
  // Módulos comerciais que a conta contratou. Decide o que aparece no menu e
  // o que as rotas liberam. Ver src/config/modulos.ts.
  modulos: ModuloId[];
}
