// Modelos do domínio, espelhando os DTOs da API Tribo de Davi.

export interface Aluno {
  id: number;
  nome: string;
  rg?: string | null;
  cpf?: string | null;
  dataNascimento: string; // ISO
  peso?: number | null;
  faixa: number;
  endereco?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  celular?: string | null;
  responsavel?: string | null;
  parentesco?: number | null;
  rgResponsavel?: string | null;
  cpfResponsavel?: string | null;
  escola?: string | null;
  periodo?: string | null;
  poloId: number;
  turma: number;
}

export interface Polo {
  id: number;
  nome: string;
  informacoes?: string | null;
  endereco?: string | null;
  bairro?: string | null;
  cidade?: string | null;
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

export interface AuthData {
  token: string;
  tokenExpires: string;
}

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
}
