import { useEffect, useRef, useState } from "react";

// Conta de 0 até `alvo` quando o elemento entra em tela (uma vez só).
// Usa IntersectionObserver porque o valor é texto — não dá para animar em CSS —
// e requestAnimationFrame para não depender de setInterval (que deriva).
//
// Uso:
//   const { ref, valor } = useContador(253);
//   <div ref={ref}>{valor}</div>
export function useContador(alvo: number, duracao = 1400) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [valor, setValor] = useState(0);
  const jaRodou = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Quem pede menos movimento vê o número final direto.
    const semMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (semMovimento) {
      setValor(alvo);
      return;
    }

    const animar = () => {
      const inicio = performance.now();
      const passo = (agora: number) => {
        const p = Math.min(1, (agora - inicio) / duracao);
        // easeOutCubic — desacelera no fim, como o resto do movimento do app.
        setValor(Math.round(alvo * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    };

    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas[0]?.isIntersecting && !jaRodou.current) {
          jaRodou.current = true;
          animar();
          obs.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [alvo, duracao]);

  return { ref, valor };
}
