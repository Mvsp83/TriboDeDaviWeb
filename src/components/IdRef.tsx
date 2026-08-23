// Mostra o #id do registro, discreto, para cruzar com a tela de Auditoria
// (que referencia cada registro como "<Área> #N"). Uso: <IdRef id={x.id} />.
export function IdRef({ id }: { id: number }) {
  return (
    <span className="mr-2 text-xs font-normal tabular-nums text-muted-foreground">
      #{id}
    </span>
  );
}
