import { Download } from "lucide-react";
import type { LandingRelease } from "@/lib/release";
import s from "./Header.module.css";

export default function Header({ release }: { release: LandingRelease }) {
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
        {release.kind === "available" ? (
          <a className={`btn btn-accent ${s.cta}`} href={release.downloadUrl}>
            <Download strokeWidth={1.75} className={s.ctaIcon} aria-hidden="true" />
            {`Скачать Muza ${release.tag}`}
          </a>
        ) : (
          <span className={`${s.cta} ${s.status}`} role="status" aria-disabled="true">
            Релиз готовится
          </span>
        )}
      </div>
    </header>
  );
}
