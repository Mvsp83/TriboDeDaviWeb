// Gera o "Pix copia e cola" (BR Code) no padrão EMV®QRCPS do Banco Central.
//
// O payload é uma sequência de campos ID+tamanho+valor. O último campo (63) é
// um CRC16 calculado sobre todo o restante — por isso ele é montado por último.
// Referência: Manual do BR Code (BCB) — campos obrigatórios para Pix estático.

// Remove acentos e caracteres fora do ASCII imprimível: o padrão só aceita
// esse conjunto, e acento no nome/cidade faz alguns bancos recusarem o código.
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // acentos separados pelo NFD
    .replace(/[^ -~]/g, "") // fora do ASCII imprimível
    .trim();
}

// Cada campo é "ID + comprimento com 2 dígitos + valor".
function campo(id: string, valor: string): string {
  return `${id}${String(valor.length).padStart(2, "0")}${valor}`;
}

// CRC16/CCITT-FALSE (polinômio 0x1021, inicial 0xFFFF), exigido pelo padrão.
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export interface DadosPix {
  // Chave Pix da instituição (CNPJ, e-mail, telefone ou aleatória).
  chave: string;
  // Nome do recebedor (máx. 25 caracteres no padrão).
  nome: string;
  // Cidade do recebedor (máx. 15 caracteres no padrão).
  cidade: string;
  // Valor sugerido. Omitido/0 deixa o doador escolher no app do banco.
  valor?: number | null;
  // Identificador da transação (máx. 25). Sem valor, usa "***".
  txid?: string;
}

export function gerarPixBrCode({
  chave,
  nome,
  cidade,
  valor,
  txid,
}: DadosPix): string {
  const chaveLimpa = normalizar(chave);
  // O padrão limita nome a 25 e cidade a 15 caracteres.
  const nomeLimpo = normalizar(nome).slice(0, 25) || "RECEBEDOR";
  const cidadeLimpa = normalizar(cidade).slice(0, 15) || "BRASIL";
  const idTx = normalizar(txid ?? "").slice(0, 25) || "***";

  // Conta do recebedor: GUI fixa do Pix + a chave.
  const contaPix = campo("00", "br.gov.bcb.pix") + campo("01", chaveLimpa);

  let payload =
    campo("00", "01") + // versão do payload
    campo("26", contaPix) + // dados da conta Pix
    campo("52", "0000") + // categoria do estabelecimento (não informada)
    campo("53", "986") + // moeda: BRL
    // Valor é opcional: sem ele, o doador digita quanto quiser.
    (valor && valor > 0 ? campo("54", valor.toFixed(2)) : "") +
    campo("58", "BR") + // país
    campo("59", nomeLimpo) +
    campo("60", cidadeLimpa) +
    campo("62", campo("05", idTx)); // identificador da transação

  // O CRC cobre o payload inteiro, incluindo o próprio "6304".
  payload += "6304";
  return payload + crc16(payload);
}
