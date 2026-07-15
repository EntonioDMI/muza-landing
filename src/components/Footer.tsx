import { REPOSITORY_RELEASES_URL, WEB_APP_URL, type LandingRelease } from "@/lib/release";
import s from "./Footer.module.css";

export default function Footer({ release }: { release: LandingRelease }) {
  return (
    <footer className={`container ${s.footer}`}>
      <span className={s.brand}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/glyph.svg" alt="" className={s.glyph} />
        <span>Muza · {new Date().getFullYear()}</span>
      </span>
      <nav className={s.links} aria-label="Ссылки">
        <a href={WEB_APP_URL}>Веб-версия</a>
        <a
          href="https://github.com/EntonioDMI/muza-client"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        {release.kind === "available" ? (
          <a className={s.releaseLink} href={release.downloadUrl}>
            {`Скачать Muza ${release.tag}`}
          </a>
        ) : (
          <a
            className={s.releaseLink}
            href={REPOSITORY_RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Следить за релизом
          </a>
        )}
        <a href="/privacy">Твои данные</a>
      </nav>
    </footer>
  );
}
