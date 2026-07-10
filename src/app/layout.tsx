import type { Metadata, Viewport } from "next";
import "@fontsource/golos-text/400.css";
import "@fontsource/golos-text/500.css";
import "@fontsource/golos-text/600.css";
import "@fontsource/golos-text/700.css";
import "@fontsource/unbounded/500.css";
import "@fontsource/unbounded/600.css";
import "@fontsource/unbounded/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Muza — музыка без цензуры",
  description:
    "Бесплатный музыкальный плеер для Windows с полными синхронизированными текстами песен — без блюра, звёздочек и подписок.",
};

export const viewport: Viewport = {
  themeColor: "#121110",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
