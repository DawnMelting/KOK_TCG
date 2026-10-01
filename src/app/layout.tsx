import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MYL | Tienda de cartas",
  description: "Catálogo de cartas de MYL para explorar, filtrar y preparar un pedido.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
