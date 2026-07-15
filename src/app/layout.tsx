import type { Metadata, Viewport } from "next";
import "@fontsource/golos-text/400.css";
import "@fontsource/golos-text/500.css";
import "@fontsource/golos-text/600.css";
import "@fontsource/golos-text/700.css";
import "@fontsource/unbounded/500.css";
import "@fontsource/unbounded/600.css";
import "@fontsource/unbounded/700.css";
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
