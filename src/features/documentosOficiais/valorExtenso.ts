// Valor monetário por extenso (pt-BR). Gerado automaticamente no recibo; o
// campo continua editável para casos que fujam à regra.
const UNI = [
  "zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove",
];
const DEZ10 = [
  "dez", "onze", "doze", "treze", "catorze", "quinze", "dezesseis", "dezessete",
  "dezoito", "dezenove",
];
const DEZ = [
  "", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta",
  "oitenta", "noventa",
];
const CEM = [
  "", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos",
  "seiscentos", "setecentos", "oitocentos", "novecentos",
];

function grupo(n: number): string {
  if (n === 100) return "cem";
  const c = Math.floor(n / 100);
  const r = n % 100;
  const d = Math.floor(r / 10);
  const u = r % 10;
  const p: string[] = [];
  if (c) p.push(CEM[c]);
  if (r >= 10 && r < 20) p.push(DEZ10[r - 10]);
  else {
    if (d) p.push(DEZ[d]);
    if (u) p.push(UNI[u]);
  }
  return p.join(" e ");
}

function inteiroExtenso(n: number): string {
  if (n === 0) return "zero";
  const grupos: number[] = [];
  let x = n;
  while (x > 0) {
    grupos.push(x % 1000);
    x = Math.floor(x / 1000);
  }
  const textos: string[] = [];
  const valores: number[] = [];
  for (let g = grupos.length - 1; g >= 0; g--) {
    const val = grupos[g];
    if (val === 0) continue;
    let txt: string;
    if (g === 0) txt = grupo(val);
    else if (g === 1) txt = val === 1 ? "mil" : `${grupo(val)} mil`;
    else txt = `${grupo(val)} ${val === 1 ? "milhão" : "milhões"}`;
    textos.push(txt);
    valores.push(g === 0 ? val : -1);
  }

  let resultado = textos[0];
  for (let i = 1; i < textos.length; i++) {
    const ultimo = i === textos.length - 1;
    const v = valores[i];
    // "e" antes do último grupo quando é < 100 ou múltiplo exato de 100.
    const usaE = ultimo && v >= 0 && (v < 100 || v % 100 === 0);
    resultado += (usaE ? " e " : " ") + textos[i];
  }
  return resultado;
}

export function valorPorExtenso(valor: number): string {
  const total = Math.max(0, Math.round((valor || 0) * 100));
  const reais = Math.floor(total / 100);
  const centavos = total % 100;
  const partes: string[] = [];
  if (reais > 0)
    partes.push(`${inteiroExtenso(reais)} ${reais === 1 ? "real" : "reais"}`);
  if (centavos > 0) {
    if (reais > 0) partes.push("e");
    partes.push(`${inteiroExtenso(centavos)} ${centavos === 1 ? "centavo" : "centavos"}`);
  }
  if (partes.length === 0) return "zero reais";
  return partes.join(" ");
}
