import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageCircle, X, Send, ArrowRight, Sparkles } from "lucide-react";
import { SITE } from "@/features/site/conteudoSite";
import type { LinkFaq } from "@/features/site/conteudoSite";
import { Button } from "@/components/ui/button";

// Páginas públicas onde o assistente aparece.
const ROTAS_PUBLICAS = new Set([
  "/",
  "/site",
  "/doar",
  "/transparencia",
  "/galeria",
  "/loja",
  "/informacoes",
  "/matricula",
  "/responsavel",
]);

// Atalhos de navegação (aparecem sempre + no rodapé do chat).
const ATALHOS: { label: string; para: string }[] = [
  { label: "Fazer inscrição", para: "/matricula" },
  { label: "Área do Responsável", para: "/responsavel" },
  { label: "Galeria", para: "/galeria" },
  { label: "Doar", para: "/doar" },
  { label: "Transparência", para: "/transparencia" },
  { label: "Loja", para: "/loja" },
];

// Perguntas iniciais sugeridas.
const SUGESTOES_INICIAIS = [
  "Polos e Endereços",
  "Como faço a inscrição?",
  "Onde vejo as fotos?",
  "Como acompanho meu filho?",
  "Como faço uma doação?",
];

const STOPWORDS = new Set([
  "de", "da", "do", "das", "dos", "a", "o", "as", "os", "e", "é", "um", "uma",
  "que", "com", "sem", "para", "por", "no", "na", "nos", "nas", "em", "ao",
  "aos", "se", "ou", "meu", "minha", "seu", "sua", "the", "como", "onde",
  "qual", "quais", "quando", "quem", "posso", "tem", "ter", "fazer", "faz",
]);

function normalizar(texto: string): string[] {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

interface ItemFaq {
  pergunta: string;
  resposta: string;
  link?: LinkFaq;
  tokensPergunta: Set<string>;
  tokensResposta: Set<string>;
}

interface Mensagem {
  autor: "davi" | "voce";
  texto: string;
  link?: LinkFaq;
  sugestoes?: string[];
}

export function Davizinho() {
  const location = useLocation();
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const [entrada, setEntrada] = useState("");
  // Imagem do Davizinho (logo do instituto em /public); cai no ícone se faltar.
  const [logoOk, setLogoOk] = useState(true);
  const fimRef = useRef<HTMLDivElement>(null);

  const saudacao: Mensagem = useMemo(
    () => ({
      autor: "davi",
      texto:
        "Oi! Eu sou o Davizinho 🥋 Posso te ajudar a encontrar informações e a navegar pelo site. Me conte sua dúvida ou escolha uma opção:",
      sugestoes: SUGESTOES_INICIAIS,
    }),
    [],
  );
  const [mensagens, setMensagens] = useState<Mensagem[]>([saudacao]);

  // Índice do FAQ, montado uma vez a partir do conteúdo do site.
  const indice = useMemo<ItemFaq[]>(() => {
    const itens: ItemFaq[] = [];
    for (const cat of SITE.informacoes.categorias)
      for (const p of cat.perguntas)
        itens.push({
          pergunta: p.pergunta,
          resposta: p.resposta,
          link: p.link,
          tokensPergunta: new Set(normalizar(p.pergunta)),
          tokensResposta: new Set(normalizar(`${p.resposta} ${cat.titulo}`)),
        });
    return itens;
  }, []);

  useEffect(() => {
    if (aberto) fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, aberto]);

  function melhorResposta(pergunta: string): Mensagem {
    const tokens = normalizar(pergunta);
    // Saudação simples.
    if (tokens.length === 0 || /\b(oi|ola|opa|bom dia|boa tarde|boa noite)\b/.test(pergunta.toLowerCase())) {
      return { ...saudacao, texto: "Como posso ajudar? Escolha uma opção ou escreva sua dúvida:" };
    }

    // Intenção de polos: leva à lista de polos com endereços e horários, que é
    // montada a partir do próprio cadastro na página de Informações.
    if (tokens.some((t) => t === "polo" || t === "polos")) {
      return {
        autor: "davi",
        texto:
          "Temos vários polos. Você pode ver todos, com endereço e horários das turmas, na página de Informações.",
        link: { label: "Ver polos e endereços", para: "/informacoes" },
      };
    }

    const ranqueados = indice
      .map((item) => {
        let score = 0;
        for (const t of tokens) {
          if (item.tokensPergunta.has(t)) score += 2;
          else if (item.tokensResposta.has(t)) score += 1;
        }
        return { item, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);

    if (ranqueados.length === 0 || ranqueados[0].score < 2) {
      return {
        autor: "davi",
        texto:
          "Não achei uma resposta exata. Você pode ver todas as perguntas frequentes ou tentar reformular. Também posso te levar direto a uma seção:",
        link: { label: "Ver perguntas frequentes", para: "/informacoes" },
        sugestoes: SUGESTOES_INICIAIS,
      };
    }

    const melhor = ranqueados[0].item;
    const relacionadas = ranqueados
      .slice(1, 3)
      .filter((r) => r.score >= 2)
      .map((r) => r.item.pergunta);

    return {
      autor: "davi",
      texto: melhor.resposta,
      link: melhor.link,
      sugestoes: relacionadas.length > 0 ? relacionadas : undefined,
    };
  }

  function perguntar(texto: string) {
    const q = texto.trim();
    if (!q) return;
    setEntrada("");
    setMensagens((m) => [...m, { autor: "voce", texto: q }, melhorResposta(q)]);
  }

  function irPara(link: LinkFaq) {
    if (link.externo) window.open(link.para, "_blank", "noopener,noreferrer");
    else {
      navigate(link.para);
      setAberto(false);
    }
  }

  if (!ROTAS_PUBLICAS.has(location.pathname)) return null;

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setAberto((a) => !a)}
        aria-label={aberto ? "Fechar assistente" : "Abrir assistente Davizinho"}
        className="fixed bottom-4 right-4 z-50 flex size-14 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        {aberto ? (
          <X className="size-6" />
        ) : logoOk ? (
          <img
            src="/davizinho.png"
            alt="Davizinho"
            className="size-full object-cover"
            onError={() => setLogoOk(false)}
          />
        ) : (
          <MessageCircle className="size-6" />
        )}
      </button>

      {/* Painel */}
      {aberto && (
        <div className="fixed bottom-20 right-4 z-50 flex max-h-[70vh] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border bg-primary/10 px-4 py-3">
            <span className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground">
              {logoOk ? (
                <img
                  src="/davizinho.png"
                  alt="Davizinho"
                  className="size-full object-cover"
                  onError={() => setLogoOk(false)}
                />
              ) : (
                <Sparkles className="size-4" />
              )}
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight">Davizinho</p>
              <p className="text-xs text-muted-foreground">Assistente do Instituto</p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {mensagens.map((m, i) => (
              <div key={i} className={m.autor === "voce" ? "text-right" : ""}>
                <div
                  className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    m.autor === "voce"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {m.texto}
                </div>
                {m.link && (
                  <div className={m.autor === "voce" ? "" : "mt-1.5"}>
                    <Button size="sm" variant="outline" onClick={() => irPara(m.link!)}>
                      {m.link.label}
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                )}
                {m.sugestoes && m.sugestoes.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {m.sugestoes.map((s) => (
                      <button
                        key={s}
                        onClick={() => perguntar(s)}
                        className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={fimRef} />
          </div>

          {/* Atalhos de navegação */}
          <div className="flex flex-wrap gap-1.5 border-t border-border px-3 py-2">
            {ATALHOS.map((a) => (
              <button
                key={a.para}
                onClick={() => irPara({ label: a.label, para: a.para })}
                className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {a.label}
              </button>
            ))}
          </div>

          {/* Entrada */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              perguntar(entrada);
            }}
            className="flex items-center gap-2 border-t border-border p-2"
          >
            <input
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              placeholder="Escreva sua dúvida…"
              className="flex-1 rounded-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40"
            />
            <Button type="submit" size="icon" className="shrink-0 rounded-full" aria-label="Enviar">
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
