import { ShieldCheck, Mail } from "lucide-react";
import { SITE } from "@/features/site/conteudoSite";
import { TRANSPARENCIA } from "@/features/transparencia/conteudoTransparencia";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { PaginaPublica } from "@/components/PaginaPublica";

// ── Preencher pelo instituto ────────────────────────────────────────────────
// Encarregado (DPO) e canal do titular. Deixe o e-mail preenchido para o site
// mostrar o contato; sem e-mail, aparece um aviso de "a definir".
const ENCARREGADO = {
  nome: "Valdeci da Silva", // responsável legal; troque se designar outro Encarregado
  email: "", // ex.: "privacidade@institutotribodedavi.org.br"
};
const VIGENCIA = "1º de setembro de 2026";

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
        {titulo}
      </h2>
      <div className="mt-3 space-y-3 text-pretty leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export function PoliticaPrivacidadePage() {
  useDocumentTitle(`Política de Privacidade — ${SITE.nome}`);
  const id = TRANSPARENCIA.identificacao;
  const nome = id.razaoSocial || SITE.nome;

  return (
    <PaginaPublica larguraMax="max-w-3xl">
      <article className="mx-auto max-w-3xl px-4 pb-16 pt-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <ShieldCheck className="size-3.5" />
          Proteção de dados (LGPD)
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
          Política de Privacidade
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Em vigor desde {VIGENCIA}.</p>

        <Secao titulo="1. Quem é o responsável pelos seus dados">
          <p>
            O tratamento dos dados pessoais descritos aqui é feito por{" "}
            <span className="font-medium text-foreground">{nome}</span>
            {id.cnpj ? `, inscrito no CNPJ ${id.cnpj}` : ""}
            {id.endereco ? `, com sede em ${id.endereco}` : ""} ("Instituto"),
            na qualidade de <span className="font-medium text-foreground">controlador</span>,
            nos termos da Lei nº 13.709/2018 (LGPD).
          </p>
          <p>
            Esta política explica quais dados coletamos, por que, com que base
            legal, por quanto tempo os guardamos e como você exerce seus direitos.
          </p>
        </Secao>

        <Secao titulo="2. Quais dados tratamos">
          <p>Conforme a sua relação com o projeto, podemos tratar:</p>
          <ul className="ml-4 list-disc space-y-1.5">
            <li>
              <span className="font-medium text-foreground">Do aluno (criança ou adolescente):</span>{" "}
              nome, data de nascimento, RG/CPF (quando informados), faixa,
              escola, série, foto de rosto e dados de contato.
            </li>
            <li>
              <span className="font-medium text-foreground">Dados de saúde (sensíveis):</span>{" "}
              questionário de aptidão física (PAR-Q), restrições médicas e
              medicamentos, usados apenas para a prática segura do esporte.
            </li>
            <li>
              <span className="font-medium text-foreground">Do responsável:</span>{" "}
              nome, grau de parentesco, RG/CPF, telefone/WhatsApp e endereço.
            </li>
            <li>
              <span className="font-medium text-foreground">Da participação:</span>{" "}
              presenças, graduações, ocorrências pedagógicas e fotos de treino.
            </li>
            <li>
              <span className="font-medium text-foreground">De doadores:</span>{" "}
              nome e contato de quem opta por se identificar ao doar.
            </li>
            <li>
              <span className="font-medium text-foreground">Do professor/equipe:</span>{" "}
              dados de acesso ao sistema e, opcionalmente, nome, faixa e foto
              para exibição pública na seção do polo.
            </li>
          </ul>
        </Secao>

        <Secao titulo="3. Para que usamos">
          <ul className="ml-4 list-disc space-y-1.5">
            <li>Realizar a inscrição, a matrícula e a gestão pedagógica das aulas.</li>
            <li>Zelar pela segurança do aluno na prática esportiva (dados de saúde).</li>
            <li>Comunicar-nos com o responsável (avisos, faltas, recados).</li>
            <li>Divulgar as atividades do projeto, com fotos autorizadas.</li>
            <li>Prestar contas e cumprir obrigações legais e contábeis.</li>
            <li>Registrar e reconhecer doações.</li>
          </ul>
        </Secao>

        <Secao titulo="4. Com que base legal">
          <p>
            Tratamos os dados com apoio no <span className="font-medium text-foreground">consentimento</span>{" "}
            (por exemplo, para uso de imagem), na{" "}
            <span className="font-medium text-foreground">execução das atividades do Instituto</span>{" "}
            e no atendimento a{" "}
            <span className="font-medium text-foreground">obrigações legais e regulatórias</span>.
            Para dados sensíveis de saúde, o tratamento se dá para a proteção da
            vida e da incolumidade física do titular, com o devido cuidado.
          </p>
        </Secao>

        <Secao titulo="5. Dados de crianças e adolescentes">
          <p>
            O projeto atende crianças e adolescentes. Seus dados são tratados
            sempre no <span className="font-medium text-foreground">melhor interesse do menor</span>{" "}
            (art. 14 da LGPD) e mediante{" "}
            <span className="font-medium text-foreground">consentimento do responsável legal</span>,
            colhido no ato da inscrição. Não condicionamos a participação ao
            fornecimento de dados além do necessário.
          </p>
        </Secao>

        <Secao titulo="6. Uso de imagem">
          <p>
            Fotos de aulas, graduações e eventos só são publicadas com{" "}
            <span className="font-medium text-foreground">autorização do responsável</span>.
            As imagens passam por moderação antes de aparecer no site. A qualquer
            momento é possível pedir a remoção de uma foto pelos canais abaixo ou
            junto à coordenação do polo.
          </p>
        </Secao>

        <Secao titulo="7. Com quem compartilhamos">
          <p>
            <span className="font-medium text-foreground">Não vendemos</span> e não
            cedemos seus dados para fins comerciais. Podemos utilizar prestadores
            de tecnologia (hospedagem e infraestrutura) estritamente para operar o
            sistema, e compartilhar dados quando exigido por lei ou autoridade
            competente.
          </p>
        </Secao>

        <Secao titulo="8. Por quanto tempo guardamos">
          <p>
            Guardamos os dados enquanto durar a relação com o projeto e pelos
            prazos exigidos por lei (por exemplo, contábeis). Inscrições{" "}
            <span className="font-medium text-foreground">recusadas</span> — que não
            se tornaram matrícula — têm seus dados pessoais eliminados após 12
            meses. Encerrada a necessidade, os dados são anonimizados ou
            eliminados.
          </p>
        </Secao>

        <Secao titulo="9. Segurança">
          <p>
            Adotamos medidas técnicas e organizacionais para proteger os dados,
            como controle de acesso por perfil, autenticação, registro de
            auditoria das operações sensíveis e transmissão protegida. Nenhum
            sistema é 100% imune, mas trabalhamos para reduzir riscos.
          </p>
        </Secao>

        <Secao titulo="10. Seus direitos">
          <p>Como titular, você pode, a qualquer momento:</p>
          <ul className="ml-4 list-disc space-y-1.5">
            <li>confirmar a existência de tratamento e acessar seus dados;</li>
            <li>corrigir dados incompletos, inexatos ou desatualizados;</li>
            <li>solicitar a anonimização, o bloqueio ou a eliminação de dados desnecessários;</li>
            <li>pedir a portabilidade dos seus dados;</li>
            <li>revogar um consentimento dado (por exemplo, o uso de imagem);</li>
            <li>obter informação sobre o compartilhamento dos seus dados.</li>
          </ul>
        </Secao>

        <Secao titulo="11. Encarregado (DPO) e como falar conosco">
          <p>
            Para exercer seus direitos ou tirar dúvidas sobre esta política, fale
            com o nosso Encarregado pelo tratamento de dados:
          </p>
          <div className="mt-1 rounded-xl border border-border bg-card p-4 text-sm">
            <p className="font-medium text-foreground">{ENCARREGADO.nome}</p>
            {ENCARREGADO.email ? (
              <a
                href={`mailto:${ENCARREGADO.email}`}
                className="mt-1 inline-flex items-center gap-2 text-primary hover:underline"
              >
                <Mail className="size-4" />
                {ENCARREGADO.email}
              </a>
            ) : (
              <p className="mt-1 text-muted-foreground">
                Contato: fale com a coordenação do polo
                {id.endereco ? ` ou na sede (${id.endereco})` : ""}.
              </p>
            )}
          </div>
        </Secao>

        <Secao titulo="12. Cookies e armazenamento local">
          <p>
            O sistema usa o armazenamento do seu navegador apenas para o
            funcionamento (manter a sessão e permitir o uso sem internet nas
            aulas). <span className="font-medium text-foreground">Não usamos</span>{" "}
            rastreadores de publicidade nem vendemos histórico de navegação.
          </p>
        </Secao>

        <Secao titulo="13. Alterações">
          <p>
            Esta política pode ser atualizada. Publicaremos aqui a versão vigente,
            sempre com a data de atualização no topo.
          </p>
        </Secao>
      </article>
    </PaginaPublica>
  );
}
