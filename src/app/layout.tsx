import type { Metadata, Viewport } from "next";
/* Onest — ОСНОВНОЙ шрифт продукта с 11.08.2026 (обоснование смены — в
   packages/ui/src/tokens/fonts.css). Лендинг оставался на Golos четыре дня и
   показывал продукт шрифтом, которого у продукта уже нет; хуже — его же
   демо-переключатель «Шрифт» предлагал Golos / Unbounded / системный, и Onest
   в списке не было вовсе, то есть единственное место страницы, где обещано
   «попробуй прямо здесь», врало о дефолте. Веса те же четыре, что в ДС. */
import "@fontsource/onest/400.css";
import "@fontsource/onest/500.css";
import "@fontsource/onest/600.css";
import "@fontsource/onest/700.css";
import "@fontsource/golos-text/400.css";
import "@fontsource/golos-text/500.css";
import "@fontsource/golos-text/600.css";
import "@fontsource/golos-text/700.css";
/* Unbounded — только 600: все 12 мест с --font-display набраны --fw-semibold,
   начертания 500 и 700 не звал никто, а весили как весь остальной текст
   страницы. Единственный, кому они доставались, — демо-переключатель шрифта
   в «Твоей Muza»: он делает Unbounded шрифтом всего лендинга, и теперь та
   превьюшка рисуется одним начертанием. Меняешь --fw-* у --font-display —
   подключи здесь и нужный вес, иначе браузер дорисует его синтетически. */
import "@fontsource/unbounded/600.css";
import "./globals.css";

const SITE_URL = "https://muza.lol";
const TITLE = "Muza — музыка без цензуры";
const DESCRIPTION =
  "Бесплатный музыкальный плеер для Windows с полными синхронизированными текстами песен — без блюра, звёздочек и подписок.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Muza",
    title: TITLE,
    description: DESCRIPTION,
    locale: "ru_RU",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Muza — музыка без цензуры" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/icon.png", type: "image/png" }],
    apple: "/icon.png",
  },
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
      <body>
        <a href="#main" className="skip-link">
          К содержимому
        </a>
        {children}
      </body>
    </html>
  );
}
