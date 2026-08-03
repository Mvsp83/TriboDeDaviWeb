import { Toaster as Sonner, type ToasterProps } from "sonner";

// Toaster no tema dark da marca, ancorado no canto inferior direito
// (mesma posição do Snackbar do portal Blazor).
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      richColors
      toastOptions={{
        style: {
          background: "var(--card)",
          color: "var(--card-foreground)",
          border: "1px solid var(--border)",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
