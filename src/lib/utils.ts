import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Só devolve a URL se for http/https. Qualquer outro esquema (javascript:,
// data:, vbscript:…) vira undefined — evita que um link vindo da API execute
// script ao ser clicado num href. Use em `href` alimentado por dados.
export function urlSegura(valor: string | null | undefined): string | undefined {
  if (!valor) return undefined;
  const bruto = valor.trim();
  try {
    const u = new URL(bruto, window.location.origin);
    return u.protocol === "http:" || u.protocol === "https:" ? bruto : undefined;
  } catch {
    return undefined;
  }
}
