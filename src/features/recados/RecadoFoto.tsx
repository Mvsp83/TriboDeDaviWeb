import { useEffect, useState } from "react";

// Miniatura do recado carregada por busca autenticada (o <img> não envia o
// token). `buscar` devolve um data URI — vem do cliente admin ou do portal,
// cada um com seu próprio token. Sem foto, não renderiza nada.
export function RecadoFoto({
  recadoId,
  buscar,
  className,
}: {
  recadoId: number;
  buscar: (id: number) => Promise<string>;
  className?: string;
}) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let vivo = true;
    buscar(recadoId)
      .then((uri) => {
        if (vivo) setSrc(uri);
      })
      .catch(() => {
        /* sem foto / falha: mantém vazio */
      });
    return () => {
      vivo = false;
    };
  }, [recadoId, buscar]);

  if (!src) return null;
  return <img src={src} alt="" className={className} />;
}
