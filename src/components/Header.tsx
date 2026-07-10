import { Download } from "lucide-react";
import s from "./Header.module.css";

const RELEASES = "https://github.com/EntonioDMI/muza-client/releases/latest";

export default function Header() {
  return (
    <header className={s.header}>
      <div className={s.inner}>
        <a href="#top" className={s.brand} aria-label="Muza — наверх">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/glyph.svg" alt="" className={s.glyph} />
          <span className={s.wordmark}>Muza</span>
        </a>
        <nav className={s.nav} aria-label="Разделы">
          <a href="#lyrics">Тексты</a>
          <a href="#features">Возможности</a>
          <a
            href="https://github.com/EntonioDMI/muza-client"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>
        <a className={`btn btn-accent ${s.cta}`} href={RELEASES}>
          <Download strokeWidth={1.75} className={s.ctaIcon} />
          Скачать
        </a>
      </div>
    </header>
  );
}
