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

// Data ISO para yyyy-MM-dd (valor de <input type="date">).
export function paraInputDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}
