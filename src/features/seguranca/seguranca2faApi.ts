import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  confirmar2FA,
  desativar2FA,
  iniciar2FA,
  status2FA,
} from "@/features/auth/authApi";

export function useStatus2FA(habilitado: boolean) {
  return useQuery({
    queryKey: ["2fa-status"],
    queryFn: status2FA,
    enabled: habilitado,
  });
}

export function useIniciar2FA() {
  return useMutation({ mutationFn: iniciar2FA });
}

export function useConfirmar2FA() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (codigo: string) => confirmar2FA(codigo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["2fa-status"] }),
  });
}

export function useDesativar2FA() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (codigo: string) => desativar2FA(codigo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["2fa-status"] }),
  });
}
