import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MAJURE Admin",
  description: "Админ-панель персонала, заявок и поддержки MAJURE.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body>{children}</body>
    </html>
  );
}
