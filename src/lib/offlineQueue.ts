// Fila offline das chamadas: quando o professor salva sem internet, a chamada
// fica aqui (localStorage) até a conexão voltar. Uma chamada pendente por aula
// — reenviar substitui a anterior. Ver offlineSync.ts para o envio.
import type { MarcaChamada } from "@/features/chamada/chamadaApi";

export interface ChamadaPendente {
  aulaId: number;
  poloId: number;
  data: string;
  marcas: MarcaChamada[];
  criadaEm: number;
}

const KEY = "tribo-chamadas-pendentes";
const ouvintes = new Set<() => void>();

function ler(): ChamadaPendente[] {
  try {
    const bruto = localStorage.getItem(KEY);
    return bruto ? (JSON.parse(bruto) as ChamadaPendente[]) : [];
  } catch {
    return [];
  }
}

function gravar(lista: ChamadaPendente[]): void {
  localStorage.setItem(KEY, JSON.stringify(lista));
  ouvintes.forEach((cb) => cb());
}

export function chamadasPendentes(): ChamadaPendente[] {
  return ler();
}

export function chamadaPendenteDaAula(aulaId: number): ChamadaPendente | undefined {
  return ler().find((c) => c.aulaId === aulaId);
}

export function enfileirarChamada(
  chamada: Omit<ChamadaPendente, "criadaEm">,
): void {
  const lista = ler().filter((c) => c.aulaId !== chamada.aulaId);
  lista.push({ ...chamada, criadaEm: Date.now() });
  gravar(lista);
}

export function removerChamada(aulaId: number): void {
  gravar(ler().filter((c) => c.aulaId !== aulaId));
}

// Assina mudanças na fila (inclui alterações feitas em outra aba). Devolve a
// função de cancelamento.
export function assinarFila(cb: () => void): () => void {
  ouvintes.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    ouvintes.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}
