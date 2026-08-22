// Aplica a máscara de telefone brasileiro conforme o usuário digita: aceita
// só dígitos e formata como (XX) XXXXX-XXXX (celular) ou (XX) XXXX-XXXX (fixo).
export function formatarTelefone(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// Formata TimeSpan serializado ("HH:mm:ss" ou "d.HH:mm:ss") para "HH:mm".
export function horaCurta(hora: string | null | undefined): string {
  if (!hora) return "-";
  const semDias = hora.includes(".") ? hora.split(".").pop()! : hora;
  return semDias.slice(0, 5);
}

// Data ISO para dd/MM/yyyy.
export function dataBR(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("pt-BR");
}

// Data e hora (dd/MM/aaaa HH:mm) — usada no log de auditoria. A API grava em
// UTC; o toLocale converte para o fuso de quem lê.
export function dataHora(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Data ISO para yyyy-MM-dd (valor de <input type="date">).
export function paraInputDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

// Número para moeda brasileira (R$ 1.234,56). Nulos viram R$ 0,00.
export function moeda(valor: number | null | undefined): string {
  const n = typeof valor === "number" && Number.isFinite(valor) ? valor : 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export const MESES_CURTOS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

// Data "yyyy-MM-dd" (sem depender de fuso) para dd/MM/yyyy.
export function dataCurtaBR(iso: string | null | undefined): string {
  if (!iso) return "-";
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : "-";
}
