import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Check, CircleAlert } from "lucide-react";
import { alunoIdDoToken } from "@/features/carteirinha/tokenQr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AlunoRoster {
  id: number;
  nome: string;
}

// Lê a carteirinha pela câmera e marca presença. Recebe o roster da turma para
// só aceitar alunos daquela aula — um QR de outra turma é avisado, não marcado.
export function LeitorQrDialog({
  aberto,
  onOpenChange,
  roster,
  jaPresente,
  onPresente,
}: {
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
  roster: AlunoRoster[];
  jaPresente: (alunoId: number) => boolean;
  onPresente: (alunoId: number) => void;
}) {
  const elementoId = "leitor-qr";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  // Anti-repetição: a câmera decodifica o mesmo QR muitas vezes por segundo.
  const ultimoRef = useRef<{ id: number; quando: number } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ultimo, setUltimo] = useState<{ nome: string; ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (!aberto) return;
    let cancelado = false;
    const scanner = new Html5Qrcode(elementoId, { verbose: false });
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" }, // câmera traseira no celular
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (texto) => tratarLeitura(texto),
        undefined,
      )
      .catch(() => {
        if (!cancelado)
          setErro(
            "Não foi possível acessar a câmera. Verifique a permissão no navegador.",
          );
      });

    return () => {
      cancelado = true;
      // stop() é assíncrono; ignorar erro se já parou.
      scanner.stop().then(() => scanner.clear()).catch(() => {});
      scannerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  function tratarLeitura(texto: string) {
    const id = alunoIdDoToken(texto);
    if (id == null) return; // QR que não é do instituto: ignora

    // Evita processar o mesmo aluno repetidamente em fração de segundo.
    const agora = Date.now();
    if (ultimoRef.current?.id === id && agora - ultimoRef.current.quando < 2500) return;
    ultimoRef.current = { id, quando: agora };

    const aluno = roster.find((a) => a.id === id);
    if (!aluno) {
      setUltimo({ nome: `Aluno #${id}`, ok: false, msg: "não é desta turma" });
      return;
    }
    if (jaPresente(id)) {
      setUltimo({ nome: aluno.nome, ok: true, msg: "já estava presente" });
      return;
    }
    onPresente(id);
    setUltimo({ nome: aluno.nome, ok: true, msg: "presença registrada" });
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Ler carteirinha</DialogTitle>
          <DialogDescription>
            Aponte a câmera para o QR da carteirinha. A presença é marcada na hora.
          </DialogDescription>
        </DialogHeader>

        {erro ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {erro}
          </div>
        ) : (
          <div id={elementoId} className="overflow-hidden rounded-lg bg-black" />
        )}

        {ultimo && (
          <div
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
              ultimo.ok
                ? "bg-success/15 text-success"
                : "bg-warning/15 text-warning"
            }`}
          >
            {ultimo.ok ? <Check className="size-4" /> : <CircleAlert className="size-4" />}
            <span>
              <strong>{ultimo.nome}</strong> — {ultimo.msg}
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
