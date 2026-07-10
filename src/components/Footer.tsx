import s from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={`container ${s.footer}`}>
      <span className={s.brand}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/glyph.svg" alt="" className={s.glyph} />
        <span>Muza · {new Date().getFullYear()}</span>
      </span>
      <nav className={s.links} aria-label="Ссылки">
        <a
          href="https://github.com/EntonioDMI/muza-client"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        <a href="https://github.com/EntonioDMI/muza-client/releases/latest">
          Скачать
        </a>
      </nav>
    </footer>
  );
}
