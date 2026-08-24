// Dados de recebimento das doações. Ficam aqui (e não em variável de ambiente)
// porque são públicos por natureza — é a mesma informação impressa num cartaz.
//
// >>> PREENCHA A CHAVE PIX DA ONG ANTES DE DIVULGAR A PÁGINA. <<<
// Enquanto `chave` estiver vazia, a página avisa que a doação não está
// configurada em vez de mostrar um QR Code inválido.

export const DOACAO = {
  // Chave Pix: CNPJ (só números), e-mail, telefone ou chave aleatória.
  chave: "11407173000145",
  // Nome do recebedor como aparece no app do banco (máx. 25 caracteres).
  nome: "Instituto Tribo de Davi",
  // Cidade do recebedor (máx. 15 caracteres).
  cidade: "Blumenau",
  // Valores sugeridos (o doador pode escolher outro).
  sugestoes: [25, 50, 100, 200],
};

export const doacaoConfigurada = () => DOACAO.chave.trim().length > 0;
