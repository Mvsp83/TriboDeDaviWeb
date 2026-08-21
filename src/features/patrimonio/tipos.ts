// Categorias e estado dos bens (espelham os enums CategoriaBem / EstadoConservacao da API).
export const CATEGORIA_BEM_LABEL: Record<number, string> = {
  0: "Quimono",
  1: "Faixa",
  2: "Tatame",
  3: "Veículo",
  4: "Imóvel",
  5: "Equipamento",
  6: "Móvel",
  7: "Eletrônico",
  8: "Outro",
};

export const ESTADO_BEM_LABEL: Record<number, string> = {
  0: "Novo",
  1: "Bom",
  2: "Regular",
  3: "Ruim",
  4: "Baixado",
};

export const CATEGORIAS_BEM = Object.entries(CATEGORIA_BEM_LABEL).map(
  ([valor, label]) => ({ valor: Number(valor), label }),
);

export const ESTADOS_BEM = Object.entries(ESTADO_BEM_LABEL).map(
  ([valor, label]) => ({ valor: Number(valor), label }),
);
