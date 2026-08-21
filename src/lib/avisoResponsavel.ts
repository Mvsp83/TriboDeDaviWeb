// Aviso ao responsável pelo aluno via WhatsApp.
//
// Usa link wa.me em vez da API oficial do WhatsApp de propósito: é gratuito,
// não exige cadastro no Meta Business nem aprovação de template, e funciona
// hoje no mesmo celular em que o professor faz a chamada. O texto abre
// preenchido e QUEM ENVIA é a pessoa — nada sai automaticamente, o que também
// é mais seguro tratando-se de mensagens sobre crianças.

// Deixa só dígitos e garante o DDI do Brasil.
// Aceita "(47) 99999-8888", "47999998888", "+55 47 99999-8888".
export function normalizarTelefone(bruto: string | null | undefined): string | null {
  const digitos = (bruto ?? "").replace(/\D/g, "");
  if (digitos.length < 10) return null; // sem DDD ou incompleto

  // Já veio com DDI 55 (12 ou 13 dígitos no total).
  if (digitos.startsWith("55") && (digitos.length === 12 || digitos.length === 13)) {
    return digitos;
  }
  // Número nacional com DDD (10 = fixo antigo, 11 = celular com 9).
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`;

  return null; // formato que não sabemos interpretar com segurança
}

// Só o primeiro nome — a mensagem fica mais natural e curta.
function primeiroNome(nome: string): string {
  return (nome ?? "").trim().split(/\s+/)[0] ?? "";
}

export interface DadosAvisoFalta {
  nomeAluno: string;
  nomeResponsavel?: string | null;
  // Data da aula em ISO ou "yyyy-MM-dd".
  data: string;
  nomeInstituto?: string;
}

export function mensagemFalta({
  nomeAluno,
  nomeResponsavel,
  data,
  nomeInstituto = "Instituto Tribo de Davi",
}: DadosAvisoFalta): string {
  const quando = new Date(`${data.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR");
  const saudacao = nomeResponsavel
    ? `Olá, ${primeiroNome(nomeResponsavel)}!`
    : "Olá!";

  return (
    `${saudacao} Aqui é do ${nomeInstituto}. ` +
    `Sentimos falta do(a) ${primeiroNome(nomeAluno)} na aula de ${quando}. ` +
    `Está tudo bem? Se precisar de algo, é só falar com a gente. ` +
    `Contamos com a presença na próxima aula!`
  );
}

export interface DadosAvisoAusencias {
  nomeAluno: string;
  nomeResponsavel?: string | null;
  faltasSeguidas: number;
  nomeInstituto?: string;
}

// Mensagem para quem já vem faltando seguido (widget de evasão): tom de
// acolhimento, não de cobrança.
export function mensagemAusencias({
  nomeAluno,
  nomeResponsavel,
  faltasSeguidas,
  nomeInstituto = "Instituto Tribo de Davi",
}: DadosAvisoAusencias): string {
  const saudacao = nomeResponsavel
    ? `Olá, ${primeiroNome(nomeResponsavel)}!`
    : "Olá!";

  return (
    `${saudacao} Aqui é do ${nomeInstituto}. ` +
    `Notamos que o(a) ${primeiroNome(nomeAluno)} não vem às aulas há ${faltasSeguidas} encontros. ` +
    `Queremos saber se está tudo bem e se podemos ajudar de alguma forma. ` +
    `A vaga dele(a) continua garantida — esperamos vocês de volta!`
  );
}

// Monta o link que abre o WhatsApp com a conversa e o texto prontos.
// Retorna null quando o telefone não é utilizável.
export function linkWhatsApp(telefone: string | null | undefined, texto: string): string | null {
  const numero = normalizarTelefone(telefone);
  if (!numero) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}
