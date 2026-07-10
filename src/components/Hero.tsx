import { Download } from "lucide-react";
import AppMockup from "./AppMockup";
import GitHubMark from "./GitHubMark";
import s from "./Hero.module.css";

const RELEASES = "https://github.com/EntonioDMI/muza-client/releases/latest";
const REPO = "https://github.com/EntonioDMI/muza-client";

export default function Hero() {
  return (
    <section className={s.hero} id="top">
      <h1 className={s.title}>
        Музыка <span className={s.titleAccent}>без блюра</span>
      </h1>
      <p className={s.sub}>
        Muza — бесплатный плеер для Windows. Полные синхронизированные тексты
        песен, умная очередь и звук, который подстраивается под тебя.
      </p>
      <div className={s.actions}>
        <a className="btn btn-accent" href={RELEASES}>
          <Download strokeWidth={1.75} className={s.btnIcon} />
          Скачать для Windows
        </a>
        <a
          className="btn btn-surface"
          href={REPO}
          target="_blank"
          rel="noopener noreferrer"
        >
          <GitHubMark className={s.btnIcon} />
          Исходники
        </a>
      </div>
      <p className={s.note}>Windows 10/11 · без подписок и рекламы</p>
      <div className={s.mockupSlot}>
        <AppMockup />
      </div>
    </section>
  );
}
