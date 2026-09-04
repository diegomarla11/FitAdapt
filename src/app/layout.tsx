import type { Metadata } from "next";
import "./globals.css";
import BarraNavegacion from "@/componentes/barraNavegacion";

export const metadata: Metadata = {
  title: "TFG App",
  description: "Aplicación de entrenamiento personalizada",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full bg-slate-950 text-slate-950">
        <BarraNavegacion />
        {children}
      </body>
    </html>
  );
}