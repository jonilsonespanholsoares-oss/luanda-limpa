import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Luanda Limpa",
  description: "Plataforma de gestão de resíduos de Luanda",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}