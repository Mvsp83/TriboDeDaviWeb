// Redimensiona/corta uma imagem no navegador para uma miniatura quadrada e
// devolve um data URI JPEG pequeno — mantém o avatar leve no banco.

const TIPOS_ACEITOS = ["image/png", "image/jpeg", "image/webp"];
const ENTRADA_MAX_BYTES = 10 * 1024 * 1024; // 10 MB de arquivo de origem
// Abaixo do limite da API (~55.000) para deixar margem.
const SAIDA_MAX_CHARS = 50_000;

function carregarImagem(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem."));
    };
    img.src = url;
  });
}

// Desenha a imagem com corte central "cover" num canvas quadrado de `tamanho`.
function desenharQuadrado(img: HTMLImageElement, tamanho: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = tamanho;
  canvas.height = tamanho;
  const ctx = canvas.getContext("2d")!;

  const lado = Math.min(img.width, img.height);
  const sx = (img.width - lado) / 2;
  const sy = (img.height - lado) / 2;
  ctx.drawImage(img, sx, sy, lado, lado, 0, 0, tamanho, tamanho);

  return canvas;
}

// Redimensiona uma foto preservando a proporção, para uso em documentos (PDF).
// Reduz a largura máxima e comprime em JPEG — mantém o arquivo gerado leve.
export async function redimensionarFoto(
  file: File,
  larguraMax = 1200,
  qualidade = 0.82,
): Promise<string> {
  if (!TIPOS_ACEITOS.includes(file.type)) {
    throw new Error("Formato não suportado. Use PNG, JPEG ou WebP.");
  }
  if (file.size > ENTRADA_MAX_BYTES) {
    throw new Error("A imagem é muito grande. Escolha um arquivo de até 10 MB.");
  }

  const img = await carregarImagem(file);
  const escala = Math.min(1, larguraMax / img.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * escala);
  canvas.height = Math.round(img.height * escala);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", qualidade);
}

export async function redimensionarQuadrado(
  file: File,
  tamanho = 128,
  qualidade = 0.8,
): Promise<string> {
  if (!TIPOS_ACEITOS.includes(file.type)) {
    throw new Error("Formato não suportado. Use PNG, JPEG ou WebP.");
  }
  if (file.size > ENTRADA_MAX_BYTES) {
    throw new Error("A imagem é muito grande. Escolha um arquivo de até 10 MB.");
  }

  const img = await carregarImagem(file);

  // Se ainda ficar grande demais, reduz qualidade e depois o tamanho até caber.
  let dim = tamanho;
  for (let tentativa = 0; tentativa < 6; tentativa++) {
    const canvas = desenharQuadrado(img, dim);
    let q = qualidade;
    for (let i = 0; i < 4; i++) {
      const dataUrl = canvas.toDataURL("image/jpeg", q);
      if (dataUrl.length <= SAIDA_MAX_CHARS) return dataUrl;
      q -= 0.15;
      if (q < 0.3) break;
    }
    dim = Math.round(dim * 0.8);
    if (dim < 48) break;
  }

  throw new Error("Não foi possível comprimir a imagem o suficiente. Tente outra foto.");
}
