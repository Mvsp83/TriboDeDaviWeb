// Categorias do mural de recados (espelham o int Categoria da API).
export const CATEGORIA_RECADO_LABEL: Record<number, string> = {
  0: "Emprego",
  1: "Veículo",
  2: "Imóvel",
  3: "Serviços",
  4: "Achados e Perdidos",
  5: "Outros",
};

export const CATEGORIAS_RECADO = Object.entries(CATEGORIA_RECADO_LABEL).map(
  ([valor, label]) => ({ valor: Number(valor), label }),
);
