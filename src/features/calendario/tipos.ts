// Tipos de evento do calendário (espelham o enum TipoEventoCalendario da API).
export const TIPO_EVENTO_LABEL: Record<number, string> = {
  0: "Início das aulas",
  1: "Término das aulas",
  2: "Graduação",
  3: "Data comemorativa",
  4: "DRE",
  5: "Balanço",
  6: "Fechamento financeiro",
  7: "Assembleia",
  8: "Outro",
};

// Cor por tipo (usada no ponto/badge do evento).
export function corTipoEvento(tipo: number): string {
  switch (tipo) {
    case 0:
      return "#22c55e"; // início — verde
    case 1:
      return "#f97316"; // término — laranja
    case 2:
      return "#F5C518"; // graduação — dourado
    case 3:
      return "#a855f7"; // comemorativa — roxo
    case 4:
      return "#3b82f6"; // DRE — azul
    case 5:
      return "#06b6d4"; // balanço — ciano
    case 6:
      return "#14b8a6"; // fechamento — teal
    case 7:
      return "#ec4899"; // assembleia — rosa
    default:
      return "#78909c"; // outro — cinza
  }
}

export const TIPOS_EVENTO: { valor: number; label: string }[] = Object.entries(
  TIPO_EVENTO_LABEL,
).map(([valor, label]) => ({ valor: Number(valor), label }));

// Agrupamento para a UI: tipos "administrativos" vs "de aula/instituto".
export const TIPOS_ADMINISTRATIVOS = new Set([4, 5, 6, 7]);
